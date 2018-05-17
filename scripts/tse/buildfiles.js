'use strict'

const fs = require('fs')
const csv = require('csv-parser')
const csvWriter = require('csv-write-stream')
const path = require('path')
const Utils = require('./utils.js')

//const logger = require('logger')

main ()


async function main () {
    const ufs = [
        'AC', 'AL', 'AM', 'AP',
        'BA', 'CE', 'DF','ES', 'GO',
        'MA', 'MG', 'MS', 'MT',
        'PA', 'PB', 'PE', 'PI', 'PR',
        'RJ', 'RN', 'RO', 'RR', 'RS',
        'SC', 'SE', 'SP', 'TO'
    ]
//    const ufs = ['AC', 'AM']
    const options = getOptions()
    const ano = options.ano
    for (var i=0; i<ufs.length; i++) {
        try {
            await criarArquivosParaUFeAno(ufs[i], ano)
        }
        catch (err) {
            console.error(err)
        }
    }
}    

function getOptions () {
    const commandLineArgs = require('command-line-args')
 
    const optionDefinitions = [
      { name: 'verbose', alias: 'v', type: Boolean, help: 'Modo verboso' },
      { name: 'debug', alias: 'd', type: Boolean, help: 'Modo de depuração'},
      { name: 'ano', alias: 'a', type: Number, default: 2014, help: 'Ano da eleição'}
    ]

    var options = commandLineArgs(optionDefinitions, {partial: true})
    if (options._unknown) {
        console.log('Atlas Eleitoral -- construtor dos arquivos de dados\n')
        console.log('Opcões:')
        optionDefinitions.forEach((definition) => console.log('    --' + definition.name + ' ou -' + definition.alias + ': ' + definition.help))
        process.exit()
    }
    return options
}


async function criarArquivosParaUFeAno (uf, ano) {
    console.log(`\nCriando arquivos para ${uf}, ano ${ano}`)
    
        try {
            createDirectories(uf, ano)
            let [
                votacoesCandidatos, 
                candidatosById, 
                zonasById,
            ]  = await carregarVotacoes(uf, ano, 'candidato')
            let [votacoesPartidos,   partidosById]    = await carregarVotacoes(uf, ano, 'partido')
            let [votacoesPresidente, presidentesById] = await carregarVotacoes('BR', ano, 'candidato')
            votacoesPresidente = votacoesPresidente.filter(votacao => votacao.uf == uf)

            const votacoes = [...votacoesPresidente, ...votacoesCandidatos, ...votacoesPartidos]
            candidatosById = {...partidosById, ...presidentesById, ...candidatosById}
            console.log('\n')
            console.log(`número de pares votação/candidato = ${votacoes.length}`)
            console.log(`número de candidatos (a partir de candidatosById) = ${Object.keys(candidatosById).length}`)
            console.log(`número de zonas = ${Object.keys(zonasById).length}`)

            // Apaga as variáveis temporárias 
            votacoesCandidatos = null
            votacoesPartidos = null
            votacoesPresidente = null
            partidosById = null
            presidentesById = null

            await gravarArquivosVotacoes(uf, ano, votacoes, candidatosById, zonasById)
            await gravarArquivosTotaisVotacoes(uf, ano, votacoes, candidatosById, zonasById)
            await gravarArquivosVotacaoPorZona(uf, ano, votacoes, candidatosById, zonasById)
        }
        catch (err) {
            throw (err)
        }
}

