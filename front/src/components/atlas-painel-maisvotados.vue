<template>

<div>

	<div v-show="!zonasInfo.length" class="pa-3">
	Clique em um distrito no mapa para ver os candidatos mais votados naquele distrito.
	</div>

	<div>
		<div class="pl-4 pt-2 pb-2" style="text-align:right">
			<v-switch 
				v-show="zonasInfo.length > 1"
				v-bind:label="'Agrupar distritos'" 
				v-model="mostrarDadosAgrupados" 
				color="info" 
				hide-details></v-switch>
		</div>	
<!--
		<v-expansion-panel expand>
			<v-expansion-panel-content
				v-if="true" 
				v-for="eleicao in eleicoes" 
				:key="eleicao.id"
				class="pa-4" style="background-color:yellow;">

				<div slot="header">Item {{ eleicao.cargo }} {{eleicao.ano}}</div>


				<atlas-subpainel-maisvotados-eleicao
					:uf="uf"
					:id="eleicao.id"
					:cargo="eleicao.cargo"
					:ano="eleicao.ano"
					:zonas="zonasInfo"
				></atlas-subpainel-maisvotados-eleicao>
			
			</v-expansion-panel-content>		
		</v-expansion-panel>
-->

		<div
			v-if="visible" 
			v-for="eleicao in eleicoes" 
			class="pl-4 pr-4 pt-3 pb-3 border-bottom">

			<atlas-subpainel-maisvotados-eleicao
				:uf="uf"
				:id="eleicao.id"
				:cargo="eleicao.cargo"
				:ano="eleicao.ano"
				:zonas="zonasInfo"
				:agrupar="mostrarDadosAgrupados"
			></atlas-subpainel-maisvotados-eleicao>
			
		</div>		

	</div>		

</div>

</template>

<style>

.border-top {
	border-top: 1px solid #ddd;
}

.border-bottom {
	border-bottom: 1px solid #ddd;
}

</style>

<script>

import api from '../lib/api.js'
import Store from '../lib/store.js'
import Utils from '../lib/utils.js'

import atlasSubpainelMaisvotadosEleicao from './atlas-subpainel-maisvotados-eleicao'

export default {

	components: {
		'atlas-subpainel-maisvotados-eleicao': atlasSubpainelMaisvotadosEleicao
	},

	props: ['uf', 'zonas'],

	data () {

		return {
			visible: false,
			mostrarDadosAgrupados: false,

			eleicoes: [],
			zonasAnteriores: [],
			eleicoesAnteriores: [],
			zonasInfo: [],
			eleicoesIds: [],
			dadosAgrupados: {
				zonas: [],
				rotulos: '',
				candidatos: []
			}

		}

	},

	watch: {

		zonas () {	
			var coordenadas = Store.coordenadas,
				candidatos = Store.candidatos
			this.zonasInfo = this.zonas.map((idZona) => {
				var coordenada = coordenadas[idZona]
				return {
					id: idZona,
					municipio: coordenada.municipio,
					zona: parseInt(coordenada.zona),
					candidatos: this.obterVotos(idZona),
					loading: true,
					resultadosEleicoes: []
				}
			}).sort((a, b) => a.zona > b.zona ? 1 : a.zona < b.zona ? -1 : 
			  				  a.municipio > b.municipio ? 1 : a.municipio < b.municipio ? -1 : 0)

			this.eleicoesIds = Object.keys(Utils.groupBy(candidatos, ({ ano, cargo }) => this.calcularEleicaoId(ano, cargo)))
			this.eleicoes = this.eleicoesIds.map((id) => {
				var [ano, cargo] = id.split('-') // id está no formato `ano-cargo`
				return {
					id,
					ano,
					cargo,
					nomeCargo: Utils.obterNomeCargo(id)
				}
			})
		}

	},

	methods: {

		calcularEleicaoId(ano, cargo) {
			return ano + '-' + cargo
		},
/*
		carregarMaisVotados (zonaId, eleicaoId) {
			var uf = this.uf.sigla,
				ano,
				cargo,
				codMunicipio,
				numeroZona

			// eleicaoId é no formato "ano-cargo"				
			eleicaoId = eleicaoId.split('-')	
			ano = eleicaoId[0]
			cargo = eleicaoId[1]
			// zonaId é no formato "codMunicipio-numeroZona"
			zonaId = zonaId.split('-') 
			codMunicipio = parseInt(zonaId[0])
			numeroZona = parseInt(zonaId[1])
			return api.getElectionResultsByZoneAndCity ({ano, cargo, uf, codMunicipio, zona:numeroZona})
		},

		formatInt (num) {
			return Utils.formatInt(num)
		},
*/
		obterVotos (idZona) {
			return []
		},

		setVisible (visible) {
			this.visible = visible
		}

	}
			
}

</script>