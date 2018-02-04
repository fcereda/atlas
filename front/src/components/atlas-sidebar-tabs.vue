<template>

    <v-tabs 
    	v-model="activeTab" 
    	:centered="true"
		:scrollable="false"
		grow
		@input="tabInput"
	>
      <v-tabs-bar class="white" style="overflow-x:hidden;">
        <v-tabs-slider color="primary" style="overflow-x:hidden;"></v-tabs-slider>

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
			    :uf="uf"
			    :colorScale="colorScale"
			    @add-candidate="addCandidate"
			    @remove-candidate="removeCandidate"
			    @show-indexes="showIndividualIndexes"
			></atlas-candidates-list>

		</v-tabs-content>
		
		<v-tabs-content
			key="parcial"  
			id="parcial"
		>
        </v-tabs-content>

        <v-tabs-content
        	key="detalhes"		
        	id="detalhes"
        >
        	<atlas-painel-zonas
        		v-show="1"
			    :zonas="zonasToDisplay"
			    :candidato="candidatoSelecionado"
			    @close="closePainelZonas"
			></atlas-painel-zonas> 
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
       

      </v-tabs-items>
    </v-tabs>

 </template>

<style>

.tabs__wrapper {
	overflow-x: hidden;  /* Gambiarra para evitar que o Vuetify coloque uma scrollbar horizontal no tab */
}

</style>

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
				label: 'Detalhes',
				key: 'detalhes'
			}, {	
				label: 'Mais votados',
				key: 'maisvotados'
			}],
			candidatoSelecionado: null
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
			this.candidatoSelecionado = e
			this.$emit('show-indexes', e)
		},

		closePainelZonas () {
			this.$emit('close-painel-zonas')
		},

		showTabDetalhes () {
			this.activeTab = 'detalhes'
		},

		tabInput (idTabSelecionado) {
			this.$refs.painelMaisVotados.setVisible(idTabSelecionado == 'maisvotados')
					   
		}

	}

}


</script>