function carregarVotacoes (uf, ano, tipo='candidato') {
    const headersPorTipo = {
        'candidato': [
            'DATA_GERACAO',
            'HORA_GERACAO',
            'ANO_ELEICAO',
            'NUM_TURNO',
            'DESCRICAO_ELEICAO',
            'SIGLA_UF',
            'SIGLA_UE',
            'CODIGO_MUNICIPIO',
            'NOME_MUNICIPIO',
            'NUMERO_ZONA',
            'CODIGO_CARGO',
            'NUMERO_CAND',
            'SQ_CANDIDATO',
            'NOME_CANDIDATO',
            'NOME_URNA_CANDIDATO',
            'DESCRICAO_CARGO',
            'COD_SIT_CAND_SUPERIOR',
            'DESC_SIT_CAND_SUPERIOR',
            'CODIGO_SIT_CANDIDATO',
            'DESC_SIT_CANDIDATO',
            'CODIGO_SIT_CAND_TOT',
            'DESC_SIT_CAND_TOT',
            'NUMERO_PARTIDO',
            'SIGLA_PARTIDO',
            'NOME_PARTIDO',
            'SEQUENCIAL_LEGENDA',
            'NOME_COLIGACAO',
            'COMPOSICAO_LEGENDA',
            'TOTAL_VOTOS',
            'TRANSITO'
        ],
        'partido': [
            'DATA_GERACAO',
            'HORA_GERACAO',
            'ANO_ELEICAO',
            'NUM_TURNO',
            'DESCRICAO_ELEICAO',
            'SIGLA_UF',
            'SIGLA_UE',
            'CODIGO_MUNICIPIO',
            'NOME_MUNICIPIO',
            'NUMERO_ZONA',
            'CODIGO_CARGO',
            'DESCRICAO_CARGO',
            'TIPO_LEGENDA', 
            'NOME_COLIGACAO',
            'COMPOSICAO_LEGENDA',
            'SIGLA_PARTIDO',
            'NUMERO_PARTIDO',
            'NOME_PARTIDO',
            'QTDE_VOTOS_NOMINAIS',
            'QTDE_VOTOS_LEGENDA',
            'TRANSITO'
        ]}            
    const headers = headersPorTipo[tipo]
    const filename = `./data/votacao_${tipo}_munzona_${ano}_${uf.toUpperCase()}.txt`
   
    print(`Carregando dados do arquivo ${filename}`)
    return new Promise((resolve, reject) => {
        let votacoes = []
        let candidatosById = {}
        let zonasById = {}

        fs.createReadStream(filename, {encoding: 'latin1'})
        .pipe(csv({
            raw: false,
            separator: ';', 
            quote: '"',
            headers
        }))
        .on('data', function (row) {
            if (row.TRANSITO == 'S') {
                // Ignoramos voto em trânsito!
                return
            }    
            let {votacao, candidato, zona} = parseRow(row)
            if (!candidatosById[candidato.id]) {
                candidatosById[candidato.id] = candidato
            }                
            if (!zonasById[zona.id]) {
                zonasById[zona.id] = zona
            }
            votacoes.push(votacao)
        })
        .on('end', function () {
            resolve([votacoes, candidatosById, zonasById])
        })
        .on('error', function (error) {
            reject(error)
        })
    })
}

function parseRow (row) {
    const colunasUteis = [
        'SIGLA_UF',
        'ANO_ELEICAO',
        'NUM_TURNO',
        'CODIGO_MUNICIPIO',
        'NUMERO_ZONA',
        'CODIGO_CARGO',
        'NUMERO_CAND',
        'NOME_CANDIDATO',
        'NOME_URNA_CANDIDATO',
        'SIGLA_PARTIDO',
        'NOME_MUNICIPIO',
        'TOTAL_VOTOS',
    ]
    
    let retObj = colunasUteis.reduce((obj, coluna) => {
        obj[coluna] = row[coluna]
        return obj
    }, {})
    retObj.cargo = Utils.codigoCargoAtlas(retObj.CODIGO_CARGO, retObj.NUM_TURNO)
    if (!retObj.NUMERO_CAND) {
        // Se entrarmos aqui, a linha corresponde à votação de um partido
        retObj.NOME_URNA_CANDIDATO = row.SIGLA_PARTIDO
        retObj.NOME_CANDIDATO = row.NOME_PARTIDO
        retObj.NUMERO_CAND = row.NUMERO_PARTIDO
        retObj.TOTAL_VOTOS = row.QTDE_VOTOS_LEGENDA
    }
    retObj.id = `${retObj.SIGLA_UF}-${retObj.ANO_ELEICAO}-${retObj.cargo}-${retObj.NUMERO_CAND}`
    retObj.idZona = Utils.calcMunZonaId(retObj.CODIGO_MUNICIPIO, retObj.NUMERO_ZONA)
 
    return {
        votacao: {
            idCandidato: retObj.id,
            idZona: retObj.idZona,
            cargo: retObj.cargo,
            uf: retObj.SIGLA_UF,
            'TOTAL_VOTOS': retObj.TOTAL_VOTOS
        },
        candidato: {
            id: retObj.id,
            cargo: retObj.cargo,
            'NUMERO_CAND': retObj.NUMERO_CAND,
            'NOME_CANDIDATO': retObj.NOME_CANDIDATO,
            'NOME_URNA_CANDIDATO': retObj.NOME_URNA_CANDIDATO,
            'SIGLA_PARTIDO': retObj.SIGLA_PARTIDO
        },
        zona: {
            id: retObj.idZona,
            'CODIGO_MUNICIPIO': retObj.CODIGO_MUNICIPIO,
            'NOME_MUNICIPIO': retObj.NOME_MUNICIPIO,
            'NUMERO_ZONA': retObj.NUMERO_ZONA
        }
    }        
}


