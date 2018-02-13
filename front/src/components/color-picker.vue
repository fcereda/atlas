<template>

	<v-card class="pt-1 pl-1">

		<template v-for="subcolors in colors">
		  <div>
			<template v-for="color in subcolors">
				<span 
					class="pointer" 
					:style="'color:' + color + ';padding-left:1px;padding-top:1px;'"
					@click="selectColor(color)"
				><i class="material-icons">brightness_1</i>
				</span>
			</template>	
		  </div>	
		</template>	

	</v-card>  

</template>

<script>

import chroma from 'chroma-js'

export default {

	props: ['color'],

	data: function () {

		var hexColors = [
			[ '#ef5350', '#ec407a', '#ab47bc', '#9575cd', '#7986cb', '#64b5f6', '#81c784', '#dce775', '#ffee58', '#ffca28', '#ffa726', '#ff8a65'],
			[ '#d32f2f', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976d2', '#388e3c', '#afb42b', '#fbc02d', '#ffa000', '#f57c00', '#e64a19'],
			[ '#b71c1c', '#880e4f', '#4a148c', '#311b92', '#1a237e', '#0d47a1', '#1b5e20', '#827717', '#f57f17', '#ff6f00', '#e65100', '#bf360c']
		]

		return {
			colors: hexColors 
		}

	},

	methods: {

		selectColor (color) {
			this.$emit('input', color)
		}

	}

}

</script>