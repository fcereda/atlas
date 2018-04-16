<template>
  <v-app id="atlas-eleitoral">

    <div 
        id="sidebar" 
        ref="sidebar" 
        class="sidebar" 
    >

      <div class="cepesp-logo" v-bind:class="classLogo">
        <span ref="logo-cepesp">CEPESP&nbsp;</span>
        <span ref="logo-atlas-eleitoral" style="font-weight:100">Atlas&nbsp;Eleitoral</span>
        <span v-if="!modoInicial" style="flex:1"></span>
        <span v-if="!modoInicial">
            <v-tooltip v-if="true" bottom z-index="1000" id="btnHome">
                <v-menu
                  offset-x
                  :close-on-content-click="false"
                  :nudge-width="200"
                  v-model="popupConfirmHome"
                  slot="activator"
                >
                  <v-btn flat icon class="button-logo-pequeno" slot="activator">
                    <v-icon>home</v-icon>
                  </v-btn>
                  <v-card>
                    <v-list>
                      <v-list-tile>
                        Deseja voltar à tela inicial?<br>Sua lista de candidatos e eventuais anotações serão apagadas.
                        </v-list-tile>
                    </v-list>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn flat color="primary" @click="popupConfirmHome=false">Cancelar</v-btn>
                      <v-btn flat color="error" @click="popupConfirmHome=false || goHome()">Sim, voltar à tela inicial</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
                <span>Voltar à tela inicial</span>
            </v-tooltip>    
            <v-tooltip v-if="false" bottom open-delay="200">
              <v-btn flat icon class="button-logo-pequeno" slot="activator" @click="goHome" id="btnGoHome">
                <v-icon>home</v-icon>
              </v-btn>
              <span>Voltar à tela inicial</span>
            </v-tooltip>  
            <v-tooltip bottom open-delay="200" z-index="10000" id="btnSalvar">
              <v-btn flat icon class="button-logo-pequeno" slot="activator" @click="saveState">
                <v-icon>save</v-icon>
              </v-btn>
              <span>Salvar o mapa atual</span>
            </v-tooltip>  
            <v-tooltip bottom open-delay="200" z-index="10000" id="btnHelp">
              <v-btn flat icon class="button-logo-pequeno" slot="activator" @click="runTutorial">
                <v-icon>help</v-icon>
              </v-btn>
              <span>Obter ajuda sobre as opções disponíveis</span>
            </v-tooltip>             
        </span>    
      </div>

      <div v-if="modoInicial">
        <atlas-select-uf
          :uf="uf"
          @input="changeUf"
        ></atlas-select-uf>
      </div>            

      <div v-if="!modoInicial">
        <atlas-display-uf
          :uf="uf"
          @set-color-scale="setColorScale"
        ></atlas-display-uf> 
      </div>  

      <atlas-sidebar-tabs
        ref="sidebarTabs"
        v-if="!modoInicial"
        :uf="uf"
        :colorScale="colorScale"
        :mostrarPainelZonas="mostrarPainelZonas"
        :zonasToDisplay="zonasHover"
        :originalCandidates="originalCandidates"
        @add-candidate="addCandidate"
        @remove-candidate="removeCandidate"
        @show-indexes="showIndividualIndexes"
        @close-painel-zonas="mostrarPainelZonas = false">
      </atlas-sidebar-tabs>

    </div>

    <div id="main" ref="main">
    <v-content>

          <atlas-map
            ref="map" 
            :uf="uf"
            :show-indexes="showIndexes"
            :colorScale="colorScale"
            :showSidebarOpen="true"
            :sidebarOpen="drawer"
            style="z-index:0;"
            @click="onMapClick"
            @set-uf="changeUf"
            @input="toggleSidebar"
          ></atlas-map>

    </v-content>
    </div>

    <v-layout row justify-center>
      <v-dialog v-model="dialogSave" persistent max-width="480">
        <v-card>
          <v-card-title class="headline">Mapa atual salvo</v-card-title>
          <v-card-text>Para voltar a este mapa mais tarde, vá para o seguinte endereço:
          <div id="location" class="title pt-4">{{ currentLocation }}</div>
          </v-card-text>
          <v-card-actions>
            <v-btn 
              flat
              color="red darken-2" 
              id="btnCopy"
              @click.native="copyLocation"
              ><span slot="loader"><v-icon flat>cached</v-icon></span>Copiar endereço
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="indigo darken-1" flat @click.native="dialogSave = false">Continuar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>    

    <v-snackbar
      :timeout="5000"
      :color="snackbar.color"
      v-model="snackbar.visible"
      style="z-index:10000;"
    >
      {{ snackbar.text }}
      <v-btn dark flat @click.native="snackbar.visible = false">Fechar</v-btn>
    </v-snackbar>
  </v-app>
</template>




<script>

import Store from './lib/store.js'
import api from './lib/api.js'
import utils from './lib/utils.js'
import Candidato from './classes/candidato.js'
import atlasCandidatesList from './components/atlas-candidates-list.vue'
import atlasMap from './components/atlas-map.vue'
import atlasSelectUf from './components/atlas-select-uf.vue'
import atlasDisplayUf from './components/atlas-display-uf.vue'
import atlasPainelZonas from './components/atlas-painel-zonas.vue'
import atlasSidebarTabs from './components/atlas-sidebar-tabs.vue'

export default {

    components: {
        'atlas-candidates-list': atlasCandidatesList,
        'atlas-map': atlasMap,
        'atlas-select-uf': atlasSelectUf,
        'atlas-display-uf': atlasDisplayUf,
        'atlas-painel-zonas': atlasPainelZonas,
        'atlas-sidebar-tabs': atlasSidebarTabs,
    },

    data: () => ({
        drawer: true,
        modoInicial: true,
        uf: '',
        originalCandidates: null,
        colorScale: {
            type: 'categorical',
            baseColor: 'usable'
        },
        candidates: [],
        showIndexes: false,
        highlightedCandidate: null,
        zonasHover: [],
        mostrarPainelZonas: false,
        dialogSave: false,
        popupConfirmHome: false,
        snackbar: {
            text: 'Erro tentando carregar coordenadas geográficas',
            color: 'error',
            visible: false
        },
        currentLocation: window.location.href,
        intro: null,
    }),

    props: {
        source: String
    },

    computed: {
        classLogo () {
          return this.modoInicial ? 'cepesp-logo-grande' : 'cepesp-logo-pequeno'
        }
    },

    mounted () {
        this.$refs['logo-cepesp'].addEventListener('click', this.onClickLogo)
        this.$refs['logo-atlas-eleitoral'].addEventListener('click', this.onClickLogo)
        setTimeout(this.loadAppState.bind(this), 500)        
    },

    methods: {
        
        goHome () {
            Store.removerTodosCandidatos()
            this.showIndividualIndexes(null)
            this.modoInicial = true
            this.uf = ''
            this.mostrarPainelZonas = false
        },

        changeUf (uf) {
            api.getCitiesAndLocations(uf.sigla.toLowerCase())
            .then((data) => {
                Store.coordenadas = data.coords
                Store.municipios = data.municipios
            })
            .catch((error) => {
                this.snackbar.visible = true
            })
            this.uf = uf
            this.modoInicial = false
        },

        openCloseDrawer (drawerOpen) {
            this.drawer = drawerOpen
        },

        addCandidate (candidate) {
            Store.adicionarCandidato(candidate)
        },

        removeCandidate (candidate) {
            if (this.individualIndexes == candidate) {
                this.individualIndexes = null
            }
            Store.removerCandidato(candidate)  
        },

        showIndividualIndexes (candidate) {
            this.showIndexes = candidate
        },

        setColorScale (colorScale) {
            this.colorScale = colorScale
        },

        onMapClick (zonas) {
            if (this.modoInicial) {
                return
            }
            if (!zonas || !zonas.length) {
                zonas = []
                this.mostrarPainelZonas = false
            }
            else {
                if (this.$refs.sidebarTabs.activeTab == 'candidatos') {
                    this.$refs.sidebarTabs.showTabDetalhes()
                    this.mostrarPainelZonas = true
                }  
            }
            this.zonasHover = zonas
        },

        toggleSidebar () {
            this.drawer = !this.drawer
            if (!this.drawer) {
                this.$refs.sidebar.style.left = "-400px"
                this.$refs.main.style.left = "0px"
            }
            else {
                this.$refs.sidebar.style.left = ""
                this.$refs.main.style.left = ""
            }
        },

        showSnackbar (text, color) {
            this.snackbar.text = text
            this.snackbar.color = color
            this.snackbar.visible = true
        },

        loadAppState () {
            var that = this
            var appStateId = window.location.pathname
            if (appStateId == '/') {
                appStateId = window.location.hash
            }
            if (!appStateId) {
                return
            }
            appStateId = appStateId.substr(1, 100)

            api.getAppState(appStateId)
            .then(response => {
                var appState = response.data
                if (appState.uf) {
                    let uf = utils.obterUfPorSigla(appState.uf)
                    if (!uf) {
                      throw Error('Error loading appState: invalid uf')
                    }
                    this.changeUf(uf)
                    this.$refs.map.setMapState(appState)
                    if (!appState.candidatos || !appState.candidatos.length) {
                        return
                    }
                    let candidateIds = appState.candidatos.map(candidato => candidato.id)
                    api.getCandidatesFromIds(candidateIds)
                    .then(response => {
                        let originalCandidates = response.data
                        originalCandidates.forEach(candidate => {
                            let appStateCandidate = appState.candidatos.find(({id}) => id == candidate.id)
                            candidate.color = appStateCandidate.color
                            candidate.disabled = appStateCandidate.disabled
                            if (appStateCandidate.showIndex || candidate.id == appState.showIndex) {
                                candidate.showIndex = true
                            }
                        })
                        that.originalCandidates = originalCandidates
                    })
                    .catch(err => {
                        console.error(err)
                        that.showSnackbar('Erro tentando carregar a lista de candidatos')
                    })     
                }
            })
            .catch(err => {
                console.error(err)
            })
        },

        saveState () {
            var getCandidateId = (candidate) => {
                var id = Candidato.calcularId(candidate)
                if (id.charAt(2) != '-') {
                  id = this.uf.sigla + '-' + id
                }
                return id
            }
            var mapState = this.$refs.map.getMapState()
            var showIndexCandidateId = this.showIndexes ? getCandidateId(this.showIndexes) : 0
            var appState = {
                uf: this.uf.sigla,
                candidatos: Store.candidatos.map(candidato => {
                    var id = getCandidateId(candidato)
                    return {
                        id,
                        color: candidato.color,
                        disabled: candidato.disabled ? 1 : 0,
                        showIndex: showIndexCandidateId == id ? 1 : 0,
                    }  
                }),
                showIndex: showIndexCandidateId,
                ...mapState
            }

            api.saveAppState(appState)
            .then(data => {
                var id = data.id
                //window.location.hash = id   // DEPRECATED
                // Changes the url without reloading the page
                history.pushState(appState, "CEPESP Atlas Eleitoral", id);  

                this.currentLocation = window.location.href
                // Show the dialog that contains info for user to retrieve the saved map
                this.dialogSave = true
            })
            .catch(err => {
                console.error(err)
                this.showSnackbar ('Erro tentando salvar a visualização atual', 'danger') 
            })
        },

        copyLocation: function () {

            function copyToClipboard(str) {

                function listener(e) { 
                    e.clipboardData.setData("text/plain", str)
                    e.preventDefault() 
                }

                document.addEventListener("copy", listener);
                document.execCommand("copy");
                document.removeEventListener("copy", listener);
            }

            var location = window.location.href
            copyToClipboard(location)  
        },

        onClickLogo () {
            window.open('http://www.github.com/fcereda/atlas')
        },

        runTutorial () {
            const getEl = (id) => document.getElementById(id) 
            const intro = introJs()
            const modoIndicesIndividuais = !!this.showIndexes
            let startingSteps = [{
                element: getEl('selectCandidatos'),
                intro: 'Para adicionar candidatos à lista, basta digitar parte do nome no campo de busca.'
            }, {
                element: getEl('btnBuscaAvancada'),
                intro: 'Para adicionar vários candidatos, ou procurar candidatos por cargo, partido ou eleição, clique aqui.'
            }, {
                element: getEl('atlasCandidates'),
                intro: 'Os candidatos escolhidos aparecem aqui.'
            }]
            let leafletControlZoom = document.getElementsByClassName('leaflet-control-zoom')[0]
            let leafletControlFitBorder = document.getElementsByClassName('leaflet-control-custom')[1]
            let closingSteps = [{
                element: leafletControlZoom,
                intro: 'Você pode ampliar ou reduzir o mapa clicando aqui ou usando a roda do mouse. Você também pode movimentar o mapa, bastando clicá-lo e arrastá-lo.',
                position: 'right'
            }, {
                element: leafletControlFitBorder,
                intro: 'Mova, amplie e reduza o mapa à vontade. Para voltar a ver o estado inteiro, clique neste botão.',
                position: 'right'
            }, {
                element: getEl('whiteboard-control'),
                intro: 'Você também pode desenhar à mão livre e fazer anotações no mapa. Clique aqui para abrir os controles de desenho. Quando terminar de desenhar, clique neste mesmo botão novamente.',
                position: 'right'
            }, {    
                element: getEl('btnSalvar'), 
                intro: 'Para salvar o mapa atual, clique aqui. Você poderá voltar a ele mais tarde e poderá compartilhá-lo com outras pessoas',
                position: 'right'
            }, {
                element: getEl('btnHome'),
                intro: 'Para mudar de estado, clique aqui.',
                position: 'right'
            }]

            intro.addSteps(startingSteps)
            if (Store.candidatos.length) {
                if (modoIndicesIndividuais) {
                    let btnCompararCandidatos = null
                    let btnTrajetoriaEleitoral = null
                    let index = Store.candidatos.indexOf(this.showIndexes)
                    if (index >= 0) {
                        let listaBtnCompararCandidatos = document.getElementsByClassName('btn-comparar-candidatos')
                        let listaBtnTrajetoriaEleitoral = document.getElementsByClassName('btn-trajetoria-eleitoral')
                        btnCompararCandidatos = listaBtnCompararCandidatos[index]
                        btnTrajetoriaEleitoral = listaBtnTrajetoriaEleitoral[index]
                    }
                    intro.addSteps([{    
                        element: getEl('controlIndexTypes'),
                        intro: 'Clique aqui para ver diferentes índices para analisar o desempenho do candidato selecionado.',
                        position: 'left'
                    }, {
                        element: getEl('mapLegend'),
                        intro: 'Se quiser saber mais sobre um índice, clique no no botão de Ajuda nesta legenda.',
                        position: 'top-left'
                    }, {
                        element: btnTrajetoriaEleitoral,
                        intro: 'Clique aqui para ver a trajetória eleitoral deste candidato desde 1998.',
                        position: 'right'
                    }, {
                        element: btnCompararCandidatos,
                        intro: 'Para comparar os desempenhos dos candidatos selecionados, clique aqui.',
                        position: 'right'
                    }])
                }
                else {
                    let headerFirstCandidate = document.getElementsByClassName('candidate-detail-header')[0]
                    intro.addSteps([{
                        element: getEl('controlChartTypes'),
                        intro: 'Aqui você seleciona diversas visualizações que comparam, no mapa, o desempenho dos candidatos selecionados',
                        position: 'left' 
                    }, {
                        element: headerFirstCandidate,
                        intro: 'Se você quiser analisar o desempenho individual de um dos candidatos, clique no seu nome. Seu painel de análise individual será aberto.',
                        position: 'right'
                    }])
                }    
                intro.addSteps(closingSteps)
            }
            else {
                intro.addSteps([{
                    element: getEl('btnHelp'),
                    intro: 'Escolha pelo menos um candidato, e clique aqui novamente para mais informações',
                    position: 'right'
                }])
            }
            intro.setOptions({
                'showStepNumbers': false,
                'doneLabel': 'Terminar',
                'skipLabel': 'Sair',
                'prevLabel': ' ◄  Anterior ',
                'nextLabel': ' Próximo  ► ',
                scrollPadding: 0,
                disableInteraction: true
            })    
            intro.start()
        }

    }  

}

</script>

<style>

html { 
  overflow-y: hidden;
}

/* The sidebar */
#sidebar {
    width: 400px; 
    position: absolute; 
    z-index: 1; 
    top: 0;
    left: 0px;
    bottom: 0px; 
    background-color: #fff; 
    overflow-x: hidden; 
    transition: 0.4s; 
}

/* The map pane */
#main {
    transition: left 0.4s;
    overflow:hidden;
    position:absolute;
    left:400px; 
    top:0;
    bottom:0;
    right:0;
    background-color:orange;
}


.cepesp-logo {
    transition: all 0.4s ease;  
    font-weight:700;
    padding:16px;
    color:#eee;
    color:#222;
    color:#1a237e;
    display:flex;
    cursor:pointer;
}

.cepesp-logo-grande {
    font-size:48px;
    line-height:1.0;
    padding-top:180px;
    flex-direction:column;
}

.cepesp-logo-pequeno {
    font-size:22px;
    padding-top:12px;
    padding-bottom:10px;
}

.button-logo-pequeno {
    margin:0;
    margin-top:-4px;
    color:#222;
}

</style>