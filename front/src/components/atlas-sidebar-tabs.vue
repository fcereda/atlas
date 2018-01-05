<template>

    <v-tabs 
    	v-model="activeTab" 
    	:centered="true"
		:scrollable="false"
		grow
		@input="tabInput"
	>
      <v-tabs-bar class="white">
        <v-tabs-slider color="primary"></v-tabs-slider>

        <v-tabs-item
          v-for="tab in tabs"
          :key="tab.key"
          :href="'#' + tab.key"
          class="primary--text"
          ripple
        >
          {{ tab.label }}
        </v-tabs-item>

      </v-tabs-bar>

      <v-tabs-items>

        <v-tabs-content
            key="candidatos"
            id="candidatos"
        >
			<atlas-candidates-list
			    v-show="!mostrarPainelZonas"
			    :uf="uf"
			    :colorScale="colorScale"
			    @add-candidate="addCandidate"
			    @remove-candidate="removeCandidate"
			    @show-indexes="showIndividualIndexes"
			></atlas-candidates-list>

			<atlas-painel-zonas
			    v-show="mostrarPainelZonas"
			    :zonas="zonasToDisplay"
			    @close="closePainelZonas"
			></atlas-painel-zonas> 

		</v-tabs-content>
		
		<v-tabs-content
			key="parcial"  
			id="parcial"
		>
        </v-tabs-content>

        <v-tabs-content
        	key="maisvotados"
        	id="maisvotados"
        >
        	<atlas-painel-maisvotados
        		:uf="uf"
        		:zonas="zonasToDisplay"
        		ref="painelMaisVotados"
        	></atlas-painel-maisvotados>	

        </v-tabs-content>
        
        <v-tabs-content
        	key="eleicoes"		
        	id="eleicoes"
        >
        	<p class="pa-4">Esta aba será incorporada à aba "Mais votados", já que a única funcionalidade adicional é o número efetivo de candidatos</p>
        </v-tabs-content>		

      </v-tabs-items>
    </v-tabs>

 </template>

<script>

import atlasCandidatesList from './atlas-candidates-list.vue'
import atlasPainelZonas from './atlas-painel-zonas.vue'
import atlasPainelMaisvotados from './atlas-painel-maisvotados.vue'

export default {

	components: {
		atlasCandidatesList,
		atlasPainelZonas,
		atlasPainelMaisvotados
	},

	props: ['uf', 'colorScale', 'mostrarPainelZonas', 'zonasToDisplay'],

	data () {

		return {

			activeTab: 'candidatos',
		
			tabs: [{
				label: 'Candidatos',
				key: 'candidatos',
			}, {
				label: 'Mais votados',
				key: 'maisvotados'
			}, {
				label: 'Eleições',
				key: 'eleicoes'
			}]

		}

	},

	methods: {

		addCandidate (e) {
			this.$emit('add-candidate', e)
		},

		removeCandidate (e) {
			this.$emit('remove-candidate', e)
		},

		showIndividualIndexes (e) {
			this.$emit('show-indexes', e)
		},

		closePainelZonas () {
			this.$emit('close-painel-zonas')
		},

		tabInput (idTabSelecionado) {
			this.$refs.painelMaisVotados.setVisible(idTabSelecionado == 'maisvotados')
					   
		}

	}

}


</script>