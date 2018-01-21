import CepespQuery from './cepespquery.js'
import axios from 'axios'
import Store from './store.js'		// *** REMOVE THIS LATER
import Utils from './utils.js'

const atlasURL = '/api'
const cepespURL = '/cepesp/api/consulta'

// Cache for total of votes by zone and municipality.
// We do this because a typical use case will have the user 
// reloading this data over and over

// Indexed by ano-cargo-uf
var totalVotesByZoneAndCity = {}

// Aux functions, private to this module

function getCargoETurno (cargo, uf) {

	const CARGOS_E_TURNOS = {
		'pr1': {
			cargo: 1,
			turno: 1
		}, 
		'pr2': {
			cargo: 1,
			turno: 2,
		},
		'g1': {
			cargo: 3,
			turno: 1,
		},
		'g2': {
			cargo: 3,
			turno: 2
		},
		's': {
			cargo: 5,
			turno: 1
		},
		'df': {
			cargo: 6,
			turno: 1
		},
		'de': {
			cargo: uf == 'DF' ? 8 : 7,
			turno: 1
		},
		'pm1': {
			cargo: 11,
			turno: 1
		},
		'pm2': {
			cargo: 11,
			turno: 2,
		},
		'v': {
			cargo: 13,
			turno: 1
		}
	}		

	return CARGOS_E_TURNOS[cargo]

}	

function calcIdElection (ano, cargo, uf) {
	return `${ano}-${cargo}-${uf.toUpperCase()}`
}

/*
function addQuery (query, key, value) {
	if (query)
		query = query + '&'
	else
		query = '?'
	return query + key + '=' + value
}

function buildSearchQuery (key, value, position) {
	var column = 'columns[' + position + ']'
	var query = column + '[name]=' + key
	query = query + '&' + column + '[search][value]=' + value
	return query
}
*/

function getArrayFromCSV (data, selectedFields) {

	function extractRowFromLine (line) {
		var row = line.split(',')
		return row.map((item) => item.slice(1, item.length-1))
	}

	var lines = data.split('\n').filter((line) => line.trim().length > 0),
		headers = extractRowFromLine(lines[0]),
		fields = {}

	// Prepares the fields object
	if (selectedFields) {
		for (let key in selectedFields) 
			fields[key] = headers.indexOf(selectedFields[key])
	}
	else {
		for (let i=0; i<headers.length; i++)
			fields[headers[i]] = i
	}
	// fields is an object that correlates the key to the 
	// position of the value in the row array, i. e.:
	// fields = { 'nome': 1, 'partido': 4}

	// Removes the line that contains the headers (the first line),
	// then map each line to an object 
	lines.splice(0, 1)
	return lines.map((line) => {
		var obj = {},
			row = extractRowFromLine(line)
		for (let key in fields)
			obj[key] = row[fields[key]]
		return obj
	})
}

export default {
	
	getCitiesAndLocations (uf) {
		var query = '?uf=' + uf.toUpperCase()

		return new Promise((resolve, reject) => {
			axios.get(atlasURL + '/coordenadas' + query)
			.then((response) => {
				var data = response.data

				//**********************************************************************	
				//Store.coordenadas = data    MOVE THIS TO THE CORRECT PLACE, IN APP.VUE  
				//**********************************************************************

				// data is an array. We will convert it to a lookup table
				if (!data || !data.length) {
					return reject('No data')
				}
				var coords = {},
					municipios = {}
				data.forEach((coord) => {
					coord.lat = parseFloat(coord.lat)
					coord.long = parseFloat(coord.long)
					coords[coord.id] = coord
					if (!municipios[coord.codTse]) {
						municipios[coord.codTse] = {
							codTse: coord.codTse,
							nome: coord.municipio,
							zonas: [coord]
						}
					}	
					else {
						municipios[coord.codTse].zonas.push(coord)
					}
				});
				Object.keys(municipios).map((codTse) => {
					var municipio = municipios[codTse],
						lat = 0,
						long = 0
					municipio.zonas.forEach((zona) => {
						lat += zona.lat
						long += zona.long
					})
					municipio.lat = lat / municipio.zonas.length
					municipio.long = long / municipio.zonas.length
				})
				resolve({ coords, municipios })
			}) 
			.catch((error) => {
				console.error(error)
				reject(error)
			})
		})
	},

	getVotesByZoneAndCity ({ ano, cargo, uf, numero }) {
		var cargoETurno = getCargoETurno(cargo, uf)
		cargo = cargoETurno.cargo
		var turno = cargoETurno.turno

		var query = new CepespQuery ({
			path: '/votos',
			cargo,
			ano,
			agregacaoRegional: 7
		})
		query = query.addSearch('NUM_TURNO', turno)
		  .addSearch('UF', uf)
		  .addSearch('NUMERO_CANDIDATO', numero)

		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + query.url())  
			.then((response) => {
				var data = getArrayFromCSV(response.data, {
					'numero': 'NUMERO_CANDIDATO',
					'ano': 'ANO_ELEICAO',
					'turno': 'NUM_TURNO',
					'codigoZona': 'NUM_ZONA',
					'codigoMunicipio': 'COD_MUN_TSE',
					'nomeMunicipio': 'NOME_MUNICIPIO',
					'votos': 'QTDE_VOTOS',
				})
				data.forEach((row) => row.votos = parseInt(row.votos))
				resolve(data)
			})
			.catch((error) => {
				reject(error)
			})
		})	

