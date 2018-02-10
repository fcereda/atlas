<template>

<div class="select-candidates">
	<v-container fluid class="pa-2">

	    <div v-if="!candidatosSelecionados.length" class="pa-2">
	    	Agora, escolha um ou mais candidatos ou partidos que tenham disputado eleições {{ uf.sigla == 'DF' ? 'no Distrito Federal': 'neste estado' }}. Basta digitar parte do nome no campo abaixo. Para mais opções, clique em <code>BUSCA AVANÇADA</code>:
	    </div>	

		<atlas-candidate-chip
			v-for="candidato in candidatosSelecionados"
			:nome="candidato.nome"
			:partido="candidato.partido"
			:cargo="candidato.cargo"
			:ano="candidato.ano"
            :numero="candidato.numero"
			:color="candidato.color"
			:classificacao="candidato.classificacao"
			:total="candidato.total"
            :totalEleicao="candidato.totalEleicao"
			:indiceLQ="candidato.indiceLQGlobal"
			:indiceG="candidato.indiceGGlobal"
            :indiceMoran="candidato.indiceMoranGlobal"
			:loading="candidato.loading"
			:disabled="candidato.disabled"
			:showDetails="candidato.showDetails"
			@remove="removeCandidate(candidato)"
			@disable="disableCandidate(candidato)"
			@enable="enableCandidate(candidato)"
			@open="showDetailsCandidate(candidato)"
			@close="hideDetailsCandidate(candidato)"
			@ver-indices="verIndicesIndividuais(candidato)"
			@esconder-indices="verIndicesIndividuais(null)"
            @ver-carreira="verCarreira(candidato)"
		></atlas-candidate-chip>	

	    <p></p>

		<atlas-select-candidate
			:uf="uf"
			@add-candidate="addCandidate"
            @add-multiple-candidates="addMultipleCandidates"
        ></atlas-select-candidate>

	</v-container>

    <atlas-dialog-carreira
        ref="dialogCarreira"
        :show="showDialogCarreira"
        :uf="uf"
        :nome="candidatoDestacado.nome"
        :nomeCompleto="candidatoDestacado.nomeCompleto"
        :cpf="candidatoDestacado.cpf"
        @close="showDialogCarreira = false"
        @add-candidate="addCandidate"
    ></atlas-dialog-carreira>    

    <v-snackbar
      :timeout="5000"
      :top="true"
      :left="true"
      color="error"
      v-model="snackbar.visible"
    >
      {{ snackbar.text }}
      <v-btn flat color="black" @click.native="snackbar.visible = false">Fechar</v-btn>
    </v-snackbar>

</div> 

</template>

<script>

'use strict'

import atlasSelectCandidate from './atlas-select-candidate-simple.vue'
import atlasSelectUf from './atlas-select-uf.vue'
import atlasCandidateChip from './atlas-candidate-panel.vue'
import atlasDialogCarreira from './atlas-dialog-carreira.vue'

import api from '../lib/api.js'
import Store from '../lib/store.js'
import Colors from '../lib/colors.js'
import MapCharts from '../lib/mapcharts.js'
import Candidato from '../classes/candidato.js'

