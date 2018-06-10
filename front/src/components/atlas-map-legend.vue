<template>
	<div class="map-legend" @dblclick="collapsed = !collapsed">

		<div style="display:flex;">
			<div v-show="!collapsed">
				<div class="map-legend-title pb-1" v-if="title">{{ title }}</div>
				<div v-if="text">{{ text }}</div>
			</div>	
			<div>
				<v-icon v-show="!collapsed" color="primary" class="pl-1 pointer" style="transform: translateY(-2px);" @click="collapsed = true">close</v-icon>			
				<v-icon v-show="collapsed" color="primary" class="pointer" @click="collapsed = false">list</v-icon>
			</div>
		</div>
				
		<div v-show="!collapsed">
			<v-icon 
				v-bind:color="helpButtonColor" 
				class="map-legend-btn-help pl-1 pt-2 pointer" 
				style="transform: translateY(-2px);"
				@click="showDialogHelp = true"
			>help_outline</v-icon>
			<table>
			<tr v-for="(label, index) in labelsReversed">
				<td class="map-legend-color-key" v-bind:style="'background-color:' + colors[index] + ';'">&nbsp;</td>
			 	<td style="padding-left:4px">{{ label }}</td>
			 </tr>
			 </table>	
		</div>	 

		<atlas-dialog-ajuda
			:title="title"
			:text="help"
			:show="showDialogHelp"
			@close="showDialogHelp=false"
		></atlas-dialog-ajuda>	

	</div>
</template>

<style>

.map-legend {
	position: absolute;
	right: 12px;
	bottom: 30px;
	background-color: rgba(255,255,255,0.8);
	color: #333;
	padding:8px;
	padding-top: 8px;
	padding-bottom:8px;
	border: 1px solid #aaa;
	z-index:9900;
}

.map-legend-title {
	font-weight:700;
}

.map-legend-color-key {
	width: 24px;
	border: 2px solid #eee;
}

.map-legend-btn-help {
	float: right;
}

</style>



<script>

import chroma from 'chroma-js'

import atlasDialogAjuda from './atlas-dialog-ajuda.vue'

export default {

	components: {
		atlasDialogAjuda
	},

	props: ['title', 'text', 'palette', 'domain', 'padding', 'labels', 'help' ],

	data () {
		return {
			collapsed: false,
			showDialogHelp: false
		}
	},

	computed: {

		labelsReversed () {
			if (!this.labels)
				return null
			return [...this.labels].reverse()
		},

		helpButtonColor () {
			if (this.help)
				return 'primary'
			return 'blue-grey lighten-4' 
		},

		colors () {
			return chroma
				.scale(this.palette)
				.colors(this.labels.length)
				.reverse()
		},

	},

	methods: {

	}

}

</script>