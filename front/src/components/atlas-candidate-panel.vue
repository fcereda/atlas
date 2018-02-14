<template>

<div class="candidate-record pt-2 pb-2 pl-1 pr-1" style="width:100%;display:flex;flex-direction:column">

	<div style="width:100%; display:flex; flex-direction:row;" @mouseover="hovering=true" @mouseout="hovering=false">

		<div class="icon-class pt-2" :xstyle="iconStyle" style="vertical-align: center;font-size:20px">
            <v-tooltip bottom z-index="1000">
              <v-menu
            	offset-x
            	:close-on-content-click="false"
            	:nudge-width="200"
            	v-model="popupColor"
            	slot="activator"
              > 
				<v-icon :style="iconStyle" large slot="activator">fiber_manual_record</v-icon>
                <color-picker
                	@input="changeColor"
                ></color-picker>
			  </v-menu>
              <span>Mudar cor</span>
            </v-tooltip>
		</div>
		<div class="candidate-title" style="width:100%; display:flex; flex-direction:row">
			<div class="candidate-name pointer" style="width:100%;flex:1" @click="openDetails">
				<span v-html="titulo"></span>
			</div>
			<!--
			<v-tooltip bottom class="z-index-top">
				<span v-if="hovering" class="pl-2 pointer" slot="activator">
					<v-icon color="primary" @click="removerCandidato">close</v-icon>
				</span>
				<span>Remover este candidato</span>
			</v-tooltip>	
			-->
			<v-tooltip bottom class="z-index-top pt-2" v-if="!disabled">
				<span v-if="!loading" class="pl-2 pr-2 pointer" slot="activator" @click="disableCandidato">
					<v-icon>visibility</v-icon>
				</span>
				<span>Ignorar este candidato temporariamente</span>
			</v-tooltip>	
			<v-tooltip bottom class="z-index-top pt-2" v-if="disabled">
				<span v-if="!loading" class="pl-2 pr-2 pointer" slot="activator" @click="enableCandidato">
					<v-icon>visibility_off</v-icon>
				</span>
				<span>Voltar a ver os dados deste candidato</span>
			</v-tooltip>	
			<v-tooltip bottom class="z-index-top">
				<div class="pointer pt-2 pr-2" v-if="!loading" slot="activator">
					<v-icon v-if="!showDetails" color="grey darken-1" @click="openDetails">keyboard_arrow_down</v-icon>
					<v-icon v-if="showDetails" color="grey darken-1" @click="closeDetails">keyboard_arrow_up</v-icon>
				</div>
				<span v-if="!showDetails">Ver índices individuais</span>
				<span v-if="showDetails">Comparar com os outros candidatos</span>
			</v-tooltip>	
			<span class="pr-3 pt-2" v-if="loading"><v-progress-circular size="20" indeterminate></v-progress-circular></span>
		</div>
	</div>		
	<div class="candidate-details-pane" ref="detailsPane" :style="detailsPaneStyle">
		<div class="icon-class pl-3 pr-2" :style="iconStyle"></div>
		<div class="candidate-details" style="width:100%">
			<div 
				class="pr-2 pb-1" 
				style="width:100%;text-align:right;"
			>
				<div>Votação{{ eCandidatoPresidente ? ' no estado' : ''}}: {{ totalStr }} 
					 ({{ (total / totalEleicao * 100).toFixed(2) }}% do total)</div>
				<div>Resultado: {{ identificacaoResultado }} &mdash; {{ classificacao }}º lugar 
				     {{ eCandidatoPresidente ? ' neste estado' : ''}}</div>

				<div>I de Moran: {{ formatFloat(indiceMoran, 4) }}</div>
				<div>Índice G: {{ formatFloat(indiceG*100, 2) }}%</div>
				
			</div>
			<div v-show="false" class="pb-1" style="display:flex;flex-direction:row;">
				<span style="flex:1"></span>
				<v-btn color="blue-grey lighten-1" class="white--text" @click="verCarreira">Carreira</v-btn>
				<v-btn v-show="!indicesIndividuais" color="primary" :disabled="disabled" @click="verIndicesIndividuais">Ver índices individuais</v-btn>
				<v-btn v-show="indicesIndividuais" color="primary" :disabled="disabled" @click="esconderIndicesIndividuais">Comparar no mapa</v-btn>				
			</div>

        <v-layout row wrap class="pt-3">
          <v-spacer></v-spacer>

          <v-flex xs12 sm2>
            <v-tooltip bottom z-index="1000">
              <v-btn flat icon slot="activator" @click="closeDetails">
                <v-icon>group</v-icon>
              </v-btn>
              <span>Comparar os candidatos da lista</span>
            </v-tooltip>  
          </v-flex>

<!--
          <v-flex xs12 sm2>
            <v-tooltip bottom z-index="1000">
              <v-menu
            	offset-x
            	:close-on-content-click="false"
            	:nudge-width="200"
            	v-model="popupColor"
            	slot="activator"
              > 
                <v-btn flat icon slot="activator">
                  <v-icon>format_color_fill</v-icon>
                </v-btn>

                <color-picker
                	@input="changeColor"
                ></color-picker>

			  </v-menu>
              <span>Mudar cor</span>
            </v-tooltip>
          </v-flex>
