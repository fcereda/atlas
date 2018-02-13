<template>

	<div class="uf-display">
		<span style="flex:1">
			{{ uf.nome }}
		</span>
			<v-menu offset-y z-index="10000">
	            <v-tooltip bottom open-delay="200" slot="activator" z-index="10000">
	              <v-btn flat icon _color="blue-grey lighten-4" class="button-logo-pequeno" slot="activator">
	                <v-icon>palette</v-icon>
	              </v-btn>
	              <span>Escalas de cor</span>
	            </v-tooltip>  
	            <v-list>
	            	<v-subheader v-text="'Escalas de cor'"></v-subheader>
				    <template v-for="item in menuItems">
				    	<v-list-tile v-if="item.title || item.colors" :key="item.title" @click="setColorScale(item)">
							<i class="material-icons" :style="item.selected ? 'color:#616161;' : 'color:transparent;'">done</i>
							&nbsp;
	          				<v-list-tile-title v-if="item.title">{{ item.title }}</v-list-tile-title>
	          				<template v-for="color in item.colors">
	          					<span :style="'color:rgb(' + color + ');'"><i class="material-icons">fiber_manual_record</i></span>
	          				</template>	
	          			</v-list-tile>	
	          			<v-divider v-else-if="item.divider"></v-divider>
	        		</template>
	      		</v-list>
    		</v-menu>
            <v-tooltip bottom open-delay="200" z-index="10000">
              <v-btn flat icon color="blue-grey lighten-4" class="button-logo-pequeno" slot="activator" v-if="false">
                <v-icon>more_vert</v-icon>
              </v-btn>
              <span>Mais opções</span>
            </v-tooltip> 


	</div>

</template>

<script>

import Color from '../lib/colors.js'

export default {

	props: [ 'uf' ],

	data () {

		const colorScales = [{
			type: 'categorical',
			baseColor: 'standard'
		}, {
			type: 'categorical',
			baseColor: 'reversed'
		}, {
			type: 'categorical',
			baseColor: 'blueFirst'
		}, {	
			type: 'categorical',
			baseColor: 'usable'
		}, {
			type: 'categorical',
			baseColor: 'set1'
		}, {
			type: 'categorical',
			baseColor: 'paired'
		}, {
			type: 'categorical',
			baseColor: 'dark2'
		}, {
			divider: true
		}, { 
			type: 'linear',
			baseColor: '#1a237e',
		}, {
			type: 'linear',
			baseColor: '#b71c1c',
		}]

		return { 

			menuItems: colorScales.map(({type, baseColor, divider}) => {
				if (divider) 
					return { divider: true }
				return {
					type,
					baseColor,
					colors: (new Color.ColorSequence(type, baseColor)).getColorsFromSequence(0, 7),
					selected: false
				}		
			})	

		}

	},

	mounted () {
		var colorSeq = new Color.ColorSequence(`categorical`)
	},

	methods: {
		setColorScale (colorScale) {
			console.log('colorScale')
			console.log(colorScale)
			this.menuItems.forEach((item) => {
				item.selected = false
			})
			colorScale.selected = true
			this.$emit('set-color-scale', {
				type: colorScale.type,
				baseColor: colorScale.baseColor,
			})
		}
	}


}


</script>

<style>

.uf-display {
	font-size: 24px;	
	width: 100%;
	/*
	color:rgba(255,255,255,0.8);
	*/
	background-color: rgba(255, 255, 255, 0.05);
	border-top: 1px solid rgba(255, 255, 255, 0.25);
	border-bottom: 1px solid rgba(255, 255, 255, 0.25);

	border-top: 1px solid #aaa;
	border-bottom: 1px solid #aaa;
	padding-left:20px;
	padding-right:16px;
	padding-top:4px;
	padding-bottom:4px;
	display:flex;
}

</style>