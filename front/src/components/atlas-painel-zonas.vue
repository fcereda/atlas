<template>

<div style="width:100%;min-height:100px;color:#333;">

	<div v-show="!temZonaSelecionada" class="pa-3">
		{{ mensagemDefault }}
	</div>

	<div class="pl-4 pt-2" style="text-align:right" v-show="!mostrarIndicesIndividuais">
		<v-switch 
			v-show="zonasInfo.length > 1"
			v-bind:label="'Agrupar distritos'" 
			v-model="mostrarDadosAgrupados" 
			color="info" 
			hide-details></v-switch>
	</div>	

	<div class="pl-4 pt-4 pb-0" v-if="mostrarIndicesIndividuais">
		<span class="nome-candidato">{{ nomeCandidato }}</span>
	</div>	

	<div 
		v-show="!mostrarDadosAgrupados || mostrarIndicesIndividuais" 
		v-for="zona in zonasInfo" 
		class="pa-4 painel-zonas"
	>
		<h6>{{ zona.municipio }} &ndash; {{ zona.zona }}&ordf; ZE</h6>

		<table class="zona-indices" v-if="mostrarIndicesIndividuais">

			<tr class="zona-indices-tr">
				<td>
					Votação do candidato:
				</td>	
				<td>&nbsp;&nbsp;
					{{ formatInt(zona.indices.votos) }} votos
					({{ formatFloat(zona.indices.votos / zona.indices.total * 100, 2) }}%) 
				</td>	
			</tr>		
			<tr class="zona-indices-tr" v-for="indice in indicesIndividuais">
				<td>{{ indice.label }}:</td>
				<td>
					<div style="width:45px;text-align:right;">
						{{ indice.prefix}} {{ formatFloat(zona.indices[indice.id], indice.numDigits || 3) }} {{ indice.suffix }}
					</div>	
				</td>
			</tr>
			
		</table>		

		<table class="zona-detalhes" v-if="!mostrarIndicesIndividuais">

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

	<div 
		v-if="mostrarDadosAgrupados && !mostrarIndicesIndividuais" 
		class="pa-4 painel-zonas"
	>
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

.nome-candidato {
	font-size: 22px;
	font-weight:400;
}

table.zona-detalhes {
	border-spacing: 4px 8px;
	border-collapse: separate;
}

.zona-indices-tr {
	padding-bottom: 0px;
	padding-top: 0px;
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

	props: ['zonas', 'candidato'],

	data () {

		return {

			indicesIndividuais: [ {
				label: 'Quociente de locação',
				id: 'indiceLQ'
			}, {
				label: 'I de Moran Local',
				id: 'indiceLI'
			}, {
				label: 'Diferença de locação',
				id: 'indiceLD',
				numDigits: 4
			}, {
				label: 'Valor Z',
				id: 'indiceZ'
/*
			}, {
				label: 'Coeficiente de relevância',
				id: 'indiceRI'
*/				
			}],

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
			},

		}

	},

	computed: {

		mensagemDefault () {
			var candidato = this.candidato
			if (this.candidato)
				return 'Clique em um distrito no mapa para ver detalhes do desempenho do candidato selecionado.'
			else
				return 'Clique em um distrito no mapa para ver o desempenho dos candidatos selecionados naquele distrito.'
		},

		temZonaSelecionada () {
			return this.zonas && this.zonas.length
		},

		mostrarIndicesIndividuais () {
			// true if this.candidato is not null, false otherwise
			return !!this.candidato
		},

		nomeCandidato () {
			if (!this.candidato)
				return ''
			var nomeStr = this.candidato.nome + ' ' + this.candidato.ano
			if (this.candidato.cargo.includes('1')) 
				nomeStr += ' T1'
			else if (this.candidato.cargo.includes('2'))
				nomeStr += ' T2'
			return nomeStr
		},

	},

	watch: {

		zonas () {
			this.recalcularDados()
			return

			var coordenadas = Store.coordenadas
			this.zonasInfo = this.zonas.map((idZona) => {
				var coordenada = coordenadas[idZona]
				return {
					id: idZona,
					municipio: coordenada.municipio,
					zona: coordenada.zona,
					candidatos: this.obterVotos(idZona),
					indices: this.obterIndicesCandidatoSelecionado(idZona)
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
		},
		
		candidato () {
			this.recalcularDados()
		}

	},

	methods: {

		recalcularDados () {

			var coordenadas = Store.coordenadas
			this.zonasInfo = this.zonas.map((idZona) => {
				var coordenada = coordenadas[idZona]
				return {
					id: idZona,
					municipio: coordenada.municipio,
					zona: coordenada.zona,
					candidatos: this.obterVotos(idZona),
					indices: this.obterIndicesCandidatoSelecionado(idZona)
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

		},

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

		obterIndicesCandidatoSelecionado (idZona) {
			var candidato = Store.candidatos.obterCandidato(this.candidato)
			if (!candidato) {
				return
			}
			var retval =  {
				...candidato.indices[idZona], 
				votos: candidato.votos[idZona].numero, 
				total: candidato.votos[idZona].total
			}	
			return retval
		},

		labelCargo (codigoCargo) {
			return Utils.obterNomeCargo(codigoCargo)
		},

		formatInt (numero) {
			return Utils.formatInt(numero)
		},

		formatFloat (numero, casasDecimais) {
			return Utils.formatFloat(numero, casasDecimais)
		},

		closePanel () {
			this.$emit('close')
		},

	}

}

</script>