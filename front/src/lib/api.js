import axios from 'axios'
import Store from './store.js'		// *** REMOVE THIS LATER

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
		var query = addQuery(null, 'uf', uf)

		return new Promise((resolve, reject) => {
			axios.get(atlasURL + '/coordenadas' + query)
			.then((response) => {
				var data = response.data

				//**********************************************************************	
				Store.coordenadas = data   // MOVE THIS TO THE CORRECT PLACE, IN APP.VUE  
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
		var query = addQuery(null, 'cargo', cargo)
		query = addQuery(query, 'ano', ano)
		query = addQuery(query, 'agregacao_politica', 1) 
		query = addQuery(query, 'agregacao_regional', 7)
		query = query + '&' + buildSearchQuery('NUM_TURNO', turno, 0)
		query = query + '&' + buildSearchQuery('UF', uf, 1)
		query = query + '&' + buildSearchQuery('NUMERO_CANDIDATO', numero, 2)

		//console.log(query);

		return new Promise ((resolve, reject) => {
			axios.get(cepespURL + '/votos' + query)
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
		var query = addQuery(null, 'ano', ano)
		query = addQuery(query, 'cargo', cargo)
		query = addQuery(query, 'agregacao_politica', 4) 
		query = addQuery(query, 'agregacao_regional', 7)
		query = query + '&' + buildSearchQuery('NUM_TURNO', turno, 0)
		query = query + '&' + buildSearchQuery('UF', uf, 1)

		// No time for niceties. The query below is guaranteed to work:
		query = `?ano=${ano}&cargo=${cargo}&agregacao_regional=7&agregacao_politica=4&columns[0][name]=UF&columns[0][search][value]=${uf}&columns[1][name]=NUM_TURNO&columns[1][search][value]=${turno}`
		//console.log(query);

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
			axios.get(cepespURL + '/tse' + query)
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
	}

}