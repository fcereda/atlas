'use strict'

import Candidato from './candidato.js'

class Candidatos {

    constructor () {
        this.length = 0
        this.callbacks = []
    }    

    adicionarCandidato (candidato) {
        const ERROR_PREFIX = 'Error in Candidato.adicionarCandidato: '
        if (!candidato instanceof Candidato)
            throw Error(ERROR_PREFIX + 'argument must be a Candidato object')
        if (this.obterCandidato(candidato))
            throw Error(ERROR_PREFIX + 'argument `candidato` already exists')
        this[this.length] = candidato
        this.length += 1

        this.callCallbacksCandidato('adicionar', candidato)
        return candidato
    }

    callCallbacksCandidato (action, candidato) {
        if (!this.callbacks) {
            return
        }
        this.callbacks.forEach(({ callback, contexto }) => {
            callback.call(contexto, action, candidato)
        })
    }

    adicionarCallback (callback, contexto) { 
        if (!this.callbacks) {
            this.callbacks = []
        }
        for (var index = this.callbacks.length-1; index >= 0; index--)
            if (this.callbacks[index].callback == callback) {
                this.callbacks[index].contexto = contexto
                return this.callbacks[index]
            }

        var callbackObj = { callback, contexto }
        this.callbacks.push(callbackObj)
        return callbackObj 
    }

    removerCallbackCandidatos (callback) {
        for (var index = this.callbacks.length-1; index >= 0; index--)
            if (this.callbacks[index].callback == callback) {
                return this.callbacks.splice(index, 1)
            }
        return null
    }    

    indexOf ({ ano, cargo, numero }) {
        if (!ano || !cargo || !numero)
            throw Error('Candidatos.obterIndiceCandidato error: argument must be an object containing ano, cargo and numero')
        for (var i=0; i<this.length; i++) {
            if (this[i].ano == ano &&
                this[i].cargo == cargo &&
                this[i].numero == numero) {
                return i
            }
        }
        return -1
    }

    obterCandidato (candidato) {
        if (!candidato)
            return null
        var indiceCandidato = this.indexOf(candidato)
        if (indiceCandidato >= 0)
            return this[indiceCandidato]
        return null 
    }

    removerCandidato (candidato) {
        var indexCandidato = this.indexOf(candidato)
        if (indexCandidato < 0)
            return null
        for (var i=indexCandidato; i<this.length-1; i++) {
            this[i] = this[i+1]
        }
        delete this[this.length-1]
        this.length -= 1

        this.callCallbacksCandidato('remover', candidato)
        return candidato
    }

    removerTodosCandidatos () {
        while (this.length) {
            var candidato = this[this.length-1]
            this.length -= 1
        }
    }

    desabilitarCandidato (candidato) {
        candidato = this.obterCandidato(candidato)
        if (!candidato)
            throw Error('Error in Candidatos.desabilitarCandidato: argument candidato not found')
        candidato.disabled = true
        this.callCallbacksCandidato('desabilitar', candidato)
    }

    habilitarCandidato (candidato) {
        candidato = this.obterCandidato(candidato)
        if (!candidato)
            throw Error('Error in Candidatos.habilitarCandidato: argument candidato not found')
        candidato.disabled = false
        this.callCallbacksCandidato('habilitar', candidato)
    }

    mudarCorCandidato (candidato, newColor) {
        candidato = this.obterCandidato(candidato)
        if (!candidato)
            throw Error('Error in Candidatsos.mudarCorCandidato: argument candidato not found')
        candidato.color = newColor
        this.callCallbacksCandidato('cor', candidato)
    }

    obterVotacoes (args) {
        var mapFunction = (candidato) => candidato.votos    

        if (typeof args == 'object') {
            var indicesCandidatosAIncluir = args
            return indicesCandidatosAAIncluir.map(index => this[index]).map(mapFunction)
        }    
        else if (args) {
            return this.filter(cand => !cand.disabled).map(mapFunction)
        }    
        else
            return this.map(mapFunction)
    } 

    obterVotacoesDict (args) {
        var votacoesPorCandidato = this.obterVotacoes(args),
            distritos = {},
            index = 0

        votacoesPorCandidato.forEach(votacaoCandidato => {
            Object.keys(votacaoCandidato).forEach(districtId => {
                if (!distritos[districtId]) {
                    distritos[districtId] = {
                        values: [],
                        size: 0
                    }
                }
                
                while (distritos[districtId].values.length < index)
                    distritos[districtId].values.push(0)
                distritos[districtId].values.push(votacaoCandidato[districtId].porcentagem)
                distritos[districtId].size += votacaoCandidato[districtId].numero
            })
            index += 1
        })    
        return distritos
    }


    filter (callback) {
        var returnArray = []
        for (var i=0; i<this.length; i++) {
            if (callback(this[i], i)) {
                returnArray.push(this[i])
            }
        }
        return returnArray
    }

    map (callback) {
        var returnArray = new Array(this.length)
        for (var i=0; i<this.length; i++)
            returnArray[i] = (callback(this[i], i))
        return returnArray
    }

    reduce (callback, valorInicial) {
        var valorAtual = valorInicial
        for (var i=0; i<this.length; i++) {
            valorAtual = callback(valorAtual, this[i], i)
        }
        return valorAtual
    }

    forEach (callback) {
        for (var i=0; i<this.length; i++) {
            callback(this[i], i)
        }
    }

    sort (callback) {
        var candidatosArray = this.map(candidato => candidato)
        return candidatosArray.sort(callback)
    }

    obterVotacoesPorDistrito (incluirDesabilitados = false) {
        var votosPorDistrito = {}
        
        this.filter(candidato => !candidato.disabled || incluirDesabilitados )
        .forEach(candidato => {
            Object.keys(candidato.votosDict).forEach(idDistrito => {
                var votosObj = {
                    id: idDistrito,
                    candidato,
                    votos: candidato.votosDict[idDistrito],
                    porcentagem: null
                }
                if (votosPorDistrito[idDistrito]) {
                    votosPorDistrito[idDistrito].push(votosObj)
                }
                else {
                    votosPorDistrito[idDistrito] = [ votosObj ]
                }
            })
        })

        // Calcula as porcentagens de votos de cada candidato    
        Object.keys(votosPorDistrito).forEach(idDistrito => {
            var totalVotos = votosPorDistrito[idDistrito].reduce((total, votacaoCandidato) => total + votacaoCandidato.votos, 0)
            votosPorDistrito[idDistrito].forEach(votacaoCandidato => {
                votacaoCandidato.porcentagem = votacaoCandidato.votos / totalVotos
            })
        })      
        
        return votosPorDistrito
    }

    obterMaisVotadosPorDistrito (numeroDeCandidatos = 2, incluirDesabilitados = false) {
        var votosPorDistrito = this.obterVotacoesPorDistrito(incluirDesabilitados)
        Object.keys(votosPorDistrito).forEach(idDistrito => {
            votosPorDistrito[idDistrito] = votosPorDistrito[idDistrito]
            .sort((a, b) => b.votos - a.votos)
            .slice(0, numeroDeCandidatos)
        })
        return votosPorDistrito
    }

    obterIndiceCandidatoPorDistrito (idCandidato, nomeIndice) {
        var candidato = this.obterCandidato(idCandidato)
        if (!candidato) 
            throw Error(`Error in Candidatos.obterIndiceCandidatoPorDistrito: candidate ${idCandidato} does not exist`)
        return candidato.obterIndicePorDistrito(nomeIndice)
    }

}

//module.exports = Candidatos

export default Candidatos

