<template>

<div class="candidate-record elevation-2" style="width:100%;display:flex;flex-direction:column">

	<div style="width:100%; display:flex; flex-direction:row;" @mouseover="hovering=true" @mouseout="hovering=false">
		<div class="icon-class" :style="iconStyle">
			<v-icon class="pt-1 pl-1 pr-1" color="grey darken-3" @click="toggleEnableCandidato">{{ icone }}</v-icon>
		</div>
		<div class="candidate-title" style="width:100%; display:flex; flex-direction:row">
			<div class="candidate-name pointer" style="width:100%;flex:1" @click="openDetails">
				<v-tooltip bottom class="z-index-top">
					<span slot="activator" v-html="titulo"></span>
					<span v-html="titulo"></span>
				</v-tooltip>	
			</div>
			<v-tooltip bottom class="z-index-top">
				<span v-if="hovering" class="pl-2 pointer" slot="activator">
					<v-icon color="primary" @click="removerCandidato">close</v-icon>
				</span>
				<span>Remover este candidato</span>
			</v-tooltip>	
			<v-tooltip bottom class="z-index-top" v-if="!disabled">
				<span v-if="hovering" class="pl-2 pr-2 pointer" slot="activator" @click="disableCandidato">
					<v-icon color="primary">visibility</v-icon>
				</span>
				<span>Ignorar este candidato temporariamente</span>
			</v-tooltip>	
			<v-tooltip bottom class="z-index-top" v-if="disabled">
				<span v-if="hovering" class="pl-2 pr-2 pointer" slot="activator" @click="enableCandidato">
					<v-icon color="primary">visibility_off</v-icon>
				</span>
				<span>Voltar a ver os dados deste candidato</span>
			</v-tooltip>	
			<v-tooltip bottom class="z-index-top">
				<div class="pointer" v-if="!loading" slot="activator">
					<v-icon v-if="!showDetails" color="grey darken-1" @click="openDetails">keyboard_arrow_down</v-icon>
					<v-icon v-if="showDetails" color="grey darken-1" @click="closeDetails">keyboard_arrow_up</v-icon>
					</div>
				<span>Ver mais opções</span>
			</v-tooltip>	
			<span v-if="loading">&nbsp;&nbsp;<v-progress-circular size="20" indeterminate></v-progress-circular></span>
		</div>
	</div>		
	<div class="candidate-details-pane" ref="detailsPane" :style="detailsPaneStyle">
		<div class="icon-class pl-3 pr-2" :style="iconStyle"></div>
		<div class="candidate-details" style="width:100%">
			<div 
				class="pr-2 pb-1" 
				style="width:100%;text-align:right;"
			>
				<div>Total de votos{{ cargo == 'pr1' || cargo == 'pr2' ? ' neste estado' : ''}}: {{ totalStr }}</div>
				<div>Classificação{{ cargo == 'pr1' || cargo == 'pr2' ? ' neste estado' : ''}}: {{ classificacao }}</div>
<!--
				<br>
				Índice LQ: {{ indiceLQ }}<br>
				Índice G: {{ indiceG }}
-->				
			</div>
			<div class="pb-1" style="display:flex;flex-direction:row;">
				<span style="flex:1"></span>
				<v-btn v-if="false" color="blue-grey darken-1" @click="snackbar.display=true">Ver carreira</v-btn>
				<v-btn v-show="!indicesIndividuais" color="primary" :disabled="disabled" @click="verIndicesIndividuais">Ver índices individuais</v-btn>
				<v-btn v-show="indicesIndividuais" color="primary" :disabled="disabled" @click="esconderIndicesIndividuais">Voltar a gráficos comparativos</v-btn>				
			</div>
		</div>	
	</div>

	<v-snackbar
		color="orange darken-4"      :timeout="snackbar.timeout"
      :top="snackbar.y === 'top'"
      :bottom="snackbar.y === 'bottom'"
      :right="snackbar.x === 'right'"
      :left="snackbar.x === 'left'"
      :multi-line="snackbar.mode === 'multi-line'"
      :vertical="snackbar.mode === 'vertical'"
      v-model="snackbar.display"
    >
      {{ snackbar.text }}
      <v-btn flat color="black" @click.native="snackbar.display = false">Close</v-btn>
    </v-snackbar>

