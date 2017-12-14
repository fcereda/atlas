<template>

<div class="detail-card" v-show="visible" :style="cardStyle">

      <v-card>
        <v-card-title primary-title>
          <div>
            <h3 class="headline mb-0 pb-2">São Paulo Zona 2</h3>

		  <v-data-table
		      :items="votos"
		      class="elevation-1"
		      hide-actions
		      hide-headers
		    >
		    <template slot="items" scope="props">
		      <td>{{ props.item.nome }}</td>
		      <td class="text-xs-right">{{ props.item.ano }}</td>
		      <td class="text-xs-right">{{ props.item.votos }}</td>
		    </template>
		  </v-data-table>

          </div>
        </v-card-title>
        <v-card-actions>
          <v-btn flat color="orange" @click="close">Close</v-btn>
        </v-card-actions>
      </v-card>
</div>

</template>

<script>

export default {

	props: ['visible', 'left', 'top', 'data'],

	data () {

		return {

			votos: [{
				nome: 'Paulo Salim Maluf',
				ano: 1998,
				votos: 1567094
			},{
				nome: 'Paulo Salim Maluf',
				ano: 2002,
				votos: 960001
			}, { 
				nome: 'Paulo Salim Maluf',
				ano: 2006,
				votos: 800000
			}, {
				nome: 'Paulo Salim Maluf',
				ano: 2010,
				votos: 40000
			}]

		}

	},

	computed: {

		cardStyle () {
			var style = 'top:' + this.top + 'px;' + 'left:' + this.left + 'px;'
			console.log(style)
			return style
		}

	},

	methods: {

		close () {

			this.$emit('close');

		} 
		
	}

}

</script>

<style>

.detail-card {
	position: absolute;
	overflow:hidden;
}

</style>