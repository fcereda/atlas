<template>

<span>

	<span v-if="zonas && zonas.length">
		<div v-for="zonasArr in zonasDict">
			{{ zonasArr[0].municipio }} 
			<span class="numero-ze">
				&ndash;
				{{ replaceLast(zonasArr.map((zonaObj) => zonaObj.numZona + '&ordf;').join(', '), ', ', ' e ') }} {{ zonasArr.length > 1 ? 'ZEs' : 'ZE' }}
			</span>	
		</div>	
	</span>
	<span v-if="municipio && numeroZona">
		{{ municipio }} 
		<span class="numero-ze">
			&ndash; {{ numeroZona }}&ordf; ZE
		</span>	
	</span>

</span>

</template>

<script>

import Utils from '../lib/utils.js'

export default {

	props: ['zonas', 'municipio', 'numeroZona'],

	data () {

		return { }

	},

	computed: {

		zonasDict () {
			if (!this.zonas || !this.zonas.length)
				return {}
			var zonasArr = this.zonas.map((zona) => {
				var zonaId = zona.id || zona.zonaId || zona.idZona || zona.zona // Eu sei que é gambiarra, segue o jogo 
				var [id, numZona] = zonaId.split('-')
			 	return {
					id, 
					municipio: zona.municipio,
					numZona: parseInt(numZona) 
				}
			})
			.sort((a, b) => a.numZona - b.numZona)

			return Utils.groupBy(zonasArr, zona => zona.municipio)
		}

	},

	methods: {

		replaceLast (str, substr, newsubstr) {
			return Utils.replaceLast(str, substr, newsubstr)
		}

	}

}

</script>

<style>

.numero-ze {
	font-size: 0.89em;
	font-weight: 400;
}

</style>