async function gravarArquivosVotacoes (uf, ano, votacoes, candidatosById, zonasById) {
    const votacoesByIdCandidato = Utils.groupBy(votacoes, votacao => votacao.idCandidato)
    for (var id in votacoesByIdCandidato) {
        print('Gravando votações do candidato ' + id)
        let rows = votacoesByIdCandidato[id]
        .filter(objVotacao => parseInt(objVotacao.TOTAL_VOTOS) > 0)
        .map(objVotacao => {
            let candidato = candidatosById[objVotacao.idCandidato]
            let zona = zonasById[objVotacao.idZona]
            let votacao = {
                ...objVotacao,
                ...candidato,
                ...zona,
                id,
                ANO_ELEICAO: ano,
                NUM_TURNO: ['pr2', 'g2'].includes(candidato.cargo) ? 2 : 1
            }
            return converterObjetoVotacao(votacao)
        })            
        let filename = getPath(id + '.csv', 'candidatos')
        await gravarArquivoCSV(filename, rows)
    }
    console.log('Arquivos de votações dos candidatos foram gravados com êxito')
}

function converterObjetoVotacao (objVotacao) {
    const campos = {
        'NUMERO_CANDIDATO': 'NUMERO_CAND',
        'ANO_ELEICAO': 'ANO_ELEICAO',
        'NUM_TURNO': 'NUM_TURNO',
        'COD_MUN_TSE': 'CODIGO_MUNICIPIO',
        'NUM_ZONA': 'NUMERO_ZONA',
        'NOME_MUNICIPIO': 'NOME_MUNICIPIO',
        'QTDE_VOTOS': 'TOTAL_VOTOS',
        'ID_ZONA': 'idZona'
    }

    let retObj = {}
    for (let campo in campos) {
        retObj[campo] = objVotacao[campos[campo]]
    }       
    return retObj
}

async function gravarArquivosTotaisVotacoes (uf, ano, votacoes, candidatosById, zonasById) {
    const byCargo = votacao => votacao.cargo
    const votacoesByCargo = Utils.groupBy(votacoes, byCargo)
    
    for (let cargo in votacoesByCargo) {
        print(`Gravando arquivo de votações para o cargo ${cargo}`)
        const byZona = votacao => votacao.idZona
        const votacoesByZona = Utils.groupBy(votacoesByCargo[cargo], byZona)
        let totaisPorZona = []
        for (let idZona in votacoesByZona) {
            let zona = zonasById[idZona]
            let numTurno = ['pr2', 'g2'].includes(cargo) ? 2 : 1
            let total = votacoesByZona[idZona].reduce((total, votacao) => total + parseInt(votacao.TOTAL_VOTOS), 0)
            totaisPorZona.push({
                'ANO_ELEICAO': ano,
                'NUM_TURNO': numTurno,
                'NUM_ZONA': zona.NUMERO_ZONA,
                'COD_MUN_TSE': zona.CODIGO_MUNICIPIO,
                'NOME_MUNICIPIO': zona.NOME_MUNICIPIO,
                'QT_VOTOS_NOMINAIS': total,
                'QT_VOTOS_LEGENDA': 0
            })
        }
        let filename = getPath(`${uf}-${ano}-${cargo}.csv`, 'totais')
        await gravarArquivoCSV(filename, totaisPorZona)
    }
    
    console.log('Arquivos de totais de votação foram gravados com êxito')
}

