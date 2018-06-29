<template>

  <v-layout row justify-center height="900px" z-index="11000" style="z-index:11000;">

 	<v-dialog v-model="show" persistent scrollable max-width="700px" z-index="11001;">
      <v-card>
        <v-card-title _style="background-color:#339;color:#ddd">
        	<span class="title">{{ title }}</span>
        	<v-spacer></v-spacer>
        	<v-icon class="pointer" @click="closeDialog">close</v-icon></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text :class="vCardTextClass">

        	<div 
        		v-if="!!text" 
        		class="pb-3" 
        		style="font-size:16px;" 
        		v-html="text"
        	></div>

        	<iframe 
        		v-if="!!iframe" 
        		width="700" 
        		height="500" 
        		marginheight="16"
        		marginwidth="16"
        		frameborder=0 
        		:src="iframe"
        	></iframe>
       	
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
        <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click.native="closeDialog">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    </v-layout>



</template>

<script>

'use strict'

export default {

	props: ['title', 'text', 'show', 'iframe'],

	data () {

		return {}

	},

	computed: {
		vCardTextClass () {
			if (this.iframe) 
				return 'pa-0'
		}
	},

	methods: {

		closeDialog () {
			this.$emit('close')
		}

	}

}

</script>

<style>

</style>