<template>
  <v-app id="inspire" >
    <v-navigation-drawer
      
      permanent
      clipped
      fixed
      v-model="drawer"
      width="400"
      class="light-bar pb-0"
      app
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

          <atlas-map 
            :uf="uf"
            :show-indexes="showIndexes"
            :colorScale="colorScale"
            style="z-index:0;"
            @click="onMapClick"
            @set-uf="changeUf"
          ></atlas-map>

    </v-content>

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
      snackbar: {
        text: 'Erro tentando carregar coordenadas geográficas',
        color: 'error',
        visible: false
      }
    }),

    props: {
      source: String
    },

    computed: {
      classLogo () {
        return this.modoInicial ? 'cepesp-logo-grande' : 'cepesp-logo-pequeno'
      }
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
        this.showSnackbar ('Ainda não implementado', 'warning') 
      }

    }  

  }
</script>

<style>

html { 
  overflow-y: hidden;
}

light-bar {
  color: #222;
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