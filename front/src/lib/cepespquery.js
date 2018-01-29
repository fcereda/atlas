'use strict'

const camposPadrao = {

	'/tse': {

		agregacoesPoliticas: {
			0: ["ANO_ELEICAO","NUM_TURNO","CODIGO_CARGO","DESCRICAO_CARGO","NUMERO_PARTIDO","SIGLA_PARTIDO","NOME_CANDIDATO","NUMERO_CANDIDATO","QTDE_VOTOS"],
			1: ["ANO_ELEICAO","NUM_TURNO","CODIGO_CARGO","DESCRICAO_CARGO","SIGLA_PARTIDO","QTDE_VOTOS"],
			2: ["ANO_ELEICAO","NUM_TURNO","CODIGO_CARGO","DESCRICAO_CARGO","NUMERO_PARTIDO","SIGLA_PARTIDO","NOME_CANDIDATO","NUMERO_CANDIDATO","QTDE_VOTOS"],
			3: ["ANO_ELEICAO","NUM_TURNO","CODIGO_CARGO","DESCRICAO_CARGO","COMPOSICAO_COLIGACAO","QTDE_VOTOS"],
			4: ["ANO_ELEICAO","NUM_TURNO","CODIGO_CARGO","DESCRICAO_CARGO","QTD_APTOS","QTD_COMPARECIMENTO","QTD_ABSTENCOES","QT_VOTOS_NOMINAIS","QT_VOTOS_LEGENDA"],
		},

		agregacoesRegionais: {
			0: [ 'UF' ],
			1: [ 'NOME_MACRO', 'UF' ],
			2: [ 'UF' ],
			4: [ 'UF', 'NOME_MESO' ],
			5: [ 'NOME_MICRO' ],
			6: [ 'UF', 'NOME_MUNICIPIO', 'COD_MUN_TSE' ],
			7: [ 'UF', 'NOME_MUNICIPIO', 'COD_MUN_TSE', 'NUM_ZONA' ],
			8: [ 'UF', 'NUM_ZONA' ]

		}

	},

	'/votos': {

		agregacoesRegionais: {
			0: [ "UF" ],
			1: [ 'NOME_MACRO' ],
			2: [ 'UF' ],
			4: [ 'UF', 'NOME_MESO' ],
			5: [ 'NOME_MICRO' ],
			6: [ 'UF', 'NOME_MUNICIPIO', 'COD_MUN_TSE' ],
			7: [ 'UF', 'NOME_MUNICIPIO', 'COD_MUN_TSE', 'NUM_ZONA' ],
			8: [ 'UF', 'NUM_ZONA' ] 
		},

		agregacoesPoliticas: {
			0: [ "ANO_ELEICAO", "SIGLA_UE","NUMERO_CANDIDATO","NUM_TURNO","DESCRICAO_CARGO","QTDE_VOTOS" ]
		}

	},

	'/candidatos': {

		agregacaoesRegionais: {
			0: [ 'ANO_ELEICAO', 'NUM_TURNO', 'DESCRICAO_ELEICAO', 'SIGLA_UF', 'SIGLA_UE', 'CODIGO_CARGO', 'NUMERO_PARTIDO', 'SIGLA_PARTIDO', 'NUMERO_CANDIDATO', 'DES_SITUACAO_CANDIDATURA', 'DESC_SIT_TOT_TURNO' ]
		},

		agregacoesPoliticas: {
			0: []
		}
	},

	'/legendas': {

		agregacoesRegionais: {
			0: [ 'ANO_ELEICAO', 'NUM_TURNO', 'SIGLA_UF', 'SIGLA_UE', 'CODIGO_CARGO', 'NUMERO_PARTIDO', 'SIGLA_PARTIDO', 'COMPOSICAO_COLIGACAO', 'TIPO_LEGENDA' ]
		},

		agregacoesPoliticas: {
			0: []
		}

	}
}



