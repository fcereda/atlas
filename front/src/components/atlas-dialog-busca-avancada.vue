<template>
  <v-layout row justify-center style="z-index:10000;">
    <v-dialog v-model="show" max-width="700px"  z-index="10000" @input="onInput">
      <v-card>
        <v-card-title>
          <span class="headline">Busca avançada de candidatos</span>
        </v-card-title>
        <v-card-text class="pt-0 pb-0">
          <v-container grid-list-md>
            <v-layout wrap>
              <v-flex xs12 sm6 md3>
                <v-select 
                  label="Ano"
                  v-model="anoSelecionado" 
                  v-bind:items="anos" 
                  clearable
                  hide-details 
                ></v-select>
              </v-flex>
              <v-flex xs12 sm6 md5>
                <v-select 
                  label="Cargo"
                  v-model="cargoSelecionado" 
                  v-bind:items="cargos" 
                  item-text="name"
                  item-value="id"
                  clearable
                  hide-details 
                ></v-select>
              </v-flex>
              <v-flex xs12 sm6 md4>
                  <v-select
                      label="Partido"
                      v-bind:items="partidos"
                      v-model="partidoSelecionado"
                      max-height="400"
                      autocomplete
                      clearable
                      @keydown.native="selectOnKey"
                      @keyup.native="selectOnKey"
                      @keypress.native="selectOnKey"
                  ></v-select>
              </v-flex>
              <v-flex xs12 sm6 md8 class="pt-0">
                <v-text-field label="Nome" v-model="nomeSelecionado" hint="Basta digitar parte do nome"></v-text-field>
              </v-flex>
              <v-flex xs12 sm6 md4 class="pt-0 pb-1">
                <v-select 
                  label="Mostrar apenas"
                  v-bind:items="filtros" 
                  v-model="filtroSelecionado" 
                  clearable
                  hide-details 
                ></v-select>
              </v-flex>     

<!--
              <v-flex xs12 sm6 md6>
                <v-text-field label="Limitar aos votados em" hint="Escolha um município"></v-text-field>
              </v-flex>
-->              
              <v-flex xs12>

                  <scrolling-data-table
                    :headers="headersCandidatos"
                    :items="candidatosEncontrados"
                    item-key="id"
                    :selectable="true"
                    :selectRow="true"
                    no-data-text="Nenhum candidato encontrado"
                    max-height="320"
                    @input="candidatosSelecionados = $event"
                  ></scrolling-data-table>

 
<!--

  <v-data-table
      v-bind:headers="headersCandidatos"
      :items="candidatosEncontrados"
      v-model="candidatosSelecionados"
      item-key="id"
      no-data-text="Nenhum candidato encontrado"
      select-all      
      class="elevation-1"
    >
    <template slot="items" slot-scope="props">
      <td class="pl-1 pr-1">
        <v-checkbox
          primary
          hide-details
          v-model="props.selected"
        >
        </v-checkbox>
      </td>
      <td class="pl-0 text-xs-left">{{ props.item.nome }} ({{ props.item.partido }})</td>
      <td class="text-xs-right">{{ props.item.ano }}</td>
      <td class="text-xs-right">{{ props.item.nomeCargo }}</td>
      <td class="text-xs-right">{{ props.item.votacaoFormatada }}</td>
    </template>
  </v-data-table>

-->

              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>

          <v-spacer></v-spacer>
          
          <v-btn color="blue darken-1" flat @click.native="closeDialog">Cancelar</v-btn>
          <v-btn v-if="!candidatosEncontrados.length" color="blue darken-1" flat @click.native="procurarCandidatos">Procurar</v-btn>
          <v-btn v-if="candidatosEncontrados.length" :disabled="isAdicionarDisabled" color="orange darken-2" flat @click.native="adicionarCandidatosSelecionados">Adicionar</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>

import axios from 'axios'
import api from '../lib/api.js'
import Utils from '../lib/utils.js'
import scrollingDataTable from './scrolling-data-table.vue'

