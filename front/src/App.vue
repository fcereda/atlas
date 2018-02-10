<template>
  <v-app id="atlas-eleitoral">

    <v-navigation-drawer
      fixed
      permanent
      stateless
      disable-resize-watcher
      floating
      hide-overlay
      app
      width="400"
      class="pb-0"
    >
      <div class="cepesp-logo" v-bind:class="classLogo">
        <span>CEPESP&nbsp;</span>
        <span style="font-weight:100">Atlas&nbsp;Eleitoral</span>
        <span v-if="!modoInicial" style="flex:1"></span>
        <span v-if="!modoInicial">
            <v-tooltip bottom open-delay="200" >
              <v-btn flat icon _color="blue-grey lighten-4" class="button-logo-pequeno" slot="activator" @click="goHome">
                <v-icon>home</v-icon>
              </v-btn>
              <span>Voltar à tela inicial</span>
            </v-tooltip>  
            <v-tooltip bottom open-delay="200" z-index="10000">
              <v-btn flat icon _color="blue-grey lighten-4" class="button-logo-pequeno" slot="activator" @click="saveState">
                <v-icon>save</v-icon>
              </v-btn>
              <span>Salvar o mapa atual</span>
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
        @add-candidate="addCandidate"
        @remove-candidate="removeCandidate"
        @show-indexes="showIndividualIndexes"
        @close-painel-zonas="mostrarPainelZonas = false">
      </atlas-sidebar-tabs>


    </v-navigation-drawer>

    <v-content>

<!--
          <div style="position:absolute;left:10px;top:200px;width:50px;height:50px;border:1px solid black;background-color:yellow;z-index:20000">{{ drawer }}</div>
-->
          <atlas-map
            ref="map" 
            :uf="uf"
            :show-indexes="showIndexes"
            :colorScale="colorScale"
            :showSidebarOpen="false"
            :sidebarOpen="drawer"
            style="z-index:0;"
            @click="onMapClick"
            @set-uf="changeUf"
            @input="drawer = !drawer"
          ></atlas-map>

    </v-content>

    <v-layout row justify-center>
      <v-dialog v-model="dialogSave" persistent max-width="480">
        <v-btn color="primary" dark slot="activator">Open Dialog</v-btn>
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
  import atlasMap from './components/atlas-map-leaflet-canvas.vue'
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
      snackbar: {
        text: 'Erro tentando carregar coordenadas geográficas',
        color: 'error',
        visible: false
      },
      currentLocation: window.location.href
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

      function loadAppState () {
        var appStateId = window.location.hash
        if (appStateId) {
          appStateId = appStateId.substr(1, 100)
          appStateId = appStateId.replace('/', '')
        }
        console.error(appStateId)
        api.getAppState(appStateId)
        .then(response => {
          var appState = response.data
          console.log(appState)        
          if (appState.uf) {
            debugger
            let uf = utils.obterUfPorSigla(appState.uf)
            if (!uf) {
              throw Error('Error loading appState: invalid uf')
            }
            this.changeUf(uf)
          }
        })
        .catch(err => {
          console.error(err)
        })
      }
      
      setTimeout(loadAppState.bind(this), 100)  
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
        if (this.individualIndexes == candidate)
          this.individualIndexes = null
        Store.removerCandidato(candidate)  
      },

      showIndividualIndexes (candidate) {
        this.showIndexes = candidate
      },

      setColorScale (colorScale) {
        this.colorScale = colorScale
      },

      onMapClick (zonas) {
        if (this.modoInicial)
          return

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

      showSnackbar (text, color) {
        this.snackbar.text = text
        this.snackbar.color = color
        this.snackbar.visible = true
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
        console.log('appState')
        console.log(appState)

        api.saveAppState(appState)
        .then(data => {
          var id = data.id
          this.showSnackbar('Visualização salva com o id ' + id, 'primary')
          window.location.hash = id
          this.currentLocation = window.location.href
          this.dialogSave = true
          new Clipboard('#btnCopy')
        })
        .catch(err => {
          console.error(err)
          this.showSnackbar ('Erro tentando salvar a visualização atual', 'danger') 
        })
        
      },

      copyLocation: function () {

        function copyToClipboard(str) {
          function listener(e) { e.clipboardData.setData("text/plain", str);
                                 e.preventDefault(); }
          document.addEventListener("copy", listener);
          document.execCommand("copy");
          document.removeEventListener("copy", listener);
        };

        var location = window.location.href
        copyToClipboard(location)  

      }

    }  

  }
</script>

<style>

html { 
  overflow-y: hidden;
}

.cepesp-logo {
    transition: all 0.4s ease;  
    font-weight:700;
    padding:16px;
    color:#eee;
    color:#222;
    color:#1a237e;
    display:flex;
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
}

.button-logo-pequeno {
    margin:0;
    margin-top:-4px;
    color:#222;
}

.atlas-toolbar {
  border-bottom: 1px solid #ddd !important;
}

.ufselect {
  position: fixed;
  top: 80px;
  right: 20px;
  //height: 60px;
  padding-bottom:-5px;
  width: 380px;
  z-index:2000;
  background-color: white;
  border: 1px solid #888;
}

</style>