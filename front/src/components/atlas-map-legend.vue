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
			<table>
			<tr v-for="(label, index) in labels">
				<td class="map-legend-color-key" v-bind:style="'background-color:' + colors[index] + ';'">&nbsp;</td>
			 	<td style="padding-left:4px">{{ label }}</td>
			 </tr>
			 </table>	
		</div>	 

	</div>
</template>

<style>

.map-legend {
	position: absolute;
	right: 12px;
	bottom: 30px;
	//min-width:100px;
	//min-height:100px;
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

</style>



<script>

import chroma from 'chroma-js'

export default {

	props: ['title', 'text', 'palette', 'domain', 'padding', 'labels' ],

	data () {

		return {

			collapsed: false

		}

	},

	computed: {

		colors () {
			return chroma
				.scale(this.palette)
				.colors(this.labels.length)
		},

	},

	methods: {

	}

}

</script>