export default {

    components: {
      'scrolling-data-table': scrollingDataTable
    },

    props: ['show', 'uf'],

    data () {
      return {
        dialog: false,
        ordenarPorVotacao: false,

        anos: [1998, 2002, 2006, 2010, 2014],
        anoSelecionado: null,

        cargos: Utils.obterCargos(),
        cargoSelecionado: null,

        todosPartidos: [],
        partidos: [],
        partidoSelecionado: null,

        nomeSelecionado: null,

        filtros: ['Eleitos', 'Suplentes', 'Não eleitos', 'Eleitos ou suplentes'],
        filtroSelecionado: null,

        headersCandidatos0: [
          {
            text: 'Nome e partido',
            align: 'left',
            sortable: true,
            value: 'nome'
          },
          { text: 'Ano', value: 'ano' },
          { text: 'Cargo', value: 'cargo' },
          { text: 'Votação', value: 'votacao', align:'right' }
        ],

        headersCandidatos: [{
          name: 'Nome e partido',
          align: 'left',
          sortable: true,
          value: 'displayName'
        }, { 
          name: 'Ano',  
          value: 'ano',
          align: 'right',
          sortable: true,
        }, { 
          name: 'Cargo', 
          value: 'cargo',
          align: 'center',
          sortable: true, 
          format: (cargo) => Utils.obterNomeCargo(cargo, false)
        }, { 
          name: 'Votação', 
          value: 'votacao', 
          align:'right',
          sortable: true,
          format: Utils.formatInt
/*
        }, {
          name: 'Resultado',
          value: 'resultado',
          align: 'right',
          sortable: true
*/          
        }],


        candidatosEncontrados: [],
        candidatosSelecionados: [],

        procurandoCandidatos: false,
      }
    },

    computed: {

      isAdicionarDisabled () {
        return this.candidatosSelecionados.length <= 0
      }

    },

    watch: {
      show () {
        this.dialog = true
      },

      anoSelecionado () {
        this.partidos = this.obterPartidosDoAno(this.anoSelecionado)
        if (this.candidatosEncontrados.length)
            this.candidatosEncontrados = []
      },

      cargoSelecionado () {
        if (this.candidatosEncontrados.length)
            this.candidatosEncontrados = []
      },

      partidoSelecionado () {
        if (this.candidatosEncontrados.length)
            this.candidatosEncontrados = []
      },

      filtroSelecionado () {
        if (this.candidatosEncontrados.length)
            this.candidatosEncontrados = []
      },

      nomeSelecionado () {
        if (this.candidatosEncontrados.length)
            this.candidatosEncontrados = []
      }
    },

    mounted () {
      api.getParties()
      .then((response) => {
        this.todosPartidos = response.data
        this.partidos = this.obterPartidosDoAno()
      })  
      .catch((error) => console.error(error))
    },

    methods: {
      closeDialog () {
        this.$emit('close')
      },

      onInput (e) {
        if (!e)
          this.closeDialog()
      },

      selectOnKey (e) {
          if (e.key == 'Enter') {
              e.cancelBubble = true
              e.preventDefault()
              e.stopPropagation()
              return false
          }  
      },

      obterPartidosDoAno (ano) {
        var semFiltro = function () { return true },
            filtrarPorAno = (partido) => partido.anos.indexOf(ano) >= 0,
            funcaoFiltro = this.anoSelecionado ? filtrarPorAno : semFiltro

        return this.todosPartidos
          .filter(funcaoFiltro).map((partido) => partido.sigla)
          .sort((a, b) => a > b ? 1 : -1)
      },

      procurarCandidatos () {

        let filtro = this.filtros.indexOf(this.filtroSelecionado)

        function filterCandidates (candidatos) {
          const ELEITO = 0
          const SUPLENTE = 1
          const NAO_ELEITO = 2
          const ELEITO_OU_SUPLENTE = 3

          function filterByResult (cand) {
            const resultados = {
              'ELEITO': ELEITO,
              'ELEITO POR QP': ELEITO,
              'ELEITO POR MÉDIA': ELEITO,
              'MÉDIA': ELEITO,
              'NÃO ELEITO': NAO_ELEITO,
              '2º TURNO': ELEITO,
              'SUPLENTE': SUPLENTE
            }
            let candResultado = cand.resultado.toUpperCase()
            let resultado = resultados[candResultado]
            if (resultado === null) {
              console.log('atlas-dialog-busca-avancada: Resultado não encontrado: ' + cand.resultado)
              resultado = NAO_ELEITO
            }
            if (filtro == ELEITO_OU_SUPLENTE && (resultado == ELEITO || resultado == SUPLENTE)) {
              resultado = ELEITO_OU_SUPLENTE
            }
            return resultado == filtro
          }

          let noFilterSelected = (filtro == -1)
          if (noFilterSelected) {
            return candidatos
          }
          return candidatos.filter(filterByResult)
        }

        function orderCandidatesByRelevance (candidatos, nome) {

          function sortByRelevance (a, b) {
            if (a.indexNome > b.indexNome)
              return 1;
            if (a.indexNome < b.indexNome)
              return -1;
            return sortByName(a, b);
          }

          function sortByName (a, b) {
            if (a.nome > b.nome)
              return 1;
            if (a.nome < b.nome)
              return -1;
            return 0;           
          }

          if (nome) {
            nome = nome.toUpperCase();
            candidatos.forEach((candidato) => {
              candidato.indexNome = candidato.nome.toUpperCase().indexOf(nome);
            })
            return candidatos.sort(sortByRelevance)
          } 
          else {
            candidatos.forEach((candidato) => {
              candidato.indexNome = 0
            })
            return candidatos.sort(sortByName)
          }
        }
        
        this.procurandoCandidatos = true
        axios.get('/api/candidatos', { params: {
          uf: this.uf.sigla,
          ano: this.anoSelecionado,
          cargo: this.cargoSelecionado,
          nome: this.nomeSelecionado,
          partido: this.partidoSelecionado
        }})
        .then(function (response) {
            var candidatos = response.data
            candidatos = filterCandidates(candidatos)
            candidatos.forEach((candidato) => {
              candidato.nome = Utils.capitalizeName(candidato.nome)
              candidato.displayName = candidato.nome + ' (' + candidato.partido + ')'
              candidato.nomeCargo = Utils.obterNomeCargo(candidato.cargo)
              candidato.votacaoFormatada = Utils.formatInt(candidato.votacao)
            })
            this.candidatosEncontrados = orderCandidatesByRelevance(candidatos, this.nomeSelecionado)
            this.procurandoCandidatos = false
        }.bind(this))
        .catch(function (error) {
            console.log(error)
            this.procurandoCandidatos = false
        }.bind(this))
      
      },

      adicionarCandidatosSelecionados () {
        this.$emit('add-candidates', this.candidatosSelecionados)
        //this.$emit('add-multiple-candidates', this.candidatosSelecionados)
        this.candidatosSelecionados = []
        this.closeDialog()
        setTimeout(() => this.candidatosEncontrados = [], 2000)
      }

    }

}

</script>