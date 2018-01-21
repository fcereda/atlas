'use strict'

import api from '../lib/api.js'
import Utils from '../lib/utils.js'
import Store from '../lib/store.js'

var SimpleStats = require('simple-statistics')

/*
var api = require('./api.js'),
    Utils = require('./utils.js'),
    ArrayMath = require('./array-math.js'),
    Coordenadas = require('./coordenadas.js')
*/

class Candidato {
  
    constructor ({nome, nomeCompleto, cpf, cargo, ano, uf, partido, numero, classificacao, votacao, resultado}) {
        if (!uf || !ano || !cargo || !numero || !nome)
            throw Error('Error in constructor Candidato: object passed as argument must have properties uf, ano, cargo, numero and nome')
        ano = parseInt(ano)
        if (![1998,2000,2002,2004,2006,2008,2010,2012,2014,2016].includes(ano)) 
            throw Error('Error in constructor Candidato: invalid value for property ano in argument object')
        numero = parseInt(numero)
        if (!['df', 'de', 'dd'].includes(cargo) || numero > 100) {
            this.nome = Utils.capitalizeName(nome)
            if (nomeCompleto)  
                this.nomeCompleto = Utils.capitalizeName(nomeCompleto)
        }    
        this.cpf = cpf
        this.cargo = cargo
        this.ano = ano
        this.uf = uf.toUpperCase()
        this.partido = partido
        this.numero = numero
        this.classificacao = classificacao
        this.votacao = votacao
        this.resultado = resultado
        
        this.votosPorDistrito = {}
        this.indices = {}
        this.habilitado = false // O estado inicial do objeto candidato é desabilitado
    }

    // carregarVotacao() usa a API do CEPESP para obter os dados de votação do
    // candidato por distrito (zona-município) e calcula os índices LQ, LD e IP
    // Retorna uma promise que, no caso de êxito, envia o próprio objeto this para o callback .then()
    
