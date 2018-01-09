<template>

	<v-layout row wrap class="select-candidato pa-0 pt-2">

	    <v-flex sm12 pa-0>


	        <v-select 
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
	       		{{ capitalizeName(candidato.item.nome) }}&nbsp;
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
                this.candidatos = this.ordenarPorRelevancia(response.data.sort((a, b) => b.votacao - a.votacao))
                this.loadingCandidatesList = false
            })
            .catch((error) => {
                console.error('error trying to fetch candidates')
                console.error(error)
                this.loadingCandidatesList = false                
            })
        },    

        ordenarPorRelevancia (candidatos) {
        	var agrupadosPorNome = candidatos.reduce((dict, candidato) => {
				var nome = candidato.nomeCompleto   
				// Temos que usar nomeCompleto para poder identificar corretamente os candidatos,
				// pois vários candidatos mudam o nome de urna de eleição para eleição, enquanto
				// outros utilizam nomes de urna iguais aos de políticos mais famosos
  				if (!dict[nome]) {
				    dict[nome] = {
				        lista: [],
				        votacao: 0
				    }
				}
  				dict[nome].lista.push(candidato)
  				dict[nome].votacao += candidato.votacao
  				return dict
			}, {})

			var ordenadosPorVotacao = Object.keys(agrupadosPorNome).map((key) =>
				agrupadosPorNome[key]).sort((a, b) => b.votacao - a.votacao)


			var ordenadosPorRelevancia = ordenadosPorVotacao.reduce((listaFinal, pessoa) => {
  				pessoa.lista
				.sort((a, b) => b.ano - a.ano)
  				.forEach((candidato) => listaFinal.push(candidato))
  				return listaFinal
			}, [])

			console.log(ordenadosPorRelevancia.map((candidato) => candidato.nome))
			return ordenadosPorRelevancia
        },

        capitalizeName (nome) {
        	return Utils.capitalizeName(nome)
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