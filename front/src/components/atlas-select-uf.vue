<template>
	<v-layout row>
		<v-flex sm12>

            <v-select
              v-bind:items="ufs"
              item-value="sigla"
              item-text="nome"
              label="Para começar, escolha um estado aqui:"
              return-object
              single-line
              hide-details
              autocomplete
              editable
              @input="setUf"
            ></v-select>

	    </v-flex>
	</v-layout>
</template>		

<script>

import utils from '../lib/utils.js'

export default {

	props: [ 'uf' ],

	data () {

		return {
    		ufs:  utils.obterUfs()
		}

	},

	computed: {

		title () {
			return this.uf ? 'Selecione a UF' : this.uf.nome
		}	

	},

	methods: {

		setUf (uf) {
			this.$emit('input', uf)
		}

	}
}

</script>

<style>

.width100 {
	width: 100%;
}

.select-uf {
	background-color: white;
	padding-left: 4px;
	padding-right: 4px;
	padding-bottom: 0;
}

</style>