</div>	

</template>

<style>

.no-padding {
	padding: 0;
}
/*
.candidate-record {
	width:100%;
	background-color: transparent; 
	border: 1px solid #888;
	margin-top:4px;
	margin-bottom:12px;
	user-select: none;
}
*/
.candidate-record {
	width:100%;
	border: 1px solid #eee;
	margin-top: 4px;
	margin-bottom: 12px;
	user-select: none;
}


.icon-class {
	width:32px;
	cursor: pointer;
}

.candidate-title {
	padding-top:4px;
	padding-bottom:4px;
	padding-left:8px;
	padding-right:4px;
	overflow:hidden;
}

.candidate-name {
	padding-top:1px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow:hidden;
}

.candidate-details-pane {
	width:100%;
	display:flex;
	flex-direction:row;
	overflow:hidden;
	transition: all 0.5s ease;
}

.candidate-details {
	padding:4px;
	padding-top:8px;
	padding-left:8px;
}

.z-index-top {
	z-index:10000;
}

</style>

<script>

import Utils from '../lib/utils.js'

export default {

	props: ['nome', 'partido', 'ano', 'numero', 'cargo', 'color', 'classificacao', 'total', 'indiceLQ', 'indiceG', 'loading', 'disabled', 'showDetails'],

	data () {

		return {
			indicesIndividuais: false,
			hovering: false,
			snackbar: {
				x: 'left',
				y: 'top',
				display: false,
				timeout: 6000,
				text: 'Ainda não implementado'
			}

		}	

	},

	computed: {

		eVotoLegenda () {
			if (this.cargo == 'de' || this.cargo == 'df' || this.cargo == 'dd') {
				return parseInt(this.numero) < 1000
			}
			return false
		},

		icone () {
			if (this.eVotoLegenda)
				return 'account_balance'
			else
				return 'account_circle'
		},

		iconStyle () {
			var style = 'background-color: rgb('
			if (this.disabled) {
				style += '96,96,96);'
			}
			else {
				style += this.color + ')'
			}
			return style
		},

		detailsPaneStyle () {
			return this.showDetails ? `height:${ this.$refs.detailsPane.scrollHeight + 2}px;` : 'height:0;' 
		},

		labelCargo () {
			// o segundo argumento indica que queremos a versão curta do cargo
			// p.ex, "Presidente T1" em lugar de "Presidente 1o. turno"
			return Utils.obterNomeCargo(this.cargo, true)  

		},

		titulo () {
			return `${this.nome} (${this.partido}) &mdash; ${this.labelCargo} ${this.ano}`
		},

		totalStr () {
			return Utils.formatInt(this.total)
		},

	}, 

	watch: {

		showDetails () {
			if (!this.showDetails) {
				this.esconderIndicesIndividuais()
			}				
		}

	},

	methods: {
		openDetails () {
			this.$emit('open')
		},

		closeDetails () {
			this.esconderIndicesIndividuais()
			this.$emit('close')
		},

		removerCandidato () {
			this.$emit('remove')
		},

		disableCandidato () {
			this.$emit('disable')
		},

		enableCandidato () {
			this.$emit('enable')
		},

		toggleEnableCandidato () {
			this.$emit(this.disabled ? 'enable' : 'disable')
		},

		verIndicesIndividuais () {
			this.indicesIndividuais = true
			this.$emit('ver-indices')
		},

		esconderIndicesIndividuais () {
			this.indicesIndividuais = false			
			this.$emit('esconder-indices')	
		},

		showsnack () {
			// ISTO NÃO FUNCIONA, REMOVER NA REVISÃO
			//this.$root.$snackbar('Hello World!', 'error')
		}

	}
}		

</script>