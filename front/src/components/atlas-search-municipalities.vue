<template>

	<v-select 
		:filter="searchMunicipios" 
		v-model="municipioSelecionado"
		:disabled = "false"
		auto
		autocomplete
		hide-details
		single-line 
		solo light
		item-text="nome"
		item-value="nome"
		return-object
		label="Procurar município"
		:loading="false"
		nudge-bottom="20px"
		style="z-index:10000;"
	>
		<template slot="item" scope="municipio">
		{{ municipio.item.nome }}
		</template>
	   	<template slot="progress">
	   	Carregando lista de municípios...
	   	</template>
	   	<template slot="no-data">
	   	{{ municipioSelecionado ? 'Nenhum município encontrado' : 'Digite as primeiras letras do nome do município' }}
	   	</template>
	</v-select>

</template>

<script>

import Store from '../lib/store.js'

export default {

	props: [],

	data () {
		return {
			municipioSelecionado: null
		}
	},

	computed: {
		municipios () {
			console.log(Store.municipiosArr)
			return Store.municipiosArr
		}
	},

	methods: {
		searchMunicipios(e) {
			console.log(e)
		}
	}
}

</script>