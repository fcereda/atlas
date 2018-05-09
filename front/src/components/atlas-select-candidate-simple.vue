<template>

	<v-layout row wrap class="select-candidato pa-0 pt-2">

	    <v-flex sm12 pa-0 pl-2 pr-1>


	        <v-select 
	        	id="selectCandidatos"
	        	ref="selectCandidatos"
	        	:items="candidatos"
	            v-model="candidatoSelecionado"
	            xlabel="Adicionar candidato" 
	            placeholder="Adicionar candidato"
	            no-data-text="Nenhum nome encontrado"
	            :editable ="true"
	            solo
	            autocomplete
	            clearable
	            :open-on-clear="true"
	            :auto="false"
	            item-value="id" 
	            item-text="nomeNormalizado"
	            return-object
	            :loading="loadingCandidatesList"
	            style="z-index:10000;" 
	            z-index="10000"
	            append-icon="search"
	            :filter="filter"

	            :cache-items="true"
	            :search-input.sync="search"
	          	:debounce-search="200"
	            class="pa-0 ma-0"
	            @blur="onBlur"
	        >
 	       		<template slot="item" scope="candidato">
	       		{{ capitalizeName(candidato.item.nome, candidato.item.cargo, candidato.item.numero) }}&nbsp;
	       		<small class="detail">({{ candidato.item.partido }})&nbsp;{{nomeCargo(candidato.item.cargo)}} {{candidato.item.ano}}</small>
	       		</template>

		       	<template slot="no-data">
		       	&nbsp;{{ candidatoSelecionado ? 'Nenhum nome encontrado' : 'Digite parte do nome do candidato' }}
		       	</template>	       		


			</v-select>


	    </v-flex>



	    <v-flex sm12 pa-0 pt-2 style="display:flex;">
	        <span pa-0 class="pa-0" style="flex:1">
   	    		<v-btn
   	    			raised
   	    			dense
 					id="btnBuscaAvancada"
	    			@click="showBuscaAvancada = true"
	    		>
	    			<v-icon left>search</v-icon>Busca avançada
	    		</v-btn>	
			</span>
	    </v-flex>		

    <atlas-dialog-busca-avancada
    	:show="showBuscaAvancada"
    	:uf="uf"
    	@close="showBuscaAvancada = false"
	    @add-candidates="addMultipleCandidates"    	
    ></atlas-dialog-busca-avancada>	

    </v-layout>

</template>

<script>

import axios from 'axios'
import Utils from '../lib/utils.js'
import Candidato from '../classes/candidato.js'
import Candidatos from '../classes/candidatos.js'
import atlasDialogBuscaAvancada from './atlas-dialog-busca-avancada.vue'

export default {

	components: {
		atlasDialogBuscaAvancada
	},

	props: ['uf'],
	
	data: function () {

	  return {

        search: '',
        items: [],

	  	anos: [1998, 2002, 2006, 2010, 2014],

	  	cargos: [{
	  		label: 'Presidente 1o turno',
	  		value: 'pr1'
	  	}, {
	  		label: 'Presidente 2o turno',
	  		value: 'pr2'
	  	}, {
	  		label: 'Governador 1o turno',
	  		value: 'g1'
	  	}, {
	  		label: 'Governador 2o turno',
	  		value: 'g2'
	  	}, {
	  		label: 'Senador',
	  		value: 's'
	  	}, { 
	  		label: 'Deputado federal',
	  		value: 'df'
	  	}, { 
	  		label: 'Deputado estadual',
	  		value: 'de'
	  	}],

	  	candidatos: [],

	  	ano: null,
	  	cargo: null,
	  	candidatoSelecionado: null,	
	  	searchCandidates: '', 
	  	loadingCandidatesList: false,

	  	showBuscaAvancada: false,

	  }
	},

	computed: {

		addCandidateButtonIsDisabled () {
			return (!this.candidatoSelecionado); 
		},

	},	

	watch: {	

        search (val) {
            val && this.querySelectionsCandidates(val)
        },

        candidatoSelecionado (val) {
        	if (this.candidatoSelecionado) {
        		this.adicionarCandidato(this.candidatoSelecionado)
				this.candidatoSelecionado = null        		
        		this.$refs.selectCandidatos.cachedItems = []
        		this.$refs.selectCandidatos.searchValue = null
        	}
        },

	},		

	methods: {

        filter (candidato, nomeProcurado) {
        	var nomeProcuradoNormalizado = Utils.normalizeNome(nomeProcurado)
        	return candidato.nomeNormalizado.indexOf(nomeProcuradoNormalizado) >= 0
        },

		onBlur (e) {
			this.$refs.selectCandidatos.value = ''
		},

        querySelectionsCandidates (val) {
            val = val || ''
            if (val.length < 3) {
            	this.$refs.selectCandidatos.cachedItems = []
            	this.$set(this, 'candidatos', [])
                return;
            }
            this.$refs.selectCandidatos.cacheItems = true
            this.loadingCandidatesList = true
            axios.get('/api/candidatos', { params: {
				uf: this.uf.sigla,
				nome: val
			}})
            .then((response) => {
                this.candidatos = Candidatos.ordenarPorRelevancia(response.data)
                this.loadingCandidatesList = false
            })
            .catch((error) => {
                console.error('error trying to fetch candidates')
                console.error(error)
                this.loadingCandidatesList = false                
            })
        },    

        capitalizeName (nome, cargo, numero) {
        	if (!cargo)
        		return Utils.capitalizeName(nome)

        	return Candidato.ePartido(cargo, numero) ? nome : Utils.capitalizeName(nome)
        },

        nomeCargo (cargo) {
        	return Utils.obterNomeCargo(cargo)
        },


		adicionarCandidato (candidato) {
			var { nome, nomeCompleto, cpf, cargo, ano, partido, numero, classificacao, votacao, resultado } = candidato,
				newCandidate = {
					nome: Utils.capitalizeName(nome), 
					nomeCompleto: Utils.capitalizeName(nomeCompleto),
					ano: parseInt(ano), 
					cpf,
					cargo, 
					partido,
					numero,
					classificacao,
					votacao,
					resultado
				}
			this.$emit('add-candidate', newCandidate)
		},

		addMultipleCandidates (candidatosSelecionados) {

			var candidatos = candidatosSelecionados.map((candidato) => {
				var { nome, nomeCompleto, cpf, cargo, ano, partido, numero, classificacao, votacao, resultado } = candidato
				return {
					nome: Utils.capitalizeName(nome), 
					nomeCompleto: Utils.capitalizeName(nomeCompleto),
					ano: parseInt(ano), 
					cpf,
					cargo, 
					partido,
					numero,
					classificacao,
					votacao,
					resultado
				}
			})
			this.$emit('add-multiple-candidates', candidatos)
		},

	},

}

</script>

<style>

.select-candidato {
	padding-left: 8px;
	padding-right: 8px;
	padding-bottom: 8px;
}

.detail {
	color: #444;
}

</style>