-->
          <v-flex xs12 sm2>
		    <v-tooltip bottom z-index="1000">
			<v-menu
		      offset-x
		      :close-on-content-click="false"
		      :nudge-width="200"
		      v-model="popupConfirm"
		      slot="activator"
		    >
		      <v-btn flat icon slot="activator">
		      	<v-icon>close</v-icon>
		      </v-btn>

		      <v-card>
		        <v-list>
		          <v-list-tile>
		          	Deseja realmente remover este candidato da lista?
		          	</v-list-tile>
		        </v-list>
		        <v-card-actions>
		          <v-spacer></v-spacer>
		          <v-btn flat color="primary" @click="popupConfirm=false">Cancelar</v-btn>
		          <v-btn flat color="error" @click="popupConfirm=false || removerCandidato()">Sim, remover</v-btn>
		        </v-card-actions>
		      </v-card>
		    </v-menu>
		    <span>Remover este candidato da lista</span>
		    </v-tooltip>    
		  </v-flex>	   



          <v-flex xs12 sm2>
            <v-tooltip bottom z-index="1000" v-if="!disabled">
              <v-btn flat icon slot="activator" @click="disableCandidato">
                <v-icon>visibility</v-icon>
              </v-btn>
              <span>Excluir temporariamente das comparações</span>
            </v-tooltip>  

            <v-tooltip bottom z-index="1000" v-if="disabled">
              <v-btn flat icon slot="activator" @click="enableCandidato">
                <v-icon>visibility_off</v-icon>
              </v-btn>
              <span>Incluir novamente nas comparações</span>
            </v-tooltip>  
          </v-flex>


<!--
          <v-flex xs12 sm2>
            <v-btn flat icon>
              <v-icon>insert_chart</v-icon>
            </v-btn>
          </v-flex>
-->          
          <v-flex xs12 sm2>
            <v-tooltip bottom z-index="1000">
              <v-btn flat icon slot="activator" @click="salvarArquivoCSV">
                <v-icon>file_download</v-icon>
              </v-btn>
              <span>Baixar dados da votação em formato CSV</span>
            </v-tooltip>  
          </v-flex>

          <v-flex xs12 sm2>
            <v-tooltip bottom z-index="1000">
              <v-btn flat icon slot="activator" @click="verCarreira">
                <v-icon style="transform:rotate(180deg);">toc</v-icon>
              </v-btn>
              <span>Ver trajetória eleitoral</span>
              </v-tooltip>
          </v-flex>
          
        </v-layout>



		</div>	
	</div>

	<v-snackbar
	  color="orange darken-4"      
	  :timeout="snackbar.timeout"
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
	border-bottom: 1px solid #ccc;
	/*margin-top: 4px;
	margin-bottom: 12px;
	*/
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
import colorPicker from './color-picker.vue'
import chroma from 'chroma-js'

export default {

	components: {
		colorPicker
	},

	props: ['nome', 'partido', 'ano', 'numero', 'cargo', 'color', 'classificacao', 'resultado', 'total', 'totalEleicao', 'indiceLQ', 'indiceG', 'indiceMoran', 'loading', 'disabled', 'showDetails'],

	data () {

		return {
			indicesIndividuais: false,
			hovering: false,
			popupColor: false,
			popupConfirm: false,
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

		eCandidatoPresidente () {
			return ['pr1', 'pr2'].includes(this.cargo)
		},

        identificacaoResultado () {
        	var resultado = this.resultado,
        		cargo = this.cargo
        	if (!resultado || resultado == '')
        		return ''
            if (resultado.indexOf('ELEITO') == 0)
                return 'Eleito'
            if (resultado.charAt(0) == '2')
                return 'Passou para o 2o. turno'
            if (resultado.indexOf('SUPLENTE') == 0)
                return 'Obteve uma suplência'
            // Se chegar aqui, é porque não foi eleito.
            // Vamos escolher a mensagem certa de acordo com cargo
            if (cargo == 'pr1' || cargo == 'g1')
                return 'Não passou para o 2o. turno'
            return 'Não foi eleito'
        },		

		iconStyle () {
			var style = 'color: rgb('
			if (this.disabled) {
				style += '240,240,240);'
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
			return Utils.obterNomeCargo(this.cargo)  

		},

		titulo () {
			return `${this.nome} (${this.partido}) <br> <span style="color:#555;">${this.labelCargo} ${this.ano}</span>`
		},

		totalStr () {
			return Utils.formatInt(this.total)
		},

	}, 

	methods: {
		formatFloat (num, digits) {
			if (!num)
				return ''
			return Utils.formatFloat(num, digits)
		},

		openDetails () {
			this.$emit('open')
		},

		closeDetails () {
			this.esconderIndicesIndividuais()
			this.$emit('close')
		},

		toggleDetails () {
			if (this.showDetails)
				this.closeDetails()
			else
				this.openDetails()
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

		verCarreira () {
			this.$emit('ver-carreira')
		},

		salvarArquivoCSV () {
			this.$emit('salvar-arquivo')
		},

		changeColor (color) {
			this.popupColor = false
			var rgbs = chroma(color).rgb()
			this.$emit('change-color', rgbs.join(','))
			if (this.disabled) {
				this.enableCandidato()
			}
		}

	}
}		

</script>