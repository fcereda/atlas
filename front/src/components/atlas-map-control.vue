<template>

<div>

	<div 
		v-for="button in buttons" 
		@click="onClick(button)" 
		v-bind:class="value==button.name?'selected-button':''"
	>
		<v-icon 
			v-if="button.icon" 
			class="pa-1" 
			:color="value==button.name?'blue darken-2':'grey darken-2'"
			:style="button.transform? 'transform:' + button.transform + ';' : '' "
		>
		{{ button.icon }}
		</v-icon>
		<div 
			v-if="button.label"
			class="char-icon"
		>{{ button.label }}</div>
	</div>

</div>

</template>

<script>

export default {

	props: [ 'buttons', 'value' ],

	data: function () {
		return {}
	},

	methods: {

		onClick: function (button) {
			this.$emit('input', button.name)
		}

	}

}

</script>

<style>

.selected-button {
	color: #64b5f6;
}

.char-icon {
	width:32px;
	height:32px;
	padding-top:4px;
	padding-bottom:4px;
	text-align:center;
	font-weight:800;
	font-size:18px;
}


</style>