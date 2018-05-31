<template>

<div class="atlas-logo" v-bind:class="classLogo">
	<span ref="atlas-cepesp">CEPESP</span>
	<span ref="atlas-atlas-eleitoral" class="atlas-logo-light">Atlas&nbsp;Eleitoral</span>
</div>


</template>

<script>

export default {

	props: ['modo-inicial'],

	computed: {

		classLogo () {
			return this.modoInicial ? 'atlas-logo-grande' : 'atlas-logo-pequeno'
		}

	},
	
	data: function () {

		return {}

	}

}

</script>

<style>

.atlas-logo {
	transition: all 0.4s ease;  
    font-weight:700;	
    color:#1a237e;	
	cursor:pointer;
	display:inline-block;
}

.atlas-logo-light {
	font-weight:100
}

.atlas-logo-grande {
    font-size:48px;
    line-height:1.0;
    padding-top:12px;
    flex-direction:column;
}

.atlas-logo-pequeno {
    font-size:22px;
    padding-top:0px;
    padding-bottom:0px;
    flex-direction:row;
}


</style>