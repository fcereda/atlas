<template>

<div style="width:100%;min-height:100px;color:#333;">
	<div style="text-align:left">
		<v-btn flat color="grey darken-1" @click="closePanel" class="pl-0 pr-0 ml-0">
			<i class="material-icons">keyboard_arrow_left</i><span>Voltar à lista de candidatos</span>
		</v-btn>
	</div>

	<div class="pl-4" style="text-align:right">
		<v-switch 
			v-show="zonasInfo.length > 1"
			v-bind:label="'Agrupar distritos'" 
			v-model="mostrarDadosAgrupados" 
			color="info" 
			hide-details></v-switch>
	</div>	

	<div v-show="!mostrarDadosAgrupados" v-for="zona in zonasInfo" class="pa-4 painel-zonas">

		<h6>{{ zona.municipio }} &ndash; {{ zona.zona }}&ordf; ZE</h6>

		<table class="zona-detalhes">

			<tr class="zona-detalhes-tr" v-for="candidato in zona.candidatos">

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
					{{ formatInt(candidato.votos.numero) }}&nbsp;votos<br>
					{{ candidato.votos.porcentagem }}%
				</td>
 
   			</tr>	

		</table>

	</div>

	<div v-show="mostrarDadosAgrupados" class="pa-4 painel-zonas">

		<h6 v-show="false" v-html="dadosAgrupados.rotulo" style="line-height:125%">{{ '' && dadosAgrupados.rotulo }}</h6>

		<template v-for="municipio in dadosAgrupados.municipios">
		<span v-html="municipio.nome" style="font-size:20px;font-weight:500"></span> &ndash; 
		<span v-html="municipio.zonas + ' ZE'" style="font-size:16px"></span><br>
		</template>
		
		<table class="zona-detalhes">

			<tr class="zona-detalhes-tr" v-for="candidato in dadosAgrupados.candidatos">

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
					{{ formatInt(candidato.votos.numero) }}&nbsp;votos<br>
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
	padding-bottom:10px;
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

			mostrarDadosAgrupados: false,
			zonasInfo: this.zonas.map((idZona) => {
				return {
					id: idZona
				}
			}),
			dadosAgrupados: {
				zonas: [],
				rotulos: '',
				candidatos: []
			}

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

			this.dadosAgrupados = {
				zonas: [],
				rotulo: '',
				candidatos: []
			}  
			var dictMunicipios = Utils.groupBy(this.zonasInfo, zonaInfo => zonaInfo.municipio)
			var arrRotulo = []
			Object.keys(dictMunicipios).forEach((municipio) => {
				var zonas = Utils.replaceLast(dictMunicipios[municipio]
								.sort((a, b) => a.zona - b.zona)
								.map((zona) => zona.zona + '&ordf;')
								.join(', '), 
							', ', ' e '),
					zeStr = dictMunicipios[municipio].length > 1 ? 'ZEs' : 'ZE' 
				arrRotulo.push(`${municipio} (${zonas} ${zeStr})`)
			})
			this.dadosAgrupados.municipios = Object.keys(dictMunicipios).map((municipio) => {
				return {
					nome: municipio,
					zonas: Utils.replaceLast(dictMunicipios[municipio]
								.sort((a, b) => a.zona - b.zona)
								.map((zona) => zona.zona + '&ordf;')
								.join(', '), 
							', ', ' e '),
				}
			})
			this.dadosAgrupados.zonas = this.zonasInfo
			this.dadosAgrupados.rotulo = arrRotulo.join('<br>')
			this.dadosAgrupados.candidatos = this.dadosAgrupados.zonas.reduce((candidatos, zonaInfo) => {
				if (!candidatos) {
					return Utils.clone(zonaInfo.candidatos)
				}
				for (var i=0; i<candidatos.length; i++) {
					candidatos[i].votos.numero += zonaInfo.candidatos[i].votos.numero
					candidatos[i].votos.totalZona += zonaInfo.candidatos[i].votos.totalZona
					candidatos[i].votos.porcentagem = Math.round(candidatos[i].votos.numero * 10000 / candidatos[i].votos.totalZona) / 100
				}
				return candidatos
			}, null)
		}

	},

	methods: {

		obterVotos (idZona) {
			var candidatos = Store.candidatos.filter((candidato) => !candidato.disabled)
			var votos = candidatos.map(({id, nome, ano, cargo, partido, color, votos}) => {
				var votosZona = votos[idZona] 
				if (!votosZona) {
					votosZona = {
						numero: 0,
						total: 1000
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
						numero: votosZona.numero,
						totalZona: votosZona.total,
						porcentagem: Math.round((votosZona.numero / votosZona.total) * 10000)/100
					}
				}
			})
			return votos.sort((a, b) => b.votos.porcentagem - a.votos.porcentagem)
		},

		labelCargo (codigoCargo) {
			return Utils.obterNomeCargo(codigoCargo)
		},

		formatInt (numero) {
			return Utils.formatInt(numero)
		},

		closePanel () {
			this.$emit('close')
		},

	}

}

</script>