    carregarVotacao () {
        var coordenadas = Store.coordenadas,
            totalVotos = {},
            totalGeral = 0
        
        // Primeiro obtemos a votação total de cada distrito. Isso é necessário
        // para calcularmos as porcentagens e os índices
        return api.getTotalVotesByZoneAndCity(this)
        .then((data) => {
            data.forEach(({codigoMunicipio, codigoZona, votos}) => {
                var id = Utils.calcCoordenadaId(codigoMunicipio, codigoZona)
                if (totalVotos[id])
                    totalVotos[id] += votos
                else
                    totalVotos[id] = votos
                totalGeral += votos
            })
            // Somente carregamos os votos do candidato quando tivermos os votos totais das zonas
            return api.getVotesByZoneAndCity(this)
        }) 
        .then((data) => {
            // Neste momento, data é um array de objetos {codigoMunicipio, codigoZonas, votos}
            // que contém os votos totais de todos os distritos do estado
            // Vamos converter esse array em um dicionário

            var votes = {},
                votesArray = [],
                totalCandidato = 0
                
            votesArray = data.map(({ codigoMunicipio, codigoZona, votos }) => {
                var id = Utils.calcCoordenadaId(codigoMunicipio, codigoZona),  // NÃO DEVERIA SER Store.calcDistritoId () ?
                    votesObj = {
                        id,
                        numero: votos,
                        total: totalVotos[id],
                        porcentagem: votos / totalVotos[id]
                    }
                votes[id] = votesObj
                totalCandidato += votos 
                if (!totalVotos[id]) {
                    console.error('No voting total for district ' + id)
                }
                return votesObj
            })
            // Adiciona registros a votes e a votesArray para os distritos onde o candidato não teve nenhum voto
            // Note que totalVotos contém os votos de TODOS os distritos do estado
            for (var id in totalVotos) {
                if (!votes[id]) {
                    votes[id] = {
                        id,
                        numero: 0,
                        total: totalVotos[id],
                        porcentagem: 0
                    }
                    votesArray.push(votes[id])
                }
            }
            
            // Vamos calcular o desvio padrão e o z-score de cada distrito
            // A média será calculada com base no número total de distritos
/*
            var media = (totalCandidato / totalGeral)
            var variancia = votesArray
                .map(({porcentagem}) => Math.pow(porcentagem - media, 2))
                .reduce((soma=0, valor) => soma + valor)
                variancia = variancia / votesArray.length
            var desvioPadrao = Math.sqrt(variancia)

            console.log('media = ', media)   
            console.log('variancia = ', variancia)
            console.log('desvio padrão = ', desvioPadrao)
*/
            var porcentagemArray = votesArray.map(({porcentagem}) => porcentagem),
                media = SimpleStats.mean(porcentagemArray),
                desvioPadrao = SimpleStats.standardDeviation(porcentagemArray)
            /*
            var zScoreArray = ArrayMath.zScores(porcentagemArray)
            .sort((a, b) => b - a)
            .slice(0, 10)
            */
            
            console.log('media = ', media)   
            //console.log('variancia = ', variancia)
            console.log('desvio padrão = ', desvioPadrao)
            //console.log('zScores = ', zScoreArray)
            
            votesArray.forEach((voteObj) => {
                // votesArray aponta para os mesmos objetos do dict votes, 
                // então basta atualizar em votesArray
                voteObj.media = media
                //voteObj.variancia = variancia
                voteObj.desvioPadrao = desvioPadrao
                voteObj.valorZ = (voteObj.porcentagem - media) / voteObj.desvioPadrao
            })

            // Vamos agora calcular os índices LQ (location quotient), LD (location difference) e 
            // LI (local Moran's I) de cada distrito
            // O LQ de um distrito é definido como: 
            // (votos do candidato no distrito / total de votos do candidato) / (total de votos do distrito / total geral de votos)
            // O LD de um distrito é definidi como:
            // (votos do candidato no distrito / total de votos do distrito) - (total de votos do candidato / total geral de votos)
            // O LI de um distrito é definido como:
            // zScore do distrito * média do zScore dos distritos vizinhos
            var indices = {},
                somaIndiceLQ = 0        
            for (var id in votes) {
                let votosCandidatoDistrito = votes[id].numero
                if (votosCandidatoDistrito) {
                    // Calcula os índices apenas para os distritos onde o candidato teve pelo menos 1 voto
                    let totalVotosDistrito = totalVotos[id],
                        indiceZ = votes[id].valorZ,     
                        indiceLQ = (votosCandidatoDistrito / totalCandidato) / (totalVotosDistrito / totalGeral),
                        indiceLD = (votosCandidatoDistrito / totalVotosDistrito) - (totalCandidato / totalGeral),
                        vizinhos = coordenadas[id] ? coordenadas[id].vizinhos || [] : []
                    if (!vizinhos.length) {
                        // Se entrar aqui, temos um problema com o banco de dados de coordenadas
                        if (!coordenadas[id])
                            console.error('id ' + id + ' não existe no banco de dados de coordenadas')
                        else
                            console.error('id ' + id + ' não tem vizinhos')
                    }
                    let valoresZVizinhos = vizinhos.map(id => votes[id] ? votes[id].valorZ : 0) 
                    if (!valoresZVizinhos.length)
                        valoresZVizinhos = [0]      // HACK to prevent an exception below
                    let localMoran = votes[id].valorZ * SimpleStats.mean(valoresZVizinhos)

                    indices[id] = {
                        id, 
                        tamanhoDistrito: totalVotosDistrito,    // tamanhoDistrio será necessário para plotar o gráfico do índice com o tamanho certo
                        indiceLQ,
                        indiceLD,
                        indiceZ,                                // Incluímos o valor-z como indiceZ
                        indiceRI: 1.0,                          // já inicializamos o índice de relevância com o valor menos significativo (1.0)
                        indiceLI: localMoran
                    }
                    somaIndiceLQ += indiceLQ        // ISSO ESTÁ ERRADO MAS AINDA NÃO SEI COMO É O CERTO
                }    
            }
            // Vamos agora calcular o "Índice de Relevância" (RI)
            // Para isso, ordenamos os distritos por votos (do mais votado ao menos votado) 
            // e calculamos o acumulado das porcentagens 
            // votesArray já contém os votos por id (zona/município)
            // totalCandidato contém a votação total do candidato
            // O resultado vai para indices[id].indiceRI
            votesArray
            .sort((a, b) => b.numero - a.numero)
            .reduce((acumulado, distrito) => {
                var porcentagem = distrito.numero / totalCandidato    
                // Note que o distrito mais votado sempre tem o índice RI de 0 -- é o mais importante
                distrito.acumulado = acumulado  
                acumulado += porcentagem
                return acumulado
            }, 0)
            votesArray.forEach(({ id, acumulado, numero }) => {
                // Inclui o indice RI apenas para os distritos em que o candidato foi votado
                if (numero) {
                    indices[id].indiceRI = acumulado
                }    
            })

            this.total = totalCandidato             // totalCandidato deve ser igual a this.votacao
            this.totalEleicao = totalGeral  
            this.indiceLQGlobal = somaIndiceLQ      // NOTE QUE O CÁLCULO DE somaIndiceLQ AINDA ESTÁ ERRADO
            this.votosArray = votesArray
            this.votosDict = votes
            this.votos = votes                      // Should be deprecated once we adjust Charts.js
          
            this.indices = indices

            return new Promise((resolve, reject) => resolve(this))
        })
        .catch((error) => {
            return new Promise((resolve, reject) => reject(error))
        })
   
    }
    
