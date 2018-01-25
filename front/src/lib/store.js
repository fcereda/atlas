'use strict'

import Coordenadas from '../classes/coordenadas.js'
import Candidatos from '../classes/candidatos.js'

var _coordenadas = {},
	_municipios  = {},
	_municipiosArr = [],
	//_candidatos = [], 
	_candidatos = new Candidatos(),
	//_candidatosPorId = {},
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
		_coordenadas = new Coordenadas(coords)	// o constructor de Coordenadas já calcula os vizinhos
		return _coordenadas
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
		throw Error('Store.calcCoordenadaId moved to Utils.calcCoordenadaId')
	},

	calcCandidatoId ({ ano, cargo, numero }) {
		return `${ano}-${cargo}-${numero}`
	},

	adicionarCandidato (candidato) {
		return _candidatos.adicionarCandidato(candidato)
	},

	removerCandidato (candidato) {
		return _candidatos.removerCandidato(candidato)
	},

	removerTodosCandidatos () {
		return _candidatos.removerTodosCandidatos()
	},

	obterCandidato (candidato) {
		return _candidatos.obterCandidato(candidato)
	},

	desabilitarCandidato (candidato) {
		return _candidatos.desabilitarCandidato(candidato)
	},

	habilitarCandidato (candidato) {
		return _candidatos.habilitarCandidato(candidato)
	},

	adicionarCallbackCandidatos (callback, contexto) {
		return _candidatos.adicionarCallback (callback, contexto)
	},

	removerCallbackCandidatos (callback) {
		return _candidatos.removerCallback(callback)
	},


}