// http://cepesp.io/api/consulta/votos?cargo=1&ano=2010&agregacao_politica=1&agregacao_regional=7&columns[0][name]=UF&columns[0][search][value]=SP&columns[1][name]=NUMERO_CANDIDATO&columns[1][search][value]=45&columns[2][name]=COD_MUN_TSE&colmns[2][search][value]=71072&selected_columns[0]=%22NUM_ZONA%22&selected_columns[1]=%22QTDE_VOTOS%22

	},

	getTotalVotesByZoneAndCity ({ ano, cargo, uf }) {
		var idEleicao = calcIdElection(ano, cargo, uf)

		if (totalVotesByZoneAndCity[idEleicao]) {
			console.log('totalVotes encontrado no cache')
			return new Promise((resolve, reject) => {
				resolve(totalVotesByZoneAndCity[idEleicao])
			})  
		}

		var cargoETurno = getCargoETurno(cargo, uf)
		cargo = cargoETurno.cargo
		var turno = cargoETurno.turno

		var query = new CepespQuery({
			path: '/tse',
			ano,
			cargo,
			agregacaoRegional: 7,
			agregacaoPolitica: 4
		})
		query.addSearch('UF', uf)
		query.addSearch('NUM_TURNO', turno)

/*
		// Fallback para o caso de a API "/tse" do CEPESP parar de funcionar novamente
		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + '/votos' + query)
			.then((response) => {
				var data = getArrayFromCSV(response.data, {
					'ano': 'ANO_ELEICAO',
					'codigoMunicipio': 'COD_MUN_TSE',
					'nomeMunicipio': 'NOME_MUNICIPIO',
					'codigoZona': 'NUM_ZONA',
					'votos': 'QTDE_VOTOS'
				})
				data.forEach((obj) => obj.votos = parseInt(obj.votos))
				totalVotesByZoneAndCity[idEleicao] = data
				resolve(data)	
			})
*/

		//O CÓDIGO COSTUMA FUNCIONAR, MAS ÀS VEZES A API DO CEPESP DÁ PROBLEMA
		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + query.url())
			.then((response) => {
				var data = getArrayFromCSV(response.data, {
					'ano': 'ANO_ELEICAO',
					'turno': 'NUM_TURNO',
					'codigoZona': 'NUM_ZONA',
					'codigoMunicipio': 'COD_MUN_TSE',
					'nomeMunicipio': 'NOME_MUNICIPIO',
					'votosNominais': 'QT_VOTOS_NOMINAIS',
					'votosLegenda': 'QT_VOTOS_LEGENDA'
				})
				//data.forEach((row) => row.votos = parseInt(row.votosNominais) + parseInt(row.votosLegenda))
				var totalVotos = data.map(({ano, turno, codigoZona, codigoMunicipio, votosNominais, votosLegenda}) => {
					return {
						ano,
						turno,
						codigoZona, 
						codigoMunicipio,
						votos: parseInt(votosNominais) + parseInt(votosLegenda)
					}
				})
				totalVotesByZoneAndCity[idEleicao] = totalVotos
				resolve(totalVotos)
			})

			.catch((error) => {
				reject(error)
			})
		})	

