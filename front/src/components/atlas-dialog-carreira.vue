<template>

  <v-layout row justify-center height="900px" z-index="11000" style="z-index:11000;">

 	<v-dialog v-model="show" scrollable max-width="800px" z-index="11001;">
      <v-card>
        <v-card-title _style="background-color:#339;color:#ddd">
        	<span class="title">{{ nomeCompleto || nome }}</span>
        	<v-spacer></v-spacer>
        	<v-icon class="pointer" @click="closeDialog">close</v-icon></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>

        	<div class="pb-3" style="font-size:16px;font-weight:500;">Trajetória eleitoral desde 1998</div>

        	<atlas-item-carreira
        		v-for="eleicao in eleicoes"
        		:ano="eleicao.ano"
        		:cargo="eleicao.cargo"
                :uf="eleicao.uf"
        		:eleicoes="eleicao.desempenho"
                @add-candidate="addCandidate"
        	></atlas-item-carreira>
        	
        	<br><br>	

<!--



        	<table width="100%">
        	<template v-for="candidatura in candidaturas">
        	<tr>
        		<td rowspan="2">
        			<h5>{{ candidatura.ano }}</h5>
        		</td>
        		<td>{{ candidatura.nomeCargo }}	por {{ candidatura.uf }}</td>
        	</tr>	
        	<tr>
        		<td>
        			{{ candidatura.resultado }} com {{ formatInt(candidatura.votacao) }}votos 
	        		<span v-if="candidatura.classificacao"> ({{ candidatura.classificacao }}&ordf; lugar)</span>
        		</td>	
        	</tr>	
        	</template>
        	</table>
-->

<!--

			<p><b>Trajetória eleitoral desde 1998</b></p>        	
        	<table width="100%">
        	<tr>
        		<td>Ano</td>
        		<td>Cargo</td>
        		<td>Estado</td>
        		<td>Partido</td>
        		<td align="right">Votação</td>
        		<td align="right">Classificação</td>
        		<td align="right">Resultado</td>
        	</tr>	
        	<template v-for="candidatura in candidaturas">
        	 <tr v-if="candidatura">
        		<td>{{ candidatura.ano }}</td>
        		<td>{{ candidatura.nomeCargo }}</td>
        		<td>{{ candidatura.uf }}</td>
        		<td>{{ candidatura.partido }}</td>
        		<td align="right">{{ formatInt(candidatura.votacao) }}</td>
        		<td align="right">{{ candidatura.classificacao }}&ordm;</td>
        		<td align="right">{{ candidatura.resultado }}</td>
        	</tr>
        	</template>
        	</table>
-->            

        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
        <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click.native="closeDialog">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    </v-layout>

</div>

</template>

<style>

.overlay {
	z-index:11000 !important;
}

.dialog__content {
	z-index:11000 !important;
}

</style>


<script>

import api from '../lib/api.js'
import Utils from '../lib/utils.js'

import atlasItemCarreira from './atlas-item-carreira.vue'

export default {

	components: {
		atlasItemCarreira
	},

	props: ['show', 'nome', 'nomeCompleto', 'cpf'],

	data () {

		return {
			candidaturas: [],
            eleicoes: [],
		}

	},

	watch: {

		show () {
			if (this.show) {
				console.log('should open the dialog')
			}
		}

	},

	methods: {

	    closeDialog () {
            this.$emit('close')
      	},

        onInput (e) {
            if (!e) {
                this.closeDialog()
            }
        },

        formatInt (numero) {
        	return Utils.formatInt(numero)
        },

        carregarCarreira () {
        	api.getCandidateCareer(this.cpf, this.nomeCompleto)
        	.then((results) => {
        		var candidaturas = results.map((candidatura) => {
        			candidatura.nomeCargo = Utils.obterNomeCargo(candidatura.cargo)
        			return candidatura
        		})
        		candidaturas = candidaturas.sort((a, b) => {
        			if (a.ano != b.ano) {
        				return a.ano - b.ano
        			}
        			if (a.cargo < b.cargo) {
        				return -1
        			}
       				return 1
       			})

                // Populamos this.candidaturas com push() para garantir que o Vue vá
                // ver as alterações
                this.candidaturas = []
                candidaturas.forEach((cand) => this.candidaturas.push(cand))

                var eleicoes = Utils.groupBy(candidaturas, ({ ano }) => ano)
                this.eleicoes = []
                for (var ano in eleicoes) {
                    this.eleicoes.push({
                        ano,
                        cargo: eleicoes[ano][0].cargo,
                        uf: eleicoes[ano][0].uf,
                        desempenho: eleicoes[ano]
                    })
                }
        	})
        	.catch((error) => {
        		console.error('Error trying to load electoral career of candidate ' + this.nomeCompleto)
        		console.error(error)
        	})	
        },

        addCandidate (candidato) {
            alert('Ainda não implementado')
        }

    }    

}

</script>