export default {

	components: {
        atlasSelectCandidate,
        atlasSelectUf,
        atlasCandidateChip,
        atlasDialogCarreira,
	},

	props: [ 'uf', 'colorScale' ],

    data: () => ({

    	candidatosSelecionados: [],
        candidatoDestacado: {},

    	colorSequence: new Colors.ColorSequence('categorical', 'standard'),
    	showBuscaAvancada: false,
        showDialogCarreira: false,
    	snackbar: {
    		text: 'Erro tentando carregar dados',
    		visible: false
    	},

    }),

    watch: {

        colorScale: function () {
            this.setColorScale(this.colorScale)
        },

    },

    methods: {

    	setUF (uf) {
    		this.uf = uf
    		this.$emit('change-uf', uf.sigla)
    	},

        setColorScale (colorScale) {
            var numColors
            colorScale = colorScale || this.colorScale
            if (colorScale.type == 'linear')
                numColors = Math.max(this.candidatosSelecionados.length, 3)
            this.colorSequence = new Colors.ColorSequence(colorScale.type, colorScale.baseColor, numColors)
            if (this.candidatosSelecionados && this.candidatosSelecionados.length) {
                this.candidatosSelecionados.forEach((candidato) => {
                    candidato.color = this.colorSequence.getNextColor()
                    Store.obterCandidato(candidato).color = candidato.color
                })
                // Como mudamos as cores, repintamos os gráficos
                //Charts.calcPlottingData()
                MapCharts.redrawCharts()   
            }
        },

    	addCandidate: function (candidate) {

    		var color = 'black',  
    			candidateObj = {...candidate, uf: this.uf.sigla, color, loading: true, disabled: false, showDetails: false}

            this.candidatosSelecionados.push(candidateObj)
            var newCandidate = new Candidato (candidateObj)            
    		return newCandidate.carregarVotacao()
            .then(() => {
                candidateObj.loading = false
                candidateObj.color = this.colorSequence.getNextColor()
                candidateObj.total = newCandidate.total
                candidateObj.totalEleicao = newCandidate.totalEleicao
                candidateObj.indiceGGlobal = newCandidate.indiceGGlobal
                candidateObj.indiceLQGlobal = newCandidate.indiceLQGlobal
                candidateObj.indiceMoranGlobal = newCandidate.indiceMoranGlobal

                newCandidate.habilitado = true
                //newCandidate.showDetails = false
                newCandidate.color = candidateObj.color
                this.$emit('add-candidate', newCandidate)
                // Se a escala de cores for linear, refazemos o esquema de cores para refletir a mudança no número de candidastos
                if (this.colorScale.type == 'linear')
                    this.setColorScale()  
                // Retorna uma Promise para permitir que this.addMultipleCandidates comece 
                // a carregar o próximo candidato somente depois que o candidato atual
                // tenha sido carregado
                return new Promise((resolve, reject) => resolve())
            })
            .catch((error) => {
                console.error(`Error trying to load candidate data`)
                console.error(error)
                this.snackbar.visible = true
                this.removeCandidate(candidateObj)
                return new Promise((resolve, reject) => reject())
            })
    	},

        addMultipleCandidates (candidates) {
            var that = this  // Traditional hack to save context for addNextCandidate()

            function addNextCandidate(index) {
                if (index >= candidates.length)
                    return
                return that.addCandidate(candidates[index])
                .then(() => {
                    addNextCandidate(index+1)
                })
                .catch((error) => {
                    addNextCandidate(index+1)
                })
            }

            addNextCandidate(0)
        },

    	removeCandidate (candidato) {
    		var indexToRemove = this.candidatosSelecionados.indexOf(candidato);
    		if (indexToRemove >= 0) {
    			if (this.candidatosSelecionados.splice(indexToRemove, 1)) {
                    this.$emit('remove-candidate', candidato)
                    this.$emit('show-indexes', null)    // Volta automaticamente para gráficos comparativos
    				if (this.colorScale.type == 'categorical')
                        this.colorSequence.returnColor(candidato.color)
                    else 
                        this.setColorScale()
    			}
    		}
    		else {
    			// This should never occur!	
    			console.error('Error trying to remove candidate from list')
    			console.log(candidato)
    		}
    	},

    	showDetailsCandidate (candidato) {
  			this.candidatosSelecionados.forEach ((esteCandidato) => esteCandidato.showDetails = (esteCandidato == candidato))
    	},

    	hideDetailsCandidate (candidato) {
    		candidato.showDetails = false
    		this.$emit('show-indexes', null)
    	},

    	disableCandidate (candidato) {
    		//Store.desabilitarCandidato(candidato)
            Store.candidatos.desabilitarCandidato(candidato)
    		candidato.disabled = true
    	},

    	enableCandidate (candidato) {
    		//Store.habilitarCandidato(candidato)
            Store.candidatos.habilitarCandidato(candidato)
    		candidato.disabled = false
    	},

    	verIndicesIndividuais (candidato) {
    		this.$emit('show-indexes', candidato)
    	},

        verCarreira (candidato) {
            this.candidatoDestacado = candidato
            this.$nextTick(function () {
                this.$refs.dialogCarreira.carregarCarreira()
                this.showDialogCarreira = true
            }.bind(this))
        }

    },

};

</script>

<style>
.select-candidates {
	width: 100%;
	margin-top: -4px;
	overflow-y: hidden;
	/*
    color: #ddd;
    */
    color:#333;
}	

.delete-button {
	cursor: pointer;
}

.delete-button:hover {
	color: rgb(239, 83, 80);
}


::-webkit-scrollbar {
    height: 12px;
    width: 12px;
    background: #444;
    background: #fff;
}

::-webkit-scrollbar-thumb {
    background: #666;  
    background: #ddd;
    -webkit-border-radius: 2px;
}

::-webkit-scrollbar-corner {
    background: #444;
}

</style>