// http://cepesp.io/api/consulta/votos?cargo=1&ano=2010&agregacao_politica=1&agregacao_regional=7&columns[0][name]=UF&columns[0][search][value]=SP&columns[1][name]=NUMERO_CANDIDATO&columns[1][search][value]=45&columns[2][name]=COD_MUN_TSE&colmns[2][search][value]=71072&selected_columns[0]=%22NUM_ZONA%22&selected_columns[1]=%22QTDE_VOTOS%22

	},	

	getElectionResultsByZoneAndCity ({ano, cargo, uf, codMunicipio, nomeMunicipio, zona}) {
		if (!ano || !cargo || !uf || (!codMunicipio && !nomeMunicipio))
			return new Promise((resolve, reject) => reject('Missing parameters'))

		var cargoETurno = getCargoETurno(cargo, uf)
		cargo = cargoETurno.cargo
		var turno = cargoETurno.turno
/*		
		var query = `?ano=${ano}&cargo=${cargo}`
		query += '&agregacao_regional=7&agregacao_politica=2&selected_columns[]=SIGLA_PARTIDO&selected_columns[]=NUM_TURNO&selected_columns[]=NOME_MUNICIPIO&selected_columns[]=COD_MUN_TSE&selected_columns[]=NUM_ZONA&selected_columns[]=DESCRICAO_CARGO&selected_columns[]=QTDE_VOTOS&selected_columns[]=NOME_CANDIDATO&selected_columns[]=NOME_URNA_CANDIDATO&selected_columns[]=NUMERO_CANDIDATO&selected_columns[]=UF'
		query += `&columns[0][name]=UF&columns[0][search][value]=${uf}`
		query += `&columns[1][name]=NUM_TURNO&columns[1][search][value]=${turno}`
		if (codMunicipio) {
			query += `&columns[2][name]=COD_TSE_MUN&columns[2][search][value]=${codMunicipio}`
		}
		else if (nomeMunicipio) {
			query += `&columns[2][name]=NOME_MUNICIPIO&columns[2][search][value]=${nomeMunicipio}`	
		}
		if (zona){
			query += `&columns[3][name]=NUM_ZONA&columns[3][search][value]=${zona}`
		}	
*/
		var query = new CepespQuery({
			path: '/tse',
			ano,
			cargo,
			uf,
			agregacaoPolitica: 2,
			agregacaoRegional: 7
		}).addStandardFields({
			'agregacaoPolitica': 2,
			'agregacaoRegional': 7
		}).addField('NOME_URNA_CANDIDATO')
  		  .removeField('DESCRICAO_CARGO')
		  .removeField('NUMERO_PARTIDO')
		  .removeField('NOME_CANDIDATO')
		  .addSearch('NUM_TURNO', turno)
		if (codMunicipio) {
			codMunicipio = ('00000'+codMunicipio).substr(-5)
			query = query.addSearch('COD_MUN_TSE', codMunicipio)
		}
		else if (nomeMunicipio) {
			query = query.addSearch('NOME_MUNICIPIO', nomeMunicipio)
		}

		if (zona) {
			query = query.addSearch('NUM_ZONA', parseInt(zona))
		}

		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + query.url())
			.then((response) => {
				var data = getArrayFromCSV(response.data, {
					'ano': 'ANO_ELEICAO',
					'turno': 'NUM_TURNO',
					'codigoZona': 'NUM_ZONA',
					'codigoMunicipio': 'COD_MUN_TSE',
					'nomeMunicipio': 'NOME_MUNICIPIO',
					'uf': 'UF',
					'nome': 'NOME_URNA_CANDIDATO',
					'numero': 'NUMERO_CANDIDATO',
					'partido': 'SIGLA_PARTIDO',
					'votacao': 'QTDE_VOTOS',
				})
				data.forEach((candidato) => {
					// Em alguns casos excepcionais, parseFloat(candidato.votacao) aparece como NaN
					// Sabemos que um candidato só entra nesta tabela se tiver recebido pelo menos um voto
					// Portanto, quando o candidato tiver recebido 0 ou NaN votos, convertemos para o menor valor válido
					candidato.votacao = parseFloat(candidato.votacao) || 1	
					candidato.cargo = cargo
				})
				resolve(data)
			})
			.catch((error) => {
				reject(error)
			})	
		})
	},

	
	getCandidateCareer (cpf, nomeCompleto) {
		var query = '/api/candidatos?'
		if (cpf)
			query = query + 'cpf=' + cpf
		else if (nomeCompleto)
			query = query + 'nome=' + nomeCompleto
		else
			return new Promise ((resolve, reject) => reject('getCandidateCareer: Invalid arguments'))

		return new Promise ((resolve, reject) => {
			function ehCandidatoAPresidente (candidato) {
				return ['pr1', 'pr2'].includes(candidato.cargo)
			}

			axios.get(query)
			.then((response) => {
					// Eliminamos as linhas com uf == 'ZZ' porque os dados do CEPESP
					// para as eleições aboard (ZZ) estão incorretos
				var data = response.data.filter((cand) => cand.uf != 'ZZ'),
					// Agrupamos as candidaturas por ano-cargo porque, para candidatos
					// a presidente, a API retorna uma candidatura diferente para cada UF 
					candidaturas = Utils.groupBy(data, (cand) => {
						return cand.ano + '-' + cand.cargo
					})

				candidaturas = Object.keys(candidaturas).map((id) => {
					var candPorId = candidaturas[id]
					if (candPorId.length == 1) {
						return candPorId[0]
					}
					return candPorId.reduce((candFinal, cand) => {
						if (!candFinal) {
							candFinal = {...cand, uf:'BR', classificacao: 0}
						}
						else {
							candFinal.votacao += cand.votacao
						}
						return candFinal
					}, null)
				})


				resolve(candidaturas)
				return;

				// O QUE VEM ABAIXO SERÁ APAGADO QUANDO O QUE VEM ACIMA ESTIVER FUNCIONANDO

				// Para os candidatos a presidente, a API envia uma linha para cada 
				// estado. Vamos deixar apenas um row indicando a candidatura a presidente,
				// com uf = 'BR'




				data = data.filter((candidatura) => {
					if (!ehCandidatoAPresidente(candidatura))
						return true
					return (candidatura.uf == 'SP')	// filtramos por SP porque é o maior estado
				}).map((candidatura) => {
					candidatura.ano = parseInt(candidatura.ano)
					candidatura.classificacao = parseInt(candidatura.classificacao)
					candidatura.votacao = parseInt(candidatura.votacao)
					if (candidatura.uf == 'SP' && ehCandidatoAPresidente(candidatura)) {
						candidatura.uf = 'BR'
						candidatura.id = candidatura.id.replace('SP', 'BR')
					}
					return candidatura
				})
				resolve(data)
			})
			.catch((error) => reject(error))
		})

	},

	// A função abaixo não funciona direito infelizmente
	getCandidateCareerFromCEPESP (cpf, nomeCompleto) {
		// MAIS TARDE ATUALIZAMOS ESSA CHAMADA PARA USAR O OBJETO CepespQuery
		var query = `/candidatos?ano=1998,2000,2002,2006,2010,2014&selected_columns[]=ANO_ELEICAO&selected_columns[]=CODIGO_CARGO&selected_columns[]=NUM_TURNO&selected_columns[]=DESCRICAO_CARGO&selected_columns[]=SIGLA_PARTIDO&selected_columns[]=NOME_CANDIDATO&selected_columns[]=NOME_URNA_CANDIDATO&selected_columns[]=SIGLA_UF&selected_columns[]=DESCRICAO_OCUPACAO&selected_columns[]=CODIGO_OCUPACAO&selected_columns[]=CPF_CANDIDATO&selected_columns[]=DESPESA_MAX_CAMPANHA&selected_columns[]=DESC_SIT_TOT_TURNO&columns[0][name]=CPF_CANDIDATO&columns[0][search][value]=(${cpf})`
		//var query = `/api/candidatos?nome=

		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + query)
			.then((response) => {
				var data = getArrayFromCSV(response.data, {
					'ano': 'ANO_ELEICAO',
					'turno': 'NUM_TURNO',
					'codigoCargo': 'CODIGO_CARGO',
					'descricaoCargo': 'DESCRICAO_CARGO',
					'partido': 'SIGLA_PARTIDO',
					'nomeCompleto': 'NOME_CANDIDATO',
					'nome': 'NOME_URNA_CANDIDATO',
					'uf': 'SIGLA_UF',
					'descricaoOcupacao': 'DESCRICAO_OCUPACAO',
					'codigoOcupacao': 'CODIGO_OCUPACAO',
					'despesaMaximaCampanha': 'DESPESA_MAX_CAMPANHA',
					'resultado': 'DESC_SIT_TOT_TURNO'				
				})
				data.forEach((candidato) => {
					candidato.cargo = Utils.obterCodigoCargo(candidato.codigoCargo, candidato.turno)
				})
				resolve(data)
			})
			.catch((error) => {
				reject(error)
			})
		})
	},


	getStateBordersMap (uf) {
		var topoFileAddress = `/public/maps/state/${uf.toLowerCase()}-state.json`
		return axios.get(topoFileAddress)
	},

	getStatesBordersMap () {
		var topoFileAddress = '/public/maps/topo/br-states.min.json'
		return axios.get(topoFileAddress)
	},

	getParties () {
		return axios.get('/api/partidos')
	},

	// This function should never be called by a client of the api object
	runRequest (requestFunc, argsArray, index=0, results=[]) {
		return requestFunc(argsArray[index])
		.then((response) => {
	        results.push(response)
		    index += 1
	        if (index < argsArray.length) {
				return this.runRequest(requestFunc, argsArray, index, results)
			}
			else {
				return new Promise ((resolve, reject) => resolve(results))
			}
		})    
		.catch((error) => {
			return new Promise((resolve, reject) => reject(error))
		})
	},

	// Runs a sequence of api methods, back to back (NOT concurrently). 
	// Accepts two arguments:
	// requestFunc: the api method you want to call 
	// argsArray: the arguments to be passed to requestFunc at each call
	// Returns a promise. If successful, response contains an array of results
	runRequestsInSequence (requestFunc, argsArray) {
		return this.runRequest(requestFunc, argsArray)
	}

}