async function gravarArquivosVotacaoPorZona (uf, ano, votacoes, candidatosById, zonasById) {
    const byZona = votacao => votacao.idZona
    const votacoesByZona = Utils.groupBy(votacoes, byZona)
    
    for (let idZona in votacoesByZona) {
        const byCargo = (votacao) => votacao.cargo
        const ordemDescendente = (a, b) => b.TOTAL_VOTOS - a.TOTAL_VOTOS
        let zona = zonasById[idZona]
        let votacoesDestaZona = votacoesByZona[idZona]
        print(`Processando lista de mais votados da zona ${idZona}`)
        let votacoesByCargo = Utils.groupBy(votacoesDestaZona, byCargo)
        for (let cargo in votacoesByCargo) {
            let numTurno = ['pr2', 'g2'].includes(cargo) ? 2 : 1
            let votacoesDesteCargo = votacoesByCargo[cargo]
            votacoesDesteCargo = votacoesDesteCargo.filter(votacao => votacao.TOTAL_VOTOS > 0)
            votacoesDesteCargo = votacoesDesteCargo.sort(ordemDescendente)
            votacoesDesteCargo = votacoesDesteCargo.map(votacao => {
                let candidato = candidatosById[votacao.idCandidato]
                let retObj = {
                    'ANO_ELEICAO': ano,
                    'NUM_TURNO': numTurno,
                    'NUM_ZONA': zona.NUMERO_ZONA,
                    'COD_MUN_TSE': zona.CODIGO_MUNICIPIO,
                    'NOME_MUNICIPIO': zona.NOME_MUNICIPIO,
                    'UF': uf,
                    'NOME_URNA_CANDIDATO': candidato.NOME_URNA_CANDIDATO,
                    'NUMERO_CANDIDATO': candidato.NUMERO_CAND,
                    'SIGLA_PARTIDO': candidato.SIGLA_PARTIDO,
                    'QTDE_VOTOS': votacao.TOTAL_VOTOS
                }
                return retObj
            })
            let filename = getPath(`${uf}-${ano}-${idZona}-${cargo}.csv`, 'maisvotados')
            await gravarArquivoCSV(filename, votacoesDesteCargo)
        }
    }
    console.log('Arquivos de mais votados por zona e cargo foram gravados com êxito')
}

async function gravarArquivoCSV (filename, rows, headers) {
    if (!filename || !rows) {
        throw 'Error in gravarArquivoCSV: arguments filename and rows are required'
    }
    return new Promise((resolve, reject) => {
        try {
            const writer = csvWriter(headers)
            writer.pipe(fs.createWriteStream(filename))
            writer.on('finish', function () {
                resolve(filename)
            });    
            rows.forEach(row => writer.write(row))
            writer.end()
        }
        catch (err) {
            reject(err)
        }
    })
}

function getPath (filename, subdir) {
    const basepath = './dist'
    const components = filename.split('-')
    let thispath
    // Verificar se os dois primeiros componentes são uma UF e um ano
    if (components[0].length == 2 && components[0].toUpperCase() == components[0] &&
        components[1].length == 4 && parseInt(components[1]) == components[1]) {
        thispath = path.join(basepath, subdir, components[0], components[1], filename)
    }
    else {
        thispath = path.join(basepath, subdir, filename)
    }
    return thispath
}

function createDirectories (uf, ano) {
    const basepaths = ['candidatos', 'totais', 'maisvotados']
    basepaths.forEach(basepath => {
        let thispath = path.join('./dist', basepath, uf)
        try {
            fs.mkdirSync(thispath)
        }
        catch (err) {}
        thispath = path.join(thispath, ano.toString())
        try {
            fs.mkdirSync(thispath)
        }
        catch (err) {}
    })
}

function print (str) {
    process.stdout.clearLine()    
    process.stdout.write(str + '\r')
}