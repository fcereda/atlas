var _coordsPorUf = {},
	_coordenadas = {},
	_municipios  = {},
	_municipiosArr = [],
	_candidatos = [],
	_candidatosPorId = {},
	_callbackCandidatos = []

function calcCandidatoId ({ ano, cargo, numero }) {
	return ano + '-' + cargo + '-' + numero
}

function callCallbacksCandidato (action, candidato) {
	_callbackCandidatos.forEach((callbackObj) => {
		callbackObj.callback.call(callbackObj.contexto, action, candidato)
	})
}

export default {

	set coordenadas(coords) {
		_coordenadas = coords
		return coords	
	},

	get coordenadas() {
		return _coordenadas
	},

	set municipios (municipios) {
		_municipios = municipios
		_municipiosArr = Object.keys(_municipios).map((codTse) => municipios[codTse])
		return _municipios
	},

	get municipios () {
		return _municipios
	},

	get municipiosArr () {
		return _municipiosArr
	},

	get candidatos() {
		return _candidatos
	},

	getCoordByUf (uf) {
		return _coordsByUf[uf]
	},

	calcCoordenadaId (codigoMunicipio, codigoZona) {
		return ("0000" + parseInt(codigoMunicipio)).slice(-5) + '-' + ("00" + parseInt(codigoZona)).slice(-3)
		return codigoMunicipio + '-' + ("00" + parseInt(codigoZona)).slice(-3)
	},

	calcCandidatoId ({ ano, cargo, numero }) {
		return `${ano}-${cargo}-${numero}`
	},

	adicionarCandidato (candidato) {
		if (!candidato.id)
			candidato.id = calcCandidatoId(candidato)
		if (_candidatos.indexOf(candidato) < 0)
			_candidatos.push(candidato)
		_candidatosPorId[candidato.id] = candidato
		callCallbacksCandidato('adicionar', candidato)
		return candidato
	},

	removerCandidato (candidato) {
		// The _candidatos array contains objects that are not the same
		// as the candidato object referenced in the function, so we
		// must look it up by id
		var id = this.calcCandidatoId(candidato),
			index = _candidatos.map((esteCandidato) => esteCandidato.id).indexOf(id)
		if (index >= 0) {
			_candidatos.splice(index, 1)
			_candidatosPorId[id] = null
			callCallbacksCandidato('remover', candidato)
			return candidato
		}
		return null
	},

	removerTodosCandidatos () {
		while (_candidatos.length) {
			var candidato = _candidatos.pop()
			callCallbacksCandidato('remover', candidato)
		}
	},

	obterCandidatoPorId (id) {
		return _candidatosPorId[id]
	},

	obterCandidato (candidato) {
		return this.obterCandidatoPorId(this.calcCandidatoId(candidato))
	},

	desabilitarCandidato (candidato) {
		var id = this.calcCandidatoId(candidato) 
		if (!_candidatosPorId[id]) 
			return null
		_candidatosPorId[id].disabled = true
		callCallbacksCandidato('desabilitar', _candidatosPorId[id])
		return true
	},

	habilitarCandidato (candidato) {
		var id = this.calcCandidatoId(candidato)
		if (!_candidatosPorId[id])
			return null
		_candidatosPorId[id].disabled = false
		callCallbacksCandidato('habilitar', _candidatosPorId[id])
	},

	adicionarCallbackCandidatos (callback, contexto) { 
		for (var index = _callbackCandidatos.length-1; index > 0; index--)
			if (_callbackCandidatos[index].callback == callback) {
				_callbackCandidatos[index].contexto = contexto
				return _callbackCandidatos[index]
			}

		var callbackObj = {	callback, contexto }
		_callbackCandidatos.push(callbackObj)
		return callbackObj 
	},

	removerCallbackCandidatos (callback) {
		for (var index = _callbackCandidatos.length-1; index >= 0; index--)
			if (_callbackCandidatos[index].callback == callback) {
				return _callbackCandidatos.splice(index, 1)
			}

		return null
	}

}