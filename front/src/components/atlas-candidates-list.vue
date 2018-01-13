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
			:indiceLQ="candidato.somaIndiceLQ"
			:indiceG="candidato.somaIndiceG"
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
        :nome="candidatoDestacado.nome"
        :nomeCompleto="candidatoDestacado.nomeCompleto"
        :cpf="candidatoDestacado.cpf"
        @close="showDialogCarreira = false"
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

import atlasSelectCandidate from './atlas-select-candidate-simple.vue'
import atlasSelectUf from './atlas-select-uf.vue'
import atlasCandidateChip from './atlas-candidate-panel.vue'
import atlasDialogCarreira from './atlas-dialog-carreira.vue'

import api from '../lib/api.js'
import Store from '../lib/store.js'
import Colors from '../lib/colors.js'
import Charts from '../lib/charts.js'

import axios from 'axios'

var currentColorIndex = 0

function getNextColor () {
	var baseColors = ['deep-orange', 'indigo', 'pink', 'blue', 'purple', 'cyan', 'deep-purple', 'light-blue',
		'green', 'amber', 'lime', 'red', 'blue-grey', 'orange'];
	var color = baseColors[currentColorIndex % baseColors.length] + ' darken-' + (currentColorIndex / baseColors.length + 1)
	currentColorIndex += 1;
	return color; 	
}


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
                Charts.calcPlottingData()
                Charts.redrawCharts()   
            }
        },

    	addCandidate: function (candidate) {

    		var color = 'black',  
    			candidateObj = {...candidate, color, loading: true, disabled: false, showDetails: false},
    			totalVotos = {},
    			totalGeral = 0

    		this.candidatosSelecionados.push(candidateObj)
    		return api.getTotalVotesByZoneAndCity({...candidate, uf: this.uf.sigla})
    		.then((data) => {
    			//console.log('** CARREGAMOS VOTOS TOTAIS POR ZONA E MUNICIPIO!')
    			//console.log(`${data.length} rows carregados`)
    			data.forEach(({codigoMunicipio, codigoZona, votos}) => {
    				var id = Store.calcCoordenadaId(codigoMunicipio, codigoZona)
    				if (totalVotos[id])
    					totalVotos[id] += votos
    				else
    					totalVotos[id] = votos
    				totalGeral += votos
				})    				
				// Somente carregamos os votos do candidato quando tivermos os votos totais das zonas
				return api.getVotesByZoneAndCity({...candidate, uf: this.uf.sigla})
			})    		
    		.then((data) => {
    			// Neste momento, temos um array de objetos
    			// Agora vamos converter esse array em um dicionário	
    			
    			var votes = {},
                    votesArray = [],
    				totalCandidato = 0
    			data.forEach(({ codigoMunicipio, codigoZona, votos }) => {
    				var id = Store.calcCoordenadaId(codigoMunicipio, codigoZona),
                        votesObj = {
                            id,
                            numero: votos,
                            total: totalVotos[id],
                            porcentagem: votos / totalVotos[id]
                        }
    				votes[id] = votesObj
                    votesArray.push(votesObj)
    				totalCandidato += votos	
    				if (!totalVotos[id]) {
    					console.error('No voting total for local ' + id)
    				}
    			})

                // Adiciona registros ao Dict votes para os distritos onde o candidato não teve nenhum voto
                for (var id in totalVotos) {
                    if (!votes[id]) {
                        votes[id] = {
                            id,
                            numero: 0,
                            total: totalVotos[id],
                            porcentagem: 0
                        }
                    }
                }

    			// Vamos agora calcular o índice LQ (location quotient) de cada zona-município
    			// O LQ de um distrito é definido como: 
                // (votos do candidato no distrito / total de votos do candidato) / (total de votos do distrito / total geral de votos)

    			var indices = {},
    				somaIndiceLQ = 0
    			for (var id in votes) {
					let votosCandidatoZona = votes[id].numero,
						totalVotosZona = totalVotos[id],
						indiceLQ = (votosCandidatoZona / totalCandidato) / (totalVotosZona / totalGeral)

                    if (votosCandidatoZona) {
                        // Calcula os índices apenas para os distritos onde o candidato teve pelo menos 1 voto
        				indices[id]	= {
    						id, 
    						indiceLQ,
                            indicePareto: 1    // inicializamos o índice de Pareto com o valor menos significativo (1)
    					}
    					somaIndiceLQ += indiceLQ
                    }    
    			}

                // Vamos agora calcular o "Índice de Pareto
                // O objetivo é determinar quais distritos são responsáveis por 20% dos votos, por 40%
                // por 60% e por 80% dos votos
                // Para isso, ordenamos os distritos por votos (do mais votado ao menos votado) e 
                // calculamos o acumulado das porcentagens 

                // Sabemos que indices{} contém um dictionary com as zonas/municipios, então o objetivo
                // final é popular essa zona com um campo IP que indicará a porcentagem acumulada 
                // daquela zona/municipio
                // votesArray já contém os votos por id (zona/município)
                // totalCandidato contém a votação total do candidato

                votesArray.sort((a, b) => b.numero - a.numero)
                    .reduce((acumulado, distrito) => {
                    var porcentagem = distrito.numero / totalCandidato    
                    acumulado += porcentagem
                    distrito.acumulado = acumulado
                    return acumulado
                }, 0)
                votesArray.forEach(({ id, acumulado }) => {
                    indices[id].indicePareto = acumulado
                })

/*
    			var minLQ = 1000,
    				maxLQ = -1000,
    				mediaLQ = 0,
    				contador = 0
    			for (var id in indices) {
    				var indiceLQ = indices[id].indiceLQ
    				mediaLQ += indiceLQ
    				minLQ = Math.min(minLQ, indiceLQ)
    				maxLQ = Math.max(maxLQ, indiceLQ)
    				contador += 1
    			}
    			mediaLQ = mediaLQ / contador
    			console.log(`Índice LQ: média ${mediaLQ}, mínimo ${minLQ}, máximo ${maxLQ}`)
*/    			
   			
    			candidateObj.loading = false
    			candidateObj.color = this.colorSequence.getNextColor()
    			candidateObj.total = totalCandidato
                candidateObj.totalEleicao = totalGeral
    			candidateObj.somaIndiceLQ = somaIndiceLQ
                var newCandidate = {...candidateObj, votos: votes, indices}
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
    		Store.desabilitarCandidato(candidato)
    		candidato.disabled = true
    	},

    	enableCandidate (candidato) {
    		Store.habilitarCandidato(candidato)
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
