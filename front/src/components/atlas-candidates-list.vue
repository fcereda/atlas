<template>

<div class="select-candidates">
	<v-container fluid class="pa-2">

        <div id="atlasCandidates">

    	    <div v-if="!candidatosSelecionados.length" class="pa-2">
    	    	Agora, escolha um ou mais candidatos ou partidos que tenham disputado eleições {{ uf.sigla == 'DF' ? 'no Distrito Federal': 'neste estado' }}. Basta digitar parte do nome no campo abaixo. Para fazer uma busca mais detalhada, clique em <code>BUSCA AVANÇADA</code>:
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
                :resultado="candidato.resultado"
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
                @change-color="changeCandidateColor(candidato, $event)"
    			@ver-indices="verIndicesIndividuais(candidato)"
    			@esconder-indices="verIndicesIndividuais(null)"
                @ver-carreira="verCarreira(candidato)"
                @salvar-arquivo="salvarArquivo(candidato)"
                @show-dialog-charts="verGraficosCandidato(candidato)"
    		></atlas-candidate-chip>	

        </div>    

	    <p></p>

		<atlas-select-candidate
			:uf="uf"
            id="atlasSelectCandidate"
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
<!--
    <atlas-dialog-candidate-charts
        ref="dialigCandidateCharts"
        :uf="uf"
        :candidato="candidatoDestacado"
        :show="showDialogCandidateCharts"
        @close="showDialogCandidateCharts = false"
    ></atlas-dialog-candidate-charts>
-->
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
//import atlasDialogCandidateCharts from './atlas-dialog-candidate-charts.vue'

import api from '../lib/api.js'
import Colors from '../lib/colors.js'
import MapCharts from '../lib/mapcharts.js'
import Store from '../lib/store.js'
import Utils from '../lib/utils.js'
import Candidato from '../classes/candidato.js'

export default {

	components: {
        atlasSelectCandidate,
        atlasSelectUf,
        atlasCandidateChip,
        atlasDialogCarreira,
//        atlasDialogCandidateCharts
	},

	props: [ 'uf', 'colorScale', 'originalCandidates' ],

    data: () => ({

    	candidatosSelecionados: [],
        candidatoDestacado: {},

    	colorSequence: new Colors.ColorSequence('categorical', 'standard'),
    	showBuscaAvancada: false,
        showDialogCarreira: false,
        showDialogCandidateCharts: false,
    	snackbar: {
    		text: 'Erro tentando carregar dados',
    		visible: false
    	},

    }),

    watch: {

        colorScale: function () {
            this.setColorScale(this.colorScale)
        },

        originalCandidates: function () {
            if (this.originalCandidates) {
                this.addMultipleCandidates(this.originalCandidates)
            }    
            console.log('Alterou originalCandidates candidates em atlas-candidates-list')
        }

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

    	addCandidate: function (candidate, addingMultiple=false) {

    		var that = this
    		var candidateObj = {
                    ...candidate, 
                    nome: Utils.capitalizeName(candidate.nome),
                    nomeCompleto: Utils.capitalizeName(candidate.nomeCompleto),
                    uf: this.uf.sigla, 
                    color: candidate.color || '192,192,192',
                    loading: true, 
                    disabled: false, 
                    showDetails: false
                }

            //  Não continua se o novo candidato já existir em Store.candidatos
            if (Store.candidatos.obterCandidato(candidate)) {
                // Só mostra a mensagem se não estiver carregando múltiplos candidatos
                if (!addingMultiple) {
                    this.snackbar.text = 'Este candidato já faz parte da lista'
                    this.snackbar.visible = true
                }                    
                return new Promise((resolve, reject) => reject())
            }

            this.candidatosSelecionados.push(candidateObj)
            var newCandidate = new Candidato (candidateObj)            
    		return newCandidate.carregarVotacao()
            .then(() => {
                candidateObj.loading = false
                candidateObj.color = this.colorSequence.getNextColor(candidate.color)
                candidateObj.total = newCandidate.total
                candidateObj.totalEleicao = newCandidate.totalEleicao
                candidateObj.indiceGGlobal = newCandidate.indiceGGlobal
                candidateObj.indiceLQGlobal = newCandidate.indiceLQGlobal
                candidateObj.indiceMoranGlobal = newCandidate.indiceMoranGlobal

                newCandidate.habilitado = true
                //newCandidate.showDetails = false
                newCandidate.color = candidateObj.color
                this.$emit('add-candidate', newCandidate)
                // Se a escala de cores for linear, refazemos o esquema de cores para refletir a mudança no número de candidatos
                if (this.colorScale.type == 'linear')
                    this.setColorScale()  
                console.log('newCandidate.showIndex: ', newCandidate.showIndex)
                console.log('candidate.showIndex: ', candidate.showIndex)
                if (candidate.disabled) {
                    this.disableCandidate(candidateObj)
                    //candidateObj.disabled = true
                }
                else {
                    if (!addingMultiple) {
                        this.showDetailsCandidate(candidateObj)
                    }    
                }
                if (candidate.showIndex) {
                    this.$emit('show-indexes', newCandidate)
                    candidateObj.showDetails = true
                }
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
                return that.addCandidate(candidates[index], true)
                .then(() => {
                    return addNextCandidate(index+1)
                })
                .catch((error) => {
                    return addNextCandidate(index+1)
                })
            }

            addNextCandidate(0)
            .then(() => {
                // Vai entrar aqui quando tiver adicionado todos os candidatos
                // da lista candidates
                var candidatoSelecionado = this.candidatosSelecionados.find(candidato => candidato.showDetails)
                if (!candidatoSelecionado) {
                    // Se carregamos múltiplos candidatos e, ao final, nenhum 
                    // está selecionado, significa que temos que mostrar o 
                    // gráfico comparativo
                    this.$emit('show-indexes', null)
                }
            })
            .catch(err => console.error('Error trying to load multiple candidates: ', err))
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
  			this.candidatosSelecionados.forEach (esteCandidato => {
                esteCandidato.showDetails = (esteCandidato == candidato) 
                if (esteCandidato.showDetails) {
                    this.$emit('show-indexes', esteCandidato)
                }
            })    
    	},

    	hideDetailsCandidate (candidato) {
    		candidato.showDetails = false
    		this.$emit('show-indexes', null)
    	},

    	disableCandidate (candidato) {
            Store.candidatos.desabilitarCandidato(candidato)
    		candidato.disabled = true
    	},

    	enableCandidate (candidato) {
            Store.candidatos.habilitarCandidato(candidato)
    		candidato.disabled = false
    	},

        changeCandidateColor (candidato, color) {
            this.$set(candidato, 'color', color)
            Store.candidatos.mudarCorCandidato(candidato, color)
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
        },

        salvarArquivo (candidato) {
            candidato = Store.candidatos.obterCandidato(candidato)
            var data = candidato.obterVotacaoCompleta()
            var filename = `${candidato.nomeEAno} ${candidato.uf}.csv`
            Utils.saveCSVFile(filename, data)
        },

        verGraficosCandidato (candidato) {
            this.candidatoDestacado = candidato
            this.$nextTick(() => {
                this.showDialogCandidateCharts = true
            })
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
