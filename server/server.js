'use strict'

var express = require('express')
var app = express()
var router = express.Router()
var bodyParser = require('body-parser')
const fs = require('fs')
var parse = require('csv-parse')
var proxy = require('express-http-proxy')
var path = require('path');
var apicache = require('apicache')
var AppState = require('./appstate.js')
var logger = require('./logger.js')
let cache = apicache.middleware

var arqCandidatos = './data/candidatos.csv',
	arqCoords = './data/coords.csv',
	arqPartidos = './data/partidos.json',
	arqMunicipios = './data/municipios.csv',
	port = 8008,
	verbose = false,
	debugMode = false,
	developmentMode = false,
	distFolder = __dirname + '/dist/',
	publicFolder = __dirname + '/public/',
 	candidatos = [],
 	candidatosPorId = {},
 	candidatosPorUf = {},
 	candidatosPorUfAno = {},
 	candidatosPorUfAnoCargo = {},
 	candidatosPorUfCargo = {},
	coordsArray = [],
	coordenadas = {},
	coordenadasPorUf = {},
	municipios = [],
	municipiosPorUf = {},
	partidos = [],
	timeStarted = null


const onlyStatus200 = (req, res) => res.statusCode === 200

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

router.use(function (req, res, next) {
	if (debugMode) {
		logger.info(req.path)
	}	
	next()
})	

function getOptions () {
	const commandLineArgs = require('command-line-args')
 
	const optionDefinitions = [
	  { name: 'verbose', alias: 'v', type: Boolean, help: 'Modo verboso' },
	  { name: 'debug', alias: 'd', type: Boolean, help: 'Modo de depuração'},
	  { name: 'port', alias: 'p', type: Number, multiple: false, defaultOption: 8000, help: 'A porta à qual o servidor vai responder. Default é 8000' },
	  { name: 'candidatos', alias: 'a', type: String, defaultOption: './data/candidatos.csv', help: 'Nome do arquivo de candidatos. Default é ./data/candidatos.csv' },
	  { name: 'coords', alias: 'c', type: String, defaultOption: './data/coords.csv', help: 'Nome do arquivo de coordenadas. Default é ./data/coords.csv' },
	  { name: 'partidos', alias: 't', type: String, defaultOption: './data/partidos.json', help: 'Nome do arquivo de partidos políticos. Default é ./data/partidos.json'},
	  { name: 'municipios', alias: 'm', type: String, defaultOption: './data/municipios.json', help: 'Nome do arquivo de dados do IBGE dos municípios. Default é ./data/municipios.csv'},
	  { name: 'dev', type: Boolean, help: 'True durante o desenvolvimento' }
	]

	var options = commandLineArgs(optionDefinitions, {partial: true})
	if (options._unknown) {
		print('Servidor do CEPESP Atlas Eleitoral')
		print('Opcões:')
		optionDefinitions.forEach((definition) => console.log('    --' + definition.name + ' ou -' + definition.alias + ': ' + definition.help))
		process.exit()
	}
	return options
}

function print () {
	console.log.apply(this, arguments)
}

function verboseprint () {
	if (verbose)
		console.log.apply(this, arguments)
}

function normalizarNome (str) {
	if (!str)
		return null
	return str.toUpperCase().
		replace('Á', 'A').
		replace('É', 'E').
		replace('Í', 'I').
		replace('Ó', 'O').
		replace('Ú', 'U').
		replace('À', 'A').
		replace('È', 'E').
		replace('Ã', 'A').
		replace('Õ', 'O').
		replace('Ê', 'E').
		replace('Ô', 'O').
		replace('Ç', 'C').
		replace('Ñ', 'N')
}

function filterCandidates (arrayCandidatos, uf, ano, cargo, nome, nomeCompleto, cpf, partido, resultado) {
	return arrayCandidatos.filter((candidato) => {
		if (Array.isArray(candidato))
			return false
		if (uf && candidato.uf != uf)
			return false
		if (ano && candidato.ano != ano)
			return false
		if (cargo && candidato.cargo != cargo)
			return false
		if (nome && candidato.nomeNormalizado.indexOf(nome) < 0)
			return false
		if (nomeCompleto && candidato.nomeCompletoNormalizado.indexOf(nomeCompleto) < 0)
			return false
		if (cpf && candidato.cpf != cpf)
			return false
		if (partido && candidato.partido != partido)
			return false
		if (resultado && candidato.resultado != resultado)
			return false
		return true
	})
}


