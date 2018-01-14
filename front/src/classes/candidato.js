'use strict'

import api from '../lib/api.js'
import Store from '../lib/store.js'
import Utils from '../lib/utils.js'

/*
var api,
    Utils

if (!window) {
    console.log("Running in node.js")
    api = require('./api.js')
    Utils = require('./utils.js')
}
else {
    api = require('../lib/api.js')
    Utils = require('../lib/utils.js')
} 
*/

class Candidato {
  
    constructor ({nome, nomeCompleto, cpf, cargo, ano, uf, partido, numero, classificacao, votacao, resultado}) {
        if (!uf || !ano || !cargo || !numero || !nome)
            throw Error('Error in constructor Candidato: object passed as argument must have properties uf, ano, cargo, numero and nome')
        ano = parseInt(ano)
        if (![1998,2000,2002,2004,2006,2008,2010,2012,2014,2016].includes(ano)) 
            throw Error('Error in constructor Candidato: invalid value for property ano in argument object')
        console.log(Utils)
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
		this.habilitado = false	// O estado inicial do objeto candidato é desabilitado
    }

    // carregarVotacao() usa a API do CEPESP para obter os dados de votação do
    // candidato por distrito (zona-município) e calcula os índices LQ, LD e IP
    // Retorna uma promise que, no caso de êxito, envia o próprio objeto this para o callback .then()
	
    carregarVotacao () {
        var totalVotos = {},
            totalGeral = 0
        
        // Primeiro obtemos a votação total de cada distrito. Isso é necessário
        // para calcularmos as porcentagens e os índices
        return api.getTotalVotesByZoneAndCity(this)
        .then((data) => {
            data.forEach(({codigoMunicipio, codigoZona, votos}) => {
                var id = Store.calcCoordenadaId(codigoMunicipio, codigoZona)
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
                
            data.forEach(({ codigoMunicipio, codigoZona, votos }) => {
                var id = Store.calcCoordenadaId(codigoMunicipio, codigoZona),  // NÃO DEVERIA SER Store.calcDistritoId () ?
                    votesObj = {
                        id,
                        numero: votos,
                        total: totalVotos[id],
                        porcentagem: votos / totalVotos[id]
                    }
                votes[id] = votesObj
                votesArray.push(votesObj)
                totalCandidato += votos	
                if (!totalVotos[id]) {
                    console.error('No voting total for district ' + id)
                }
            })
            // Adiciona registros ao dicionário votes para os distritos onde o candidato não teve nenhum voto
			// Note que totalVotos contém os votos de TODOS os distritos do estado
            for (var id in totalVotos) {
                if (!votes[id]) {
                    votes[id] = {
                        id,
                        numero: 0,
                        total: totalVotos[id],
                        porcentagem: 0
                    }
                }
            }
            // Vamos agora calcular os índices LQ (location quotient) e LD (location difference) de cada distrito
            // O LQ de um distrito é definido como: 
            // (votos do candidato no distrito / total de votos do candidato) / (total de votos do distrito / total geral de votos)
            // O LD de um distrito é definidi como:
            // (votos do candidato no distrito / total de votos do distrito) - (total de votos do candidato / total geral de votos)
            var indices = {},
                somaIndiceLQ = 0        
            for (var id in votes) {
                let votosCandidatoDistrito = votes[id].numero
                if (votosCandidatoDistrito) {
                    // Calcula os índices apenas para os distritos onde o candidato teve pelo menos 1 voto
                    let totalVotosDistrito = totalVotos[id],
                        indiceLQ = (votosCandidatoDistrito / totalCandidato) / (totalVotosDistrito / totalGeral),
                        indiceLD = (votosCandidatoDistrito / totalVotosDistrito) - (totalCandidato / totalGeral)

                    indices[id]	= {
                        id, 
                        tamanhoDistrito: totalVotosDistrito,	// tamanhoDistrio será necessário para plotar o gráfico do índice com o tamanho certo
                        indiceLQ,
                        indiceLD,
                        indiceRI: 1.0    // já inicializamos o índice de relevância com o valor menos significativo (1.0)
                    }
                    somaIndiceLQ += indiceLQ		// ISSO ESTÁ ERRADO MAS AINDA NÃO SEI COMO É O CERTO
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
                // Note que o distrito mais votado sempre tem o índice IP de 0,
                distrito.acumulado = acumulado  
                acumulado += porcentagem
                return acumulado
            }, 0)
            votesArray.forEach(({ id, acumulado }) => {
                indices[id].indiceRI = acumulado
            })

            this.total = totalCandidato  			// totalCandidato deve ser igual a this.votacao
            this.totalEleicao = totalGeral  
            this.indiceLQGlobal = somaIndiceLQ		// NOTE QUE O CÁLCULO DE somaIndiceLQ AINDA ESTÁ ERRADO

            this.votos = votes
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
        debugger
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

        for (var distritoId in this.indices) {
            indicesDict[distritoId] = this.indices[distritoId][nomeIndice]
        }

        return indicesDict
    }

}

export default Candidato

//module.exports = Candidato