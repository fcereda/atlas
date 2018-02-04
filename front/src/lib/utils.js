const CARGOS_CURTO = {
	'pr1': 'Presidente T1',
	'pr2': 'Presidente T2',
	'g1' : 'Governador T1',
	'g2' : 'Governador T2',
	's'  : 'Senador',
	'df' : 'D Federal',
	'de' : 'D Estadual',
	'dd' : 'D Distrital',
	'pm' : 'Prefeito',
	'pm1': 'Prefeito T1',
	'pm2': 'Prefeito T2',
	'v'	 : 'Vereador'
}

const CARGOS = {
	'pr1': 'Presidente 1º turno',
	'pr2': 'Presidente 2º turno',
	'g1' : 'Governador 1º turno',
	'g2' : 'Governador 2º turno',
	's'  : 'Senador',
	'df' : 'Deputado Federal',
	'de' : 'Deputado Estadual',
	'dd' : 'Deputado Distrital',
	'pm' : 'Prefeito',	
	'pm1': 'Prefeito 1º turno',
	'pm2': 'Prefeito 2º turno',
	'v'	 : 'Vereador'
}

const UFS = [{
	sigla: 'AC',
	nome: 'Acre',
	codIbge: 12
}, {
	sigla: 'AL',
	nome: 'Alagoas',
	codIbge: 27
}, {
	sigla: 'AP',
	nome: 'Amapá',
	codIbge: 16
}, {
	sigla: 'AM',
	nome: 'Amazonas',
	codIbge: 13
}, {
	sigla: 'BA',
	nome: 'Bahia',
	codIbge: 29
}, {
	sigla: 'CE',
	nome: 'Ceará',
	codIbge: 23
}, {
	sigla: 'DF',
	nome: 'Distrito Federal',
	codIbge: 53
}, {
	sigla: 'ES',
	nome: 'Espírito Santo',
	codIbge: 32
}, {
	sigla: 'GO', 
	nome: 'Goiás',
	codIbge: 52
}, {
	sigla: 'MA',
	nome: 'Maranhão',
	codIbge: 21
}, {
	sigla: 'MT',
	nome: 'Mato Grosso',
	codIbge: 51
}, {
	sigla: 'MS',
	nome: 'Mato Grosso do Sul',
	codIbge: 50
}, {
	sigla: 'MG',
	nome: 'Minas Gerais',
	codIbge: 31
}, {
	sigla: 'PA',
	nome: 'Pará',
	codIbge: 15
}, {
	sigla: 'PB',
	nome: 'Paraíba',
	codIbge: 25
}, {
	sigla: 'PR',
	nome: 'Paraná',
	codIbge: 41
}, {
	sigla: 'PE',
	nome: 'Pernambuco',
	codIbge: 26
}, {
	sigla: 'PI',
	nome: 'Piauí',
	codIbge: 22
}, {
	sigla: 'RJ',
	nome: 'Rio de Janeiro',
	codIbge: 33
}, {
	sigla: 'RN',
	nome: 'Rio Grande do Norte',
	codIbge: 24
}, {
	sigla: 'RS',
	nome: 'Rio Grande do Sul',
	codIbge: 43
}, {    			
	sigla: 'RO',
	nome: 'Rondônia',
	codIbge: 11
}, {
	sigla: 'RR',
	nome: 'Roraima',
	codIbge: 14
}, {
	sigla: 'SC',
	nome: 'Santa Catarina',
	codIbge: 42
}, {
	sigla: 'SP',
	nome: 'São Paulo',
	codIbge: 35
}, {
	sigla: 'SE',
	nome: 'Sergipe',
	codIbge: 28
}, {
	sigla: 'TO',
	nome: 'Tocantins',
	codIbge:  17
}]


export default {

	capitalizeName (name) {

		const exclusions = [
			'E', 'DA', 'DE', 'DO', 'DAS', 'DOS'
		]

		var words = name.split(' ')
		return words.map((word) => {
			word = word.toUpperCase();
			if (word.length <= 3 && exclusions.indexOf(word) >= 0)
				return word.toLowerCase()

			return word.substr(0, 1).toUpperCase() + word.substr(1, word.length-1).toLowerCase()
		}).join(' ')

	},

	normalizeNome (str) {
		if (!str)
			return str
		return str.toUpperCase().
			replace('Á', 'A').
			replace('É', 'E').
			replace('Í', 'I').
			replace('Ó', 'O').
			replace('Ú', 'U').
			replace('À', 'A').
			replace('È', 'E').
			replace('Ã', 'A').
			replace('À', 'A').
			replace('Õ', 'O').
			replace('Ô', 'O').
			replace('Ç', 'C').
			replace('Ñ', 'N')
	},	

	formatInt (num) {
		var thisNum = num,
			str = ''

		do {
			let centenas = ('00' + (thisNum % 1000)).slice(-3)
			str = centenas + (str ? '.' + str : '') 
			thisNum = Math.floor(thisNum / 1000)
		} while (thisNum)

		return str.replace(/^0{1,2}/gm, '')

	},

	clone (obj) {
		return JSON.parse(JSON.stringify(obj));
	},

	groupBy (arr, criteriaFunc) {
	    return arr.reduce((dict, item) => {
	        var id = criteriaFunc(item)
	        dict[id] = (dict[id] || [])
	        dict[id].push(item)
	        return dict
	    }, {})
	},

	replaceLast (str, substr, newsubstr) {
    	var charpos = str.lastIndexOf(substr)
    	if (charpos<0) {
    		return str
    	} 		
    	var left = str.substring(0, charpos),
    		right = str.substring(charpos+(substr.length))
    	return left + newsubstr + right
	},

	obterNomeCargo (codigoCargo, curto) {

		return curto ? CARGOS_CURTO[codigoCargo] : CARGOS[codigoCargo]

	},	

	obterCargos (curto) {
		var cargosArray = [],
			objBase = curto ? CARGOS_CURTO : CARGOS
		for (var id in objBase) {
			cargosArray.push({
				id,
				name: CARGOS[id]
			})
		}
		return cargosArray.slice(0,8)	// Por enquanto, vamos ignorar os cargos municipais
	},

	obterCodigoCargo (numCargo, numTurno) {
		const codigos = {
			1: 'pr',
			3: 'g',
			5: 's',
			6: 'df',
			7: 'de',
			8: 'dd'
		}		
		var codigo = codigos[numCargo]
		if (!codigo)
			return null
		if (numCargo < 4) {
			if (!numTurno)
				return null
			codigo = codigo + numTurno
		}
		return codigo
	},

	obterUfs () {
		return UFS
	},

	obterUfPorCodIbge (codIbge) {
		for (var i=0; i<UFS.length; i++)
			if (UFS[i].codIbge == codIbge)
				return UFS[i]
		return null	
	},

	obterUfPorSigla (siglaUf) {
		for (var i=0; i<UFS.length; i++)
			if (UFS[i].sigla == siglaUf)
				return UFS[i]
		return null	
	},

	calcCoordenadaId (codigoMunicipio, codigoZona) {
		return ("0000" + parseInt(codigoMunicipio)).slice(-5) + '-' + ("00" + parseInt(codigoZona)).slice(-3)
	}

}