if (!developmentMode) {
	app.get('/', function (req, res) {
		logger.info(req.ip + ' requested /')
	    res.sendFile(path.join(distFolder + 'index.html'))
	});

	app.get('/dist/build.js', function (req, res) {
		res.sendFile(path.join(distFolder + 'build.js'))
	})

	app.get('/dist/build.js.map', function (req, res) {
		res.sendFile(path.join(distFolder + 'build.js.map'))	
	})

	app.use('/public', express.static(publicFolder));

	const onlyStatus200 = (req, res) => res.statusCode === 200
	const cacheSuccesses = cache('5 days', onlyStatus200)
	app.use('/cepesp', cacheSuccesses, proxy('http://cepesp.io/', {
		limit: '10mb'
	}))
}
else {
	console.log('Operando em modo de desenvolvimento')
}


router.route('/api/candidatos')
	.get(function (req, res) {
		var { id, uf, ano, cargo, nome, nomecompleto, nomeCompleto, cpf, partido, resultado } = req.query
		nomeCompleto = nomeCompleto || nomecompleto
		//if (cargo == 'pr1' || cargo == 'pr2')
		//	uf = null
		var arrayAFiltrar = []
		if (uf) {
			uf = uf.toUpperCase()
		}
		try {
			if (id) {
				let ids = id.split(',')
				ids.forEach(id => {
					if (candidatosPorId[id] && !arrayAFiltrar.includes(candidatosPorId[id])) {
						arrayAFiltrar.push(candidatosPorId[id])
					}
				})
			}
			else if (uf && ano && cargo)
				arrayAFiltrar = candidatosPorUfAnoCargo[uf][ano][cargo]
			else if (uf && ano)
				arrayAFiltrar = candidatosPorUfAno[uf][ano]
			else if (uf && cargo)
				arrayAFiltrar = candidatosPorUfCargo[uf][cargo]
			else if (uf)
				arrayAFiltrar = candidatosPorUf[uf]
			else
				arrayAFiltrar = candidatos
		}
		catch (err) {
			if (debugMode) {
				print(err)
			}
			arrayAFiltrar = []
		}	
		if (cpf) {
			// Os CPFs têm pelo menos 9 dígitos. Normalizamos para 11 dígitos. 
			cpf = ('00' + cpf).substr(-11)	
		}
		nome = normalizarNome(nome)
		nomeCompleto = normalizarNome(nomeCompleto)
		return res.json(filterCandidates(arrayAFiltrar, uf, ano, cargo, nome, nomeCompleto, cpf, partido, resultado))
/*
		map(({id, nome, uf, ano, partido, cargo, numero, classificacao, votacao}) => {
			return {id, nome, uf, ano, partido, cargo, numero, classificacao, votacao}
		}))
*/		
	})

router.route('/api/partidos')
	.get(function (req, res) {
		res.json(partidos)
	})

router.route('/api/coordenadas')
	.get(function (req, res) {
		var { id, uf } = req.query
		if (id)
			return res.json(coordenadas[id])
		if (uf) {
			return res.json(coordenadasPorUf[uf.toUpperCase()])
		}
		return res.status(400).json({ error: 'Please specify ID or UF' })
	})
	
router.route('/api/municipios')	
	.get(function (req, res) {
		var { id, uf } = req.query
		if (uf) {
			uf = uf.toUpperCase()
			if (!municipiosPorUf[uf])
				return res.status(400).json({ error: 'UF ' + uf + ' does not exist'})
			return res.json(municipiosPorUf[uf])
		}	
		else {
			var ufs = []
			for (var uf in municipiosPorUf)
				ufs.push(uf)
			return res.json(ufs)
		}
		return res.status(400).json({ error: 'Please specify ID or UF' })
	})

app.get('/api/state/:id', async (req, res) => {
	var id = req.params.id
	logger.info(req.ip + ' requested path /' + id)

	try {
		var appState = await AppState.getAppState(id)
		if (!appState) {
			return res.status(400).json({ error: 'Not found' })
		}
		return res.status(200).json(appState)
	} 
	catch (err) {
		logger.error(err)
		return res.status(500).json({ error: 'Error loading appState' })
	}	
})

app.post('/api/state', async (req, res) => {
	var appState = req.body
	//var appState = req.body.appState
	if (!appState || !appState.uf || !appState.candidatos) {
		return res.status(400).json({ error: 'Invalid data'})
	}
	var id = await AppState.saveAppState(appState)
	if (!id) {
		return res.status(500).json({ error: 'Internal error' })
	} 
	logger.info(req.ip + ' saved map with id ' + id)
	return res.status(200).json({ id })
})

app.get('/api/cache/index', (req, res) => {
	res.json(apicache.getIndex())
})

app.get('/api/status', (req, res) => {
	res.json({
		timeStarted,
		cacheIndex: apicache.getIndex()
	})
})


// Identifica se a chamada corresponde ao formato
// /appstateId
// Caso corresponda, devolve /index.html para o cliente
// appStateId é sempre uma string de seis letras, e o
// primeiro caractere é sempre uma letra maiúscula 

app.use(function (req, res, next) {
	if (isAppstateId(req.url)) {
    	return res.sendFile(path.join(distFolder + 'index.html'))
	}
	next()
})

function isAppstateId (url) {
	var appstateIdRegexp = /^\/[A-Z][a-zA-z]{5}$/
	if (!url)
		return false
	return appstateIdRegexp.test(url)
}


function parseCandidateRow (row) {

	const cargos = ['pr', 'vpr', 'g', 'vg', 's', 'df', 'de', 'de', '1s', '2s', 'pm', 'vpm', 'vm']

	var nome = row['NOME_URNA_CANDIDATO'],
		nomeCompleto = row['NOME_CANDIDATO'],
		cpf = row['CPF_CANDIDATO'],
		uf = row['UF'] || row['SIGLA_UF'],
		ano = row['ANO_ELEICAO'],
		partido = row['SIGLA_PARTIDO'],
		cargo = cargos[parseInt(row['CODIGO_CARGO']) - 1],
		numero = parseInt(row['NUMERO_CANDIDATO']),
		resultado = row['DESC_SIT_TOT_TURNO'],
		classificacao = parseInt(row['CLASSIFICACAO'] || -1),
		votacao = parseInt(row['QTDE_VOTOS'])

	if (cargo == 'pr' || cargo == 'g')
		cargo = cargo + row['NUM_TURNO']
	return {
		nome,
		nomeCompleto,
		nomeNormalizado: normalizarNome(nome),
		nomeCompletoNormalizado: normalizarNome(nomeCompleto),
		cpf,
		uf,
		ano,
		partido,
		cargo,
		numero,
		id: uf + '-' + ano + '-' + cargo + '-' + numero,
		resultado,
		classificacao,
		votacao
	}
}	


function parseCoordinateRow (row) {
	var id = row[0],
	uf = row[1],
		municipio = row[2],
		zona = row[3],
		lat = row[4],
		long = row[5],
		codTse = row[6]
	return {
		id,
		uf,
		municipio,
		zona,
		lat,
		long,
		codTse
	}
}


function promisifiedParse (fileData, options) {
	return new Promise ((resolve, reject) => {
		parse(fileData, options, (err, data) => {
			if (err) {
				reject(err)
			}
			resolve(data)
		})	
	})
}

var options = getOptions()
port = options.port || port
arqCandidatos = options.candidatos || arqCandidatos
arqCoords = options.coords || arqCoords
arqMunicipios = options.municipios || arqMunicipios
verbose = options.verbose || verbose
debugMode = options.debug || debugMode
developmentMode = options.dev || developmentMode



function loadCandidates (next) {

	logger.info('Carregando candidatos...')
	try {
		var fileData = fs.readFileSync(arqCandidatos)
	    parse(fileData, {delimiter: ',', trim: true, columns: true}, function (err, rows) {
	    	if (err) {
				logger.error(`Error trying to parse file ${arqCandidatos}`)
	    		logger.error(err)
	    		process.exit()
	    	}
	 		logger.info(rows.length + ' candidatos carregados')
	    	candidatos = rows
	    		.filter((row) => parseInt(row['CODIGO_CARGO']) <= 8)	// Elimina todos os prefeitos e vereadores
	    		.map((row) => parseCandidateRow(row))

	    	candidatos.forEach((candidato) => {
	    		var {id, uf, ano, cargo} = candidato
	    		if (!candidatosPorUf[uf])
	    			candidatosPorUf[uf] = []

	    		if (!candidatosPorUfCargo[uf])
	    			candidatosPorUfCargo[uf] = {}
	    		if (!candidatosPorUfCargo[uf][cargo])
	    			candidatosPorUfCargo[uf][cargo] = []

	    		if (!candidatosPorUfAno[uf])
	    			candidatosPorUfAno[uf] = {}
	    		if (!candidatosPorUfAno[uf][ano])
	    			candidatosPorUfAno[uf][ano] = []		// Note que a propriedade ano é uma string

	    		if (!candidatosPorUfAnoCargo[uf])
	    			candidatosPorUfAnoCargo[uf] = {}
	    		if (!candidatosPorUfAnoCargo[uf][ano])
	    			candidatosPorUfAnoCargo[uf][ano] = {}
	    		if (!candidatosPorUfAnoCargo[uf][ano][cargo])
	    			candidatosPorUfAnoCargo[uf][ano][cargo] = []

	    		candidatosPorId[id] = candidato
	    		candidatosPorUf[uf].push(candidato)
	    		candidatosPorUfCargo[uf][cargo].push(candidato) 
	    		candidatosPorUfAnoCargo[uf][ano][cargo].push(candidato)
	    	})	

	    	var sumarioCandidato = ({ numero,nome,votacao }) => numero + ' ' + nome + ', ' + votacao + ' votos'

	    	if (debugMode) {
		    	print('todos os candidatos a presidente:')
		    	console.log(candidatosPorUf['SP']['pr1']
		    		.sort((a, b) => (a.ano * 100 + a.numero) - (b.ano * 100 + b.numero))
		    		.map(sumarioCandidato))
		    	console.log('candidatos a governador em 2014')
		    	console.log(candidatosPorUf['SP'][2014]['g1']
		    		.map(sumarioCandidato))
		    }	

		    if (next) {
		    	next()
		    }
	  	})
	}  	
	catch (error) {
		logger.error('Erro tentando abrir o arquivo ' + arqCandidatos)
		logger.error(error)
		process.exit()
	}

}


function loadParties (next) {
	logger.info('Carregando partidos políticos...')
	try {
		partidos = JSON.parse(fs.readFileSync(arqPartidos, 'utf8'));
		if (next) {
			next()
		}
	}
	catch (error) {
		logger.error('Erro tentando abrir o arquivo ' + arqPartidos)
		logger.error(error)
		process.exit()
	}
}


function loadCoordinates (next) {
	logger.info('Carregando coordenadas...')
	try {
		var fileData = fs.readFileSync(arqCoords)
		parse(fileData, {delimiter: ',', trim: true, from: 2}, function (err, rows) {
			if (err) {
	    		logger.error(`Error trying to parse file ${arqCoords}`)
	    		logger.error(err)
	    		process.exit()
	    	}
	    	logger.info(rows.length + ' coordenadas carregadas')
	    	coordsArray = rows.map((row) => parseCoordinateRow(row))
	    	coordenadas = coordsArray.reduce((coordenadas, coord) => {
				var id = coord.id
	    		coordenadas[id] = coord
	    		return coordenadas
	    	}, {})
	    	coordenadasPorUf = coordsArray.reduce((coordsPorUf, coordenada) => {
	    		let uf = coordenada.uf.toUpperCase()
	    		if (!coordsPorUf[uf])
	    			coordsPorUf[uf] = [coordenada]
	    		else
	    			coordsPorUf[uf].push(coordenada) 
	    		return coordsPorUf
	    	}, {})
	    	if (verbose)
	    		Object.entries(coordenadasPorUf).forEach(([uf, coords]) => print(uf + ': ' + coords.length + ' coordenadas carregadas'))

	    	if (next) {
	    		next()
	    	}
		})
	}
	catch (error) {
		logger.error('Erro tentando abrir o arquivo ' + fileName)
		logger.error(error)
		process.exit()
	}
}



function parseIbgeData (row) {
	var newObj = {}
	for (var key in row) {
		if (key == 'id' || key == 'uf' || key == 'nome')
			newObj[key] = row[key]
		else
			newObj[key] = parseFloat(row[key])
	}
	return newObj
}


function loadIbgeData (next) {
	logger.info('Carregando dados IBGE dos municípios...')
	try {
		var fileData = fs.readFileSync(arqMunicipios)
		parse(fileData, {delimiter: ';', trim: true, columns: true}, function (err, rows) {
	    	if (err) {
	    		logger.error(`Error trying to parse file ${arqMunicipios}`)
	    		logger.error(err)
	    		process.exit()
	    	}
	 		logger.info(`Dados IBGE de ${ rows.length } municípios carregados`)
	    	municipios = rows.map(parseIbgeData)

	    	municipiosPorUf = {}
	    	municipios.forEach((municipio) => {
	    		let uf = municipio.uf.toUpperCase()
	    		if (!municipiosPorUf[uf])
	    			municipiosPorUf[uf] = []
	    		municipiosPorUf[uf].push(municipio)
			})   
			if (next) {
				next()
			}
		})
	}
	catch (error) {
		logger.error('Erro tentando abrir o arquivo ' + arqMunicipios)
		logger.error(error)
		process.exit()
	}
}


function startServer () {
	app.use('', router)
	app.listen(port)

	logger.info('Servidor do CEPESP Atlas Eleitoral operando na porta ' + port)
}


function executeFunctions () {
	const functionsArr = [
		loadCandidates,
		loadParties,
		loadCoordinates,
		loadIbgeData,
		startServer
	]
	var	functionsIndex = -1

	function executeNextFunction () {
		functionsIndex += 1
		if (functionsArr[functionsIndex]) {
			functionsArr[functionsIndex](executeNextFunction)
		}	
	}

	executeNextFunction ()
}

print('Servidor do CEPESP Atlas Eleitoral')
executeFunctions ()