    get nomeCargo () {
        return Utils.obterNomeCargo(this.cargo)
    }

    get turno () {
        var cargosSegundoTurno = ['pr2', 'g2']

        if (cargosSegundoTurno.includes(this.cargo))
            return 2
        return 1
    }
    
    static calcularId (obj) {
        //  TEMPORARIAMENTE VAMOS DEIXAR DE UTILIZAR A uf
        return `${obj.ano}-${obj.cargo}-${obj.numero}`      
        return `${ obj.uf.toUpperCase() }-${obj.ano}-${obj.cargo}-${obj.numero}`      
    }

    // Candidato.ePartido() retorna true se a combinação cargo,numero corresponde à
    // candidatura de um partido político em eleições legislativas ("votos de legenda")
    static ePartido (cargo, numero) {
        return ['df', 'de', 'dd'].includes(cargo.toLowerCase()) && (numero < 100)
    }    
  
    get id () {
        return Candidato.calcularId(this)
    }
    
    obterVotacaoNoDistrito (distritoId) {
        return this.votos[distritoId] 
    }
    
    obterVotacaoPorDistrito (incluirDistritosSemVoto = false) {
        var votacaoDict = {}

        for (var distritoId in this.votos) {
            if (incluirDistritosSemVoto || this.votos[distritoId].numero) {
                votacaoDict[distritoId] = this.votos[distritoId]            
            }    
        }
        return votacaoDict
      }

    obterIndicePorDistrito (nomeIndice) {
        var indicesDict = {}

        if (['LQ', 'LD', 'RI', 'Z', 'LI'].includes(nomeIndice)) {
            nomeIndice = 'indice' + nomeIndice
        }    
        if (!['indiceLQ', 'indiceLD', 'indiceRI', 'indiceLI', 'indiceZ'].includes(nomeIndice)) {
            throw Error('Error in Candidato.obterIndicePorDistrito: index ' + nomeIndice + ' does not exist')
        }    

        for (var distritoId in this.indices) {
            indicesDict[distritoId] = this.indices[distritoId][nomeIndice]
        }

        return indicesDict
    }
    
    obterIndice (nomeIndice) {
        var indicePorDistrito = this.obterIndicePorDistrito(nomeIndice)
        return Object.keys(indicePorDistrito).map(idDistrito => {
            return {
                id: idDistrito,
                indice: indicePorDistrito[idDistrito]
            }
        })
    }

}

export default Candidato

//module.exports = Candidato