class CepespQuery {
	constructor (arg) {
		var path,
			agregacaoRegional = 0,
			agregacaoPolitica = 0,
			ano,
			cargo,
			uf

		if (typeof(arg) == 'object') {
			path = arg.path
			agregacaoRegional = arg.agregacaoRegional || 0
			agregacaoPolitica = arg.agregacaoPolitica || 0
			ano = arg.ano
			cargo = arg.cargo
			uf = arg.uf
		}
		else if (typeof(arg) == 'string') {
			path = arg
		}

		path = path.toLowerCase() || '/tse'
		if (path.charAt(0) != '/') {
			path = '/' + path
		}
		if (!(path in camposPadrao)) {
			throw new Error('CepespQuery error: path ' + path + ' is not valid\n' + 
							'Valid paths are ' + Object.keys(camposPadrao).join(', '))
		}
		this.path = path
		this.ano = ano
		this.cargo = cargo
		this.uf = uf
		this.agregacaoRegional = agregacaoRegional
		this.agregacaoPolitica = agregacaoPolitica

		this.filters = []
		this.fields = []
		this.searches = []

		this.addFilter('ano', ano)
		this.addFilter('cargo', cargo)
		this.addFilter('uf_filter', uf)
		this.addFilter('agregacao_regional', agregacaoRegional)
		this.addFilter('agregacao_politica', agregacaoPolitica)
	}

	addFilter (filter, value) {
		if (!filter || !value)
			return this
		if (filter == 'uf') {
			filter = 'uf_filter'
		}
		this.removeFilter(filter)
		this.filters.push({
			filter,
			value
		})
		return this
	}

	removeFilter (filter) {
		this.filters = this.filters.filter(filterObj => filterObj.filter != filter)  
		return this	
	}

	addField (field) {
		if (!field)
			return this
		if (!this.fields.includes(field)) {
			this.fields.push(field)
		}
		return this
	}

	addFields (fields) {
		if (!fields || !fields.length)
			return this
		fields.forEach((field) => this.addField(field))
		return this
	}

	addStandardFields (arg) {
		var fields,
			agregacaoRegional = 0,
			agregacaoPolitica = 0
		if (arg) {
			agregacaoPolitica = arg.agregacaoPolitica || agregacaoPolitica
			agregacaoRegional = arg.agregacaoRegional || agregacaoRegional
		}
		if (camposPadrao[this.path]['agregacoesPoliticas']) {
			let fields = camposPadrao[this.path]['agregacoesPoliticas'][agregacaoPolitica]
			if (fields) {
				this.addFields(fields)
			}
		}
		if (camposPadrao[this.path]['agregacoesRegionais']) {
			let fields = camposPadrao[this.path]['agregacoesRegionais'][agregacaoRegional]
			if (fields) {
				this.addFields(fields)
			}
		}
		return this
	}

	removeField (field) {
		if (!this.fields.includes(field)) {
			return this
		}
		this.fields = this.fields.filter(thisField => thisField != field)
		return this
	}

	addSearch (field, value) {
		this.removeSearch(field)
		this.searches.push({
			field,
			value
		})
		return this
	}

	removeSearch (field) {
		this.searches = this.searches.filter((searchObj) => searchObj.field != field)
		return this		
	}

	url () {
		var query = '',
			standardFields = [
				...camposPadrao[this.path]['agregacoesRegionais'][this.agregacaoRegional],
				...camposPadrao[this.path]['agregacoesPoliticas'][this.agregacaoPolitica]
			]

		function addSubquery (subquery) {
			query += query ? '&' : '?'
			query += subquery
			return query   
		}

		this.filters.forEach((filter) => {
			addSubquery(filter.filter + '=' + filter.value)
		})
		this.fields.forEach((field) => {
			addSubquery('selected_columns[]=' + field)
		})

		this.searches.forEach((search, index) => {
			if (![...standardFields, ...this.fields].includes(search.field)) {
				console.log('Não encontrou o campo ' + search.field)
				addSubquery('selected_columns[]=' + search.field)
			}
			addSubquery(`columns[${index}][name]=${search.field}`)
			addSubquery(`columns[${index}][search][value]=${encodeURI(search.value)}`)
		})
		return this.path + query
	}

	toString () {
		return this.url()
	}

}

module.exports = CepespQuery