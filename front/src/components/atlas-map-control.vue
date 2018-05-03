<template>

<div>

	<template v-for="button in buttons">

		<v-tooltip 
			left 
			open-delay="300">

			<div 
				@click="onClick(button)" 
				v-bind:class="buttonClass(button)"
				slot="activator"
			>
				<v-icon 
					v-if="button.icon" 
					class="pa-1" 
					:color="button.disabled ? 'grey lighten-3' : (value==button.name?'blue darken-2':'grey darken-2')"
					:style="button.transform? 'transform:' + button.transform + ';' : '' "
				>
				{{ button.icon }}
				</v-icon>
				<div 
					v-if="button.label"
					class="char-icon"
				>{{ button.label }}</div>

			</div>

		<span>{{ button.tooltip }}</span>
		</v-tooltip>

	</template>

</div>

</template>

<script>

export default {

	props: [ 'buttons', 'value' ],

	data: function () {
		return {}
	},

	methods: {

		buttonClass: function (button) {
			if (button.disabled)
				return 'disabled-button'
			if (this.value == button.name)
				return 'selected-button'
			return 'enabled-button'
		},

		onClick: function (button) {
			this.$emit('input', button.name)
		}

	}

}

</script>

<style>

.selected-button {
	color: #64b5f6;			/* blue darken-2 */
}

.enabled-button {
	color: #616161;			/* grey darken-2 */
}

.disabled-button {
	color: #EEEEEE;			/* grey-lighten-3 */
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