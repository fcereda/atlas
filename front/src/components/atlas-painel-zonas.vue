<template>

<div style="width:100%;min-height:100px;color:#333;">
	<div style="text-align:right">
		<v-btn flat dark color="grey darken-1" @click="closePanel">
			<v-icon>keyboard_arrow_left</v-icon>&nbsp;&nbsp;Voltar à seleção de candidatos
		</v-btn>
	</div>

	<div v-for="zona in zonasInfo" class="pa-4 painel-zonas">

		<h6>{{ zona.municipio }} &ndash; {{ zona.zona }}&ordf; ZE</h6>

		<table class="zona-detalhes">

			<tr class="zona-detalhes-tr" v-for="candidato in zona.candidatos" style="padding-bottom:10px;">

				<td style="min-width:20px;">
					<div v-bind:style="'width:32px;height:32px;background-color:rgb('+candidato.color+');'">
						<v-icon class="pa-1" color="grey darken-3">account_circle</v-icon>
					</div>
				</td>


				<td width="100%">{{ candidato.nome}} ({{ candidato.partido}})
					<br>
					{{ labelCargo(candidato.cargo) }} {{ candidato.ano}}
				</td>
				<td align="right" >
					{{ candidato.votos.numero }}&nbsp;votos<br>
					{{ candidato.votos.porcentagem }}%
				</td>
 
   			</tr>	

		</table>

	</div>

</div>

</template>

<style>

.painel-zonas {
	border-bottom: 1px solid #aaa;
}

table.zona-detalhes {
	border-spacing: 4px 8px;
	border-collapse: separate;
}

.zona-detalhes-tr {
	padding-bottom:2px;
	padding-top:2px;
	border: 1px solid #aaa;

}

table.zona-detalhes tr td {
	padding-left: 2px;
	padding-right: 2px;
	padding-top: 2px;
	padding-bottom: 2px;
	margin-bottom: 4px;
	//background-color: yellow;
}
	
</style>

<script>

import Store from '../lib/store.js'
import Utils from '../lib/utils.js'

export default {

	props: ['zonas'],

	data () {

		return {

			zonasInfo: this.zonas.map((idZona) => {
				return {
					id: idZona
				}
			})

		}

	},

	watch: {

		zonas () {
			var coordenadas = Store.coordenadas
			this.zonasInfo = this.zonas.map((idZona) => {
				var coordenada = coordenadas[idZona]
				return {
					id: idZona,
					municipio: coordenada.municipio,
					zona: coordenada.zona,
					candidatos: this.obterVotos(idZona)
				}
			}).sort((a, b) => a.municipio > b.municipio ? 1 : a.municipio < b.municipio ? -1 : 0)
			  .sort((a, b) => a.zona > b.zona ? 1 : a.zona < b.zona ? -1 : 0)
		}

	},

	methods: {

		obterVotos (idZona) {
			var candidatos = Store.candidatos
			console.log(candidatos[0])
			var votos = candidatos.map(({id, nome, ano, cargo, partido, color, votos}) => {
				var votosZona = votos[idZona] 
				if (!votosZona) {
					votosZona = {
						numero: 0,
						total: 1
					}
				}	
				return {
					id,
					nome,
					ano,
					cargo,
					partido,
					color,
					votos: {
						numero: Utils.formatInt(votosZona.numero),
						porcentagem: Math.floor((votosZona.numero / votosZona.total) * 10000)/100
					}
				}
			})
			return votos.sort((a, b) => b.votos.porcentagem - a.votos.porcentagem)
		},

		labelCargo (codigoCargo) {
			return Utils.obterNomeCargo(codigoCargo)
		},

		closePanel () {
			this.$emit('close')
		},

	}

}

</script>