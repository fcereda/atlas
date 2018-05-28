<template>

<div>

	<div class="title pt-0 pb-1">
		{{ descricaoCargo }}
		<v-icon class="pointer" style="float:right;user-select:none;" @click="collapsed = !collapsed">{{ collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up' }}</v-icon>
	</div>

	<div v-show="loading && !collapsed">
		<p class="text-xs-center pt-4 pb-0">
		<v-progress-circular indeterminate color="primary"></v-progress-circular>
		</p>
	</div>

	<div v-show="!loading && !collapsed">
		<p v-show="message" class="text-xs-center pt-2" v-html="message"></p>

		<atlas-table-maisvotados-zona
			v-show="!agrupar"
			v-for="zona in resultadosZonas"
			:uf="uf"
			:municipio="zona.municipio"
			:zona="zona.zona"
			:candidatos="zona.candidatos"
			:totalVotos="zona.totalVotos"
			:id="zona.totalVotos"
			@add-candidate="adicionarCandidato"
		></atlas-table-maisvotados-zona>	

		<atlas-table-maisvotados-zona
			v-show="agrupar"
			:uf="uf"
			:zonas="zonaAgrupada.zonas"
			:candidatos="zonaAgrupada.candidatos"
			:totalVotos="zonaAgrupada.totalVotos"
			:id="zonaAgrupada.totalVotos * 2"
			@add-candidate="adicionarCandidato"
		></atlas-table-maisvotados-zona>	

	</div>	

</div>

</template>


<script>

import api from '../lib/api.js'
import Utils from '../lib/utils.js'

import atlasTableMaisvotadosZona from './atlas-table-maisvotados-zona.vue'

export default {

	props: ['uf', 'id', 'cargo', 'ano', 'zonas', 'agrupar'],

	components: {
		'atlas-table-maisvotados-zona': atlasTableMaisvotadosZona,
	},

	data () {

		return {

			totalVotos: 0,
			resultadosZonas: Utils.clone(this.zonas),
			zonaAgrupada: {
				descricao: '',
				candidatos: [],
				totalVotos: 0
			},
			loading: true,
			collapsed: false,
			message: ''

		}

	},

	computed: {

		nomeCargo () {
			return Utils.obterNomeCargo(this.cargo)
		},

		descricaoCargo () {
			return this.nomeCargo + ' ' + this.ano
		},

		candidatos () {

			var resultadosAgrupados = Utils.groupBy(this.resultados, (candidato) => candidato.numero),
				somaVotacaoFunc = (candidato) => soma + candidato.votacao,
				candidatos = resultadosAgrupados.map((resultado) => {
					var candidato = resultado[0]
					candidato.votacao = resultado.reduce(somaVotacaoFunc, 0)
				}),
				totalVotos = candidatos.reduce(somaVotacaoFunc, 0)

			candidatos.forEach((candidato) => {
				candidato.porcentagem = candidato.votacao / totalVotos
			}) 	

			this.totalVotos = totalVotos
			return candidatos

		}

	},


	watch: {

		cargo () {
			this.reload()
		},

		ano () {
			this.reload()
		},

		zonas () {
			this.resultadosZonas = Utils.clone(this.zonas)
			this.reload()
		}	

	},

	methods: {

		reload () {
			var self = this  // Save context for the then() callback

			if (!this.zonas || !this.zonas.length || !this.id)
				return

			this.loading = true
			this.message = ''
			
			var idZonas = this.zonas.map((zona) => zona.id)

			this.carregarMaisVotados(idZonas, this.id)
			.then((response) => {
				self.loading = false

				var resultadosZonas = []

				for (var i=0; i<response.length; i++) {
					let zonaId = idZonas[i],
						municipio = self.zonas[i].municipio,
						candidatos = response[i],
						totalVotos = 0
						
					candidatos = candidatos.sort((a, b) => b.votacao - a.votacao)						
					totalVotos = candidatos.reduce((total, candidato) => total + candidato.votacao, 0) 
					candidatos.forEach((candidato) => {
						candidato.porcentagem = candidato.votacao / totalVotos
						candidato.nome = Utils.capitalizeName(candidato.nome)
					})
/*
					candidatosEfetivos = 1 / candidatos.reduce((soma, candidato) => {
						return soma + Math.pow(candidato.porcentagem, 2)
					}, 0)
*/
					resultadosZonas.push({
						municipio,
						zona: zonaId,
						candidatos,
						totalVotos
					})
				}	

				var totalVotos = resultadosZonas.reduce((soma, resultadoZona) => soma + resultadoZona.totalVotos, 0)
				self.zonaAgrupada = {
					zonas: resultadosZonas.map((zona) => {
						return {
							municipio: zona.municipio,
							zonaId: zona.zona
						}
					}),
					totalVotos,
					candidatos: resultadosZonas
					// Agrega todos os candidatos nos diferentes arrays resultadoZonas.candidato
					// em um único array candidatos, somando os respectivos votos de cada candidato
					.reduce((candidatos, resultadoZona) => {
						if (!candidatos) {
							// O reduce utiliza a lista de candidatos do primeiro como base
							return Utils.clone(resultadoZona.candidatos)
						}
						resultadoZona.candidatos.forEach((candidato) => {
							for (var i=0; i<candidatos.length; i++) {
								if (candidatos[i].numero == candidato.numero) {
									candidatos[i].votacao += candidato.votacao
									break
								}
							}
							if (i == candidatos.length) {
								candidatos.push(Utils.clone(candidato))
							}
						})
						return candidatos
					}, null)
					// Recalcula as porcentagens de cada candidato
					.map((candidato) => { 
						candidato.porcentagem = candidato.votacao / totalVotos
						return candidato
					})
					// E não vamos nos esquecer de reordenar os candidatos, pois a ordem  
					// do primeiro distrito não deverá se manter no agregado!
					.sort((a, b) => b.votacao - a.votacao)
				}
				self.resultadosZonas = resultadosZonas	
			})
			.catch((error) => {
				console.error(`Error trying to load election data for election ${self.id}`)
				console.error(error)
				self.loading = false
				self.message = 'Não foi possível obter os dados para esta eleição<br>nos distritos selecionados'
			})	
		
		},

		carregarMaisVotados (idZonas, eleicaoId) {
			var uf = this.uf.sigla,
				ano,
				cargo

			// eleicaoId é no formato "ano-cargo"				
			eleicaoId = eleicaoId.split('-')	
			ano = eleicaoId[0]
			cargo = eleicaoId[1]

			// Agora, vamos criar argumentos para a função api.getElectionResultsByZonaAndCity(),
			// que será chamada várias vezes em sequência
			// Ao final das chamadas, teremos um array results com os resultados de todas as chamadas

			var argsArray = idZonas.map((zonaId) => {
				var [codMunicipio, numeroZona] = zonaId.split('-')
				return {
					ano,
					cargo,
					uf,
					codMunicipio,
					zona: numeroZona
				}
			})

			return api.runRequestsInSequence(api.getElectionResultsByZoneAndCity, argsArray)
		},		

		adicionarCandidato (id) {
			console.log('entrou em adicionarCandidato de atlas-subpainel-maisvotados-eleicoes, id = ' + id)
			this.$emit('add-candidate', id)
		}

	},

	mounted () {

		this.reload()

	}

}

</script>