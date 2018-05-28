<template>

<div class="pt-3 pb-0" style="width:100%;">
	<div class="titulo-zona pb-1" _style="font-size:18px;font-weight:500;">
		<atlas-titulo-zonas
			:zonas="zonas"
			:municipio="municipio"
			:numeroZona="numeroZona"
		></atlas-titulo-zonas>
	</div>	
	<div v-show="!candidatos || !candidatos.length">Não há dados desta eleição para este distrito</div>
	<table style="width:100%">
	<template v-for="(candidato, index) in candidatos">
		<tr v-show="index < maxIndex">
			<td align="right">{{ index+1 }}.&nbsp;</td>
			<td width="100%"><span class="link" @click="adicionarCandidato(candidato)">{{ identificacao(candidato) }}</span></td>
			<td align="right">{{ formatInt(candidato.votacao) }}</td>
			<td align="right">&nbsp;({{ (candidato.porcentagem * 100).toFixed(1) }}%)</td>
		</tr>	
	</template>
		<tr v-show="candidatos.length > maxIndex">
			<td>&nbsp;</td>
			<td colspan="3">
				<span class="link" @click="toggleMostrarTodos">+ {{ candidatos.length - maxIndex }} candidatos votados neste distrito</span>
			</td>
		</tr>	
		<tr v-show="mostrarTodosCandidatos && candidatos.length > numCandidatosPrimeiraTela">
			<td>&nbsp;</td>
			<td colspan="3">
				<span class="link" @click="toggleMostrarTodos">Mostrar apenas os mais votados</span>
			</td>
		</tr>	
		<tr v-if="totalVotos">
			<td>&nbsp;</td>
			<td><b>Total</b></td>
			<td align="right">{{ formatInt(totalVotos) }}</td>
			<td>&nbsp;votos</td>
		</tr>
	</table>		

</div>

</template>


<style>

.titulo-zona {
	font-size:18px;
	font-weight:500;
}

.link {
	cursor:pointer;
}

.link:hover {
	text-decoration: underline;
}

</style>

<script>

import atlasTituloZonas from './atlas-titulo-zonas.vue'

import Utils from '../lib/utils.js'
import Candidato from '../classes/candidato.js'

const NUM_CANDIDATOS_PRIMEIRA_TELA = 8

export default {

	components: {
		atlasTituloZonas
	},	

	props: ['uf', 'municipio', 'zona', 'descricao', 'zonas', 'candidatos', 'totalVotos' ],

	data () {

		return {
			mostrarTodosCandidatos: false
		}
	
	},

	computed: {

		numeroZona () {
			if (typeof(this.zona) == 'string') {
				return parseInt(this.zona.split('-')[1])   // this.zona está no formato 'codMun-numZona'
			}
			else {
				return this.zona
			}
		},

		maxIndex () {
			return this.mostrarTodosCandidatos ? this.candidatos.length : this.numCandidatosPrimeiraTela
		},

		numCandidatosPrimeiraTela () {
			if (this.candidatos && this.candidatos.length) {
				return Math.min(
					NUM_CANDIDATOS_PRIMEIRA_TELA, 
					this.candidatos.filter((candidato) => candidato.porcentagem >= 0.01).length
				)
			}
			else {
				return NUM_CANDIDATOS_PRIMEIRA_TELA
			}
		}

	},

	methods: {

		formatInt (numero) {
			return Utils.formatInt(numero)
		},

		identificacao (candidato) {
			if (Candidato.ePartido(candidato.cargo, candidato.numero)) {
				return `${candidato.partido} (legenda)`
			}
			return `${candidato.nome} (${candidato.partido})`
		},

		toggleMostrarTodos () {
			this.mostrarTodosCandidatos = !this.mostrarTodosCandidatos
		},

		adicionarCandidato (candidato) {
			let id = `${this.uf.sigla}-${Candidato.calcularId(candidato)}`
			console.log(id)
			console.log('vai agora emitir uma mensagem add-candidate')
			this.$emit('add-candidate', id)
		}

	}

}

</script>
