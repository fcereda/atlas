<template>

    <v-container fluid fill-height pa-0>

		<div id="map" ref="map" v-bind:style="mapStyle">
		</div>

		<div class="map-controls" v-show="displayChartTypes" v-if="0">
			<div v-for="chart in chartTypes" @click="changeChartType(chart.name)" v-bind:class="chartType==chart.name?'selected-chart':''"><i class="material-icons">{{ chart.icon }}</i></div>
    	</div>	

		<div class="map-controls map-control-chart-type" v-show="displayChartTypes">
			<div 
				v-for="chart in chartTypes" 
				v-show="!mostrarIndicesIndividuais" 
				@click="changeChartType(chart.name)" 
				v-bind:class="chartType==chart.name?'selected-chart':''"
			>
				<v-icon 
					v-if="chart.icon" 
					class="pa-1" 
					:color="chartType==chart.name?'blue darken-2':'grey darken-2'"
					:style="chart.transform? 'transform:' + chart.transform + ';' : '' "
				>
				{{ chart.icon }}
				</v-icon>
			</div>
			<div 
				v-for="chart in indexChartTypes"
				v-show="mostrarIndicesIndividuais"
				@click="changeIndexChartType(chart)"
				v-bind:class="indexChartType==chart.name?'selected-chart':''"
			><div class="char-icon">{{ chart.label }}</div>
			</div>	

    	</div>	

    	<div class="map-controls map-control-radius-type" v-show="displayChartTypes">
    		<div 
    			v-for="radius in radiusTypes"
    			@click="changeRadiusType(radius.name)"
    			v-bind:class="radiusType == radius.name?'selected-chart':''"
    		>
    			<v-icon class="pa-1" :color="radiusType==radius.name?'blue darken-2':'grey darken-2'">{{ radius.icon }}</v-icon>
    		</div>	

    	</div>

<!--
            <div class="map-control-radius-type" style="position:absolute; right:100px; top:20px; z-index:1000;">
	            <v-btn-toggle v-model="radiusType" mandatory>
	              	<v-tooltip bottom v-for="rtype in radiusTypes">
		            	<v-btn flat slot="activator" @click="display(radiusType)" :value="rtype.nome" :depressed="true">
		            		<v-icon>{{ rtype.icon }}</v-icon>
		            	</v-btn>	
		            	<span>{{ rtype.tooltip }}</span>
	            	</v-tooltip>    
	            </v-btn-toggle>
	        </div>    
-->

		<!-- Para habilitar as camadas de dados, remova a diretiva  v-if="false" abaixo -->
		<div class="map-controls map-control-data-layers" v-if="false" v-show="displayChartTypes" slot="activator">
			<div 
				v-for="layer in showDataLayers" 
				v-show="true" 
				@click="showMenu" 
				v-bind:class="chartType==layer.name?'selected-chart':''"
			>
				<v-icon 
					class="pa-1" 
					:color="chartType==layer.name?'blue lighten-2':'grey lighten-2'"
					:style="layer.transform? 'transform:' + layer.transform + ';' : '' "
				>
				{{ layer.icon }}
				</v-icon>
			</div>
		</div>	


		<v-menu 
			offset-y 
			v-model="showLayersMenu" 
			absolute 
			:position-x="layersMenuPositionX" 
			:position-y="layersMenuPositionY" 
			left
			full-width
			z-index="10000"
		>
		    <v-list dense>
		    	<v-subheader>CAMADAS DE DADOS</v-subheader>
		    	<template v-for="item in dataLayers">
			        <v-list-tile v-if="item.name" @click="showDataLayer(item)">
			        	<i class="material-icons" :style="item.selected ? 'color:#aaa;' : 'color:transparent;'">done</i>&nbsp;
			        	<v-list-tile-title @click="showLayersMenu = false" >
			        		<span>{{ item.name }}</span></v-list-tile-title>
			        </v-list-tile>	
			        <v-divider v-if="!item.name"></v-divider>
		        </template>
		    </v-list>
	    </v-menu>		

<!--
    	<div class="map-controls" style="position:relative;left:12px;top:12px;width:1px">
    		<div @click="zoomIn">
    			<v-icon class="pa-1" color="grey lighten-2">zoom_in</v-icon>
			</div>
    		<div @click="zoomOut">
    			<v-icon class="pa-1" color="grey lighten-2">zoom_out</v-icon>
			</div>
    		<div @click="zoomFitBoundaries">
    			<v-icon class="pa-1 pt-4" color="grey lighten-2">zoom_out_map</v-icon>
			</div>
		</div>	
-->

		<atlas-map-legend
			v-show="mapLegend.show"
			:title="mapLegend.title"
			:text="mapLegend.text"
			:palette="mapLegend.palette"
			:domain="mapLegend.domain"
			:padding="mapLegend.padding"
			:labels="mapLegend.labels"
		>
		</atlas-map-legend>

	</v-container>

</template>

<script>

import api from '../lib/api.js'
import utils from '../lib/utils.js'
import Store from '../lib/store.js'
import Charts from '../lib/charts.js'
//import DataLayers from '../lib/datalayers.js'
import axios from 'axios'
import chroma from 'chroma-js'

import atlasSearchMunicipalities from './atlas-search-municipalities.vue'
import atlasMapLegend from './atlas-map-legend.vue'

// statesBordersLayer data is not included in the component's data object
//  because we don't want it to be reactive 
var statesBordersLayer = null	


export default {

	components: {
		atlasSearchMunicipalities,
		atlasMapLegend
	},

	props: [ 'uf', 'showIndexes'],

	data () {

		return {

			map: null,
			mapHeight: this.calcMapHeight(),
			mouseOverChart: false,
			zonasSobMouse: [],
			geolocations: {  
				'AC': [ -9.128703100254375, -70.30709995790936 ],
				'AL': [ -9.657146073170642, -36.69477007781069 ],
				'AM': [ -3.785717917053299, -64.94955330629251 ],
				'BA': [ -13.440031328649784, -41.97912114309919 ],
				'CE': [ -5.321037629304138, -39.33830024807976 ],
				'DF': [ -15.775279397679293, -47.79695108233966 ],
				'ES': [ -19.596880738240493, -35.360203667121496 ],
				'GO': [ -15.94745743065292, -49.5788865686291 ],
				'MA': [ -5.6533656843464115, -45.2755189166553 ],
				'MT': [ -12.695298049830297, -55.929111671721685 ],
				'MS': [ -20.6176890317848, -54.54571057465736 ],
				'MG': [ -18.578043154745465, -45.45146376682702 ],
				'PR': [ -24.616884105147843, -51.77142467732972 ],
				'PB': [ -7.164432004604677, -36.77923173371886 ],
				'PA': [ -3.625075780066272, -52.479639846559735 ],
				'PE': [ -6.655754668123226, -36.87466595438816 ],
				'PI': [ -6.834035635650308, -43.18240059064856 ],
				'RJ': [ -22.066082870079953, -42.923913154537175 ],
				'RN': [ -5.907138505147245, -36.7753258619006 ], 
				'RS': [ -30.417191091665078, -53.66761188894853 ],
				'RO': [ -10.831494142732305, -63.29228963607496 ],
				'RR': [ 1.8455958047433434, -61.856057671642255 ],
				'SC': [ -27.65484096200064, -51.095990399264196 ],
				'SE': [ -10.541799765488728, -37.31946121850123 ],
				'SP': [ -22.546116618914496, -48.63612651362837 ],
				'TO': [ -9.318047360830361, -48.21937224834929 ]
			},

			stateBoundaries: {"AC":[[-7.066020,-74.057653],[-11.413279,-66.444127]],"AL":[[-10.50117582170068,-38.237589446023804],[-8.813116324640603,-35.151950709597564]],"AM":[[-9.818061377887272,-73.80156832950942],[2.2466255437806737,-56.09753828307561]],"AP":[[-1.236184960729986,-54.87624215511599],[4.436728303888998,-49.87668107315433]],"BA":[[-18.347255447192623,-46.61710686569986],[-8.532807210106945,-37.34113542049852]],"CE":[[-7.857575606490638,-41.423290748337514],[-2.7844996521176384,-37.253309747822016]],"DF":[[-16.050296450045842,-48.285523719028504],[-15.500262345312745,-47.308378445650824]],"ES":[[-21.301798586613188,-41.879623009555395],[-17.8919628898678,-38.84078432468759]],"GO":[[-19.4991647389655,-53.25081246908195],[-12.395750122340338,-45.906960668176254]],"MA":[[-10.26176381868467,-48.75513142896972],[-1.0449675500081526,-41.795906404340876]],"MG":[[-22.922736870113766,-51.046094580082936],[-14.233349439377164,-39.85683295357111]],"MS":[[-24.068597447874012,-58.16850828391636],[-17.166780615695586,-50.92291286539836]],"MT":[[-18.041580757767292,-61.63340040070763],[-7.349015341893303,-50.22482294273574]],"PA":[[-9.841163563019379,-58.8983418815875],[2.591012002886835,-46.06093781153198]],"PB":[[-8.302956077627027,-38.76558203759521],[-6.025907931582328,-34.79288142984251]],"PE":[[-7.033393,-42.194031],[-9.371123,-32.599109]],"PI":[[-10.928761366451525,-45.99428964039032],[-2.7393099048490903,-40.370511540906804]],"PR":[[-26.717114682216902,-54.61931255227314],[-22.516653528078784,-48.0235368023863]],"RJ":[[-23.368936844438963,-44.88931172981614],[-20.76322889572094,-40.9585145792582]],"RN":[[-6.982736440457561,-38.582118948605675],[-4.831540569836928,-34.96853277519552]],"RO":[[-13.693687077566501,-66.81023839317209],[-7.969301207898109,-59.77434087897784]],"RR":[[-1.5806494677588887,-64.82524272692058],[5.2718410772455755,-58.88687261636393]],"RS":[[-33.75208127059592,-57.64376682264455],[-27.082300912734233,-49.69145695525251]],"SC":[[-29.35384668022551,-53.836873860171096],[-25.955835243775773,-48.355106938357295]],"SE":[[-11.568559213142233,-38.24503995296037],[-9.515040317835222,-36.393882484042095]],"SP":[[-25.312330120754744,-53.110110774449566],[-19.779903117074248,-44.16214225280717]],"TO":[[-13.46769931726239,-50.7420687424835],[-5.168395404398332,-45.69667575421508]]},

			brazilBoundaries: [],

			topoLayer: null,

			chartCanvas: null,
			displayChartTypes: false,
			chartTypes: [{
				name: 'winner',
				icon: 'fiber_manual_record'
			}, {
				name: 'pie',
				icon: 'pie_chart'
			}, {
				name: 'donut',
				icon: 'donut_large'
			}, {	
				name: 'bar',
				icon: 'equalizer'
			}, {
				name: 'pill',
				icon: 'chrome_reader_mode'
			},{		
				name: 'hbar',
				icon: 'format_align_left'
			}, {
				name: 'empty',
				icon: 'not_interested'
			}],
			chartType: 'winner',

			indexChartTypes: [{
				name: 'indiceLQ',
				label: 'LQ',
				palette: ['#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#abd9e9','#74add1','#4575b4','#313695'],
				domain: [0, 0.1, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0],
				legendTitle: 'Quociente de locação',
				legendLabels: ['Até 0,1', '0,1 \u2014 0,25', '0,25 \u2014 0,5', '0,5 \u2014 1,0', '1,0 \u2014 2.0', '2.0 \u2014 4.0', '4.0 \u2014 8.0', '8,0 ou mais', '16.0 ou mais']
			}, {
				name: 'indicePareto',
				label: 'IP',
				palette: ['#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],
				domain: [1, 0.8, 0.6, 0.4, 0.2],
				legendTitle: 'Índice de importância',
				legendPalette: ['#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'].reverse(),
				legendDomain: [0.2, 0.4, 0.6, 0.8, 1.0],
				legendLabels: ['20% mais importantes', '20% \u2014 40%', '40% \u2014 60%', '60% \u2014 80%', '80% \u2014 100%'],
			}],
			indexChartType: 'indicePareto',	

			radiusTypes: [{
				name: 'variable',
				icon: 'bubble_chart',
				tooltip: 'Mostra gráficos proporcionais ao eleitorado de cada zona'
			}, {
				name: 'fixed',
				icon: 'fiber_smart_record',
				tooltip: 'Mostra gráficos de tamanho uniforme'
			}],
			radiusType: 'variable',

			showDataLayers: [{
				name: 'on',
				icon: 'layers'
			}],
			// dataLayers are not currently in use
			dataLayers: [{
				name: 'Renda per capita 2010',
				id: 'pibPerCapita2010',
				chromaScale: ['#fff', '#000'],
				chromaDomain: [ 5000, 50000],
				legend: ['Até R$ 5 mil', 'De R$ 5 mil até R$ 25 mil', 'De R$ 25 mil até R$ 50 mil', 'Mais de R$ 50 mil']
			}, {
				name: 'Renda per capita 2014',
				id: 'pibPerCapita2014',
				chromaScale: ['#fff', '#000'],
				chromaDomain: [ 5000, 50000],
				legend: ['Até R$ 5 mil', 'De R$ 5 mil até R$ 25 mil', 'De R$ 25 mil até R$ 50 mil', 'Mais de R$ 50 mil']
			}, {
				name: 'Índice Gini 2000',
				id: 'gini2000',
				chromaScale: ['#252525', '#f7f7f7'],
				chromaDomain: [0.3, 0.7],
				legend: ['Até 0,3', 'De 0,3 a 0,4', 'De 0,4 a 0,5', 'De 0,5 a 0,6', 'De 0,6 a 0,7', '0,7 ou mais']
			}, {
				name: 'Indice Gini 2010',
				id: 'gini2010',
				chromaScale: ['#ccece6', '#005824'],
				chromaDomain: [0.3, 0.7],
				legend: ['Até 0,3', 'De 0,3 a 0,4', 'De 0,4 a 0,5', 'De 0,5 a 0,6', 'De 0,6 a 0,7', '0,7 ou mais']
			}, {
				name: ''
			}, {
				name: 'Mostrar apenas municípios',
				id: 'map',
				chromaScale: ['white', 'black'],
				chromaDomain: [0, 1],
				legend: null
			}, {
				name: 'Esconder camada de dados',
				id: 'nolayer'
			}],
			showLayersMenu: false,
			layersMenuPositionX: 300,
			layersMenuPositionY: 400,

			mostrarIndicesIndividuais: false,

			mapLegend: {
				show: false,
				title: '',
				palette: null,
				domain: null,
				padding: null,
				labels: []
			}	

		}

	},

	computed: {

		mapStyle () {
			return 'width:100%;height:' + this.mapHeight + 'px;' + (this.mouseOverChart ? 'cursor:pointer;' : '')
		},

	},

	watch: {

		uf () {
			if (this.uf) {
				this.highlightStateBorder(this.uf)
				this.flyToState(this.uf.sigla)
				//this.loadIbgeData(this.uf)
			}
			else {
				Charts.removeCharts()
				this.fitBoundsToBrazil()
				this.loadStatesBorders()
			}
		},

		showIndexes () {
			if (this.showIndexes) {
				var indexObj = this.indexChartTypes[0]
				for (var i=1; i<this.indexChartTypes.length; i++) {
					if (this.indexChartTypes[i].name == this.indexChartType)
						indexObj = this.indexChartTypes[i]
				}
				var chromaColor = chroma.scale(indexObj.palette).domain(indexObj.domain)
				Charts.setChartType('index', this.radiusType, this.showIndexes, this.indexChartType, chromaColor)
				this.setMapLegendFromIndex(indexObj)
				this.mostrarIndicesIndividuais = true
			}
			else {
				Charts.setChartType(this.chartType)
				this.setMapLegendFromIndex(null)
				this.mostrarIndicesIndividuais = false
			}
    		Charts.redrawCharts()			
		}

 	},


	mounted () {

		window.addEventListener('resize', () => {
			this.map.invalidateSize()
			this.mapHeight = this.calcMapHeight()
			Charts.redrawCharts()
		})

		// Events for viewing district data on the side panel
		// Event listeneres will be added below

		var that = this
		var onHover = function (e) {
			// This function is an called by the Leaflet element,
			// thus the event object is a different from the regular one
			var posicoesCharts = Charts.posicoesCharts,
				chartsEncontrados = []
		    for (let i = posicoesCharts.length - 1; i >= 0; i--) {
				let thisPosicao = posicoesCharts[i].bounds,
		    		x = e.containerPoint.x, //e.offsetX, 
		    		y = e.containerPoint.y  //e.offsetY 
				if (thisPosicao[0][0] <= x &&
		    		thisPosicao[0][1] <= y &&
		    		thisPosicao[1][0] >= x &&
		    		thisPosicao[1][1] >= y) {
		  			chartsEncontrados.push(posicoesCharts[i].id)
	        	}
	    	}
	    	that.zonasSobMouse = chartsEncontrados
	    	if (chartsEncontrados.length) {
	    		that.mouseOverChart = true
	    	}
	    	else {
	    		that.mouseOverChart = false
	    	}	
		}
		//this.$refs.map.addEventListener('mouseover', onHover.bind(this))		
		//this.$refs.map.addEventListener('mousemove', onHover.bind(this))

		var onClick = function (e) {
			var posicoesCharts = Charts.posicoesCharts
			/*
			for (var i=0; i<posicoesCharts.length; i++)
				console.log(posicoesCharts[i].bounds[0][0], posicoesCharts[i].bounds[0][1])
			*/	
			if (this.zonasSobMouse && this.zonasSobMouse.length)
				this.$emit('click', this.zonasSobMouse)
		}
		//this.$refs.map.addEventListener('click', onClick.bind(this))

		// this.onAlterouCandidatos() will be called every time a candidate 
		// is added to or removed from Store.the candidatos list
		Store.adicionarCallbackCandidatos(this.onAlterouCandidatos, this)

		this.map = L.map('map', {
			zoomDelta: 0.25,
			zoomSnap: 0.25
		})

		// Decision time: which tile design is better?

		var mapnikTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});

		var hotTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
		});

		var OpenStreetMap_Wikimedia = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia maps</a> | Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    	});

		mapnikTileLayer.addTo(this.map);

		this.fitBoundsToBrazil();

		this.map.addEventListener('mouseover', onHover.bind(this))		
		this.map.addEventListener('mousemove', onHover.bind(this))
		this.map.addEventListener('click', onClick.bind(this))

		Charts.setUpCanvasLayer(this.map)

		// Code below by Ryan Clark (https://blog.webkid.io/maps-with-leaflet-and-topojson/)
		L.TopoJSON = L.GeoJSON.extend({  
		    addData: function (jsonData) {    
			    if (jsonData.type === 'Topology') {
			        for (var key in jsonData.objects) {
				        var geojson = topojson.feature(jsonData, jsonData.objects[key]);
				        L.GeoJSON.prototype.addData.call(this, geojson);
	 		        }
			    }    
			    else {
			        L.GeoJSON.prototype.addData.call(this, jsonData);
			    }
			}  
		});

		setTimeout(() => this.loadStatesBorders(), 1000)

    },

	methods: {

		calcMapHeight () {
			return document.documentElement.offsetHeight
		},

		calcBrazilBoundaries () {
		    var bounds = [ [ 1000, 1000], [-1000, -1000] ]

		    for (var state in this.stateBoundaries) {
		        bounds[0][0] = Math.min(bounds[0][0], this.stateBoundaries[state][0][0])
		        bounds[0][1] = Math.min(bounds[0][1], this.stateBoundaries[state][0][1])
		        bounds[1][0] = Math.max(bounds[1][0], this.stateBoundaries[state][1][0])
		        bounds[1][1] = Math.max(bounds[1][1], this.stateBoundaries[state][1][1])
		    }

		    return bounds;

		},

		fitBoundsToBrazil () {
			this.map.fitBounds(this.calcBrazilBoundaries(), {
				paddingTopLeft: [-400, 0]
			});
		},

		flyToState (state) {
			var boundaries = this.stateBoundaries[state],
				center,
				zoom
			if (boundaries) {
				center = [ 
						(boundaries[0][0] + boundaries[1][0]) /2,
						(boundaries[0][1] + boundaries[1][1]) /2 
				]
				zoom = this.map.getBoundsZoom(boundaries)
			}
			else {
				center = this.geolocations[state]
				zoom = 7
			}					

			// Limitamos o zoom a no máximo 9 por causa do Distrito Federal
			zoom = Math.min(zoom, 9)  
			this.map.invalidateSize()
			this.map.flyTo(center, zoom)

		},	

		showMenu (e) {
	        e.preventDefault()
	        this.showLayersMenu = false
	        this.layersMenuPositionX = e.clientX
	        this.layersMenuPositionY = e.clientY
	        var that = this
	        this.$nextTick(() => {
	          that.showLayersMenu = true
	        })  
		},

		loadStatesBorders () {
			var that = this

			function addTopoData (topoData) { 
				const topoLayer = new L.TopoJSON();
			    topoLayer.addData(topoData);
			    topoLayer.addTo(that.map);
			    topoLayer.eachLayer(handleStateLayer);
			    statesBordersLayer = topoLayer
			}

			function handleStateLayer (layer) {
			    var fillColor = '#ff0000' 
			    if (layer.feature.properties.cod != 3550308)
			        fillColor = 'rgba(255,255,255,0.4)'   
			  
				layer.setStyle({
				    fillColor: '#444',
				    fillOpacity: 0,
				    color: '#555',
				    weight: 1,
				    opacity: 0.2
				});

				layer.on({
				    mouseover: enterLayer,
				    mouseout: leaveLayer,
				    click: clickLayer
				});

			}

			function enterLayer () {
				const countryName = this.feature.properties.name;

				this.bringToFront();
				this.setStyle({
				    weight:1,
				    opacity: 1,
				    fillOpacity: 0.05,
				});
			}

			function leaveLayer () {
				this.bringToBack();
				this.setStyle({
				    weight:1,
				    opacity:.2,
				    fillOpacity: 0
				});
			}

			function clickLayer (e) {
				var codIbge = e.target.feature.id,
					uf = utils.obterUfPorCodIbge(codIbge)

				that.$emit('set-uf', uf)
			}

			if (statesBordersLayer) {
				statesBordersLayer.eachLayer(handleStateLayer);
				return
			}

			api.getStatesBordersMap()
			.then((response) => addTopoData(response.data))
			.catch((error) => {
				console.error('Error trying to load shapes of the Brazilian states')
				console.error(error)
			})		
		},

		highlightStateBorder (uf) {
			var codIbge = uf.codIbge,
				nome = uf.nome.toUpperCase()

			function handleStateLayer(layer) {
  			    if (layer.feature.id == codIbge) {
	  			  	layer.setStyle({
				  	    fillOpacity: 0,
				  		weight: 1,
				  		opacity: 0.4
				  	})
				}
				else {
					layer.setStyle({
				  	  	fillOpacity: 0,
				  		opacity: 0
				 	})
				}
				layer.off('mouseover')
				layer.off('mouseout')
				layer.off('click')
			}

			if (statesBordersLayer) {
				statesBordersLayer.eachLayer(handleStateLayer);
			}	
		},

		drawStateBorders () {

			var that = this

			function handleLayer(layer) {
				layer.setStyle({
				    fillColor: 'rgba(255, 255, 255)',
				    fillOpacity: 0.0,
				    color: '#444',
				    weight: 2,
				    opacity: 0.4
				});

				layer.on({
					click: (e) => {
						if (that.zonasSobMouse && that.zonasSobMouse.length)
							that.$emit('click', that.zonasSobMouse)
						return true
					}
				})

			}

			function addTopoData(topoData) { 
			    topoLayer.addData(topoData);
			    topoLayer.addTo(that.map);
			    topoLayer.eachLayer(handleLayer);
			}
	
			if (this.topoLayer)
				this.map.removeLayer(this.topoLayer)

			const topoLayer = new L.TopoJSON();
			this.topoLayer = topoLayer

			api.getStateBordersMap(this.uf.sigla)
			.then((response) => addTopoData(response.data))
			.catch((error) => console.log(error))
		},

		removeStateBorders () {
			if (this.topoLayer)
				this.map.removeLayer(this.topoLayer)
		},

/*
		loadIbgeData (uf) {
			var that = this
			setTimeout(() => {
				DataLayers.carregarMapaMunicipiosUf(uf)
				.then((response) => {
					return DataLayers.carregarDadosIbge(uf)
				})
				.then((response) => {
					DataLayers.mostrarLayer(that.map, 'gini2010', chroma.scale(['#fff', '#000']).domain([0.2, 0.7]))
				})
			}, 500)	
		},

		showDataLayer (dataLayer) {
			if (dataLayer.id == 'nolayer') {
				return DataLayers.removerLayer(this.map)
			}
			console.log(dataLayer)

			DataLayers.mostrarLayer(
				this.map, 
				dataLayer.id, 
				chroma.scale(dataLayer.chromaScale).domain(dataLayer.chromaDomain)
			)
		},
*/

		// THE METHOD BELOW IS NOT CURRENTLY IN USE
		drawMunicipalities () {
			var topoFileAddress = '/public/maps/topojson-brasil/35.json' 		// São Paulo
			//topoFileAddress = "http://servicodados.ibge.gov.br/api/v2/malhas/35?resolucao=5"
			var that = this

			const colorScale = chroma
  				.scale(['#D5E3FF', '#003171'])
  				.domain([0,1]);

			function handleLayer(layer) {
				layer.setStyle({
				    fillColor: `rgb(${colorScale(Math.random()).rgb().join(',')})`,
				    fillOpacity: 0.3,
				    color: '#444',
				    weight: 0,
				    opacity: 0.6
				});
			}

			function addTopoData(topoData) { 
			    topoLayer.addData(topoData);
			    topoLayer.addTo(that.map);
			    topoLayer.eachLayer(handleLayer);
			}
	
			if (this.topoLayer)
				this.map.removeLayer(this.topoLayer)

			const topoLayer = new L.TopoJSON();
			this.topoLayer = topoLayer
			
			axios.get(topoFileAddress)
			.then((response) => addTopoData(response.data))
		},

		onResize () {

		},

		onAlterouCandidatos (acao, candidato) {
			Charts.calcPlottingData()
			Charts.redrawCharts()
			this.displayChartTypes = Store.candidatos.length
		},

		changeChartType (chartType) {
    		Charts.setChartType(chartType, this.radiusType)	
    		Charts.redrawCharts()
    		this.chartType = chartType
		},

		changeIndexChartType (chart) {
			var indexType = chart.name,
				palette = chart.palette, 
				domain = chart.domain
			// this.indexes contains the candidate for whom we are generating the individual index
			palette = palette || ['#fee5d9', '#a50f15']
			domain = domain || [0, 1]
			var chromaColor = chroma.scale(palette).domain(domain)
			Charts.setChartType('index', this.radiusType, this.showIndexes, indexType, chromaColor)
			Charts.redrawCharts()
			this.indexChartType = indexType
			this.setMapLegendFromIndex(chart)
		},

		changeRadiusType (radiusType) {
			Charts.setRadiusType(radiusType)
			Charts.redrawCharts()
			this.radiusType = radiusType
		},

		setMapLegendFromIndex (indexObj) {
			if (!indexObj) 
				this.mapLegend = {
					show:false
				}
			else	
				this.mapLegend = {
					show: true,
					title: indexObj.legendTitle,
					text: indexObj.legendText,
					palette: indexObj.legendPalette || indexObj.palette,
					domain: indexObj.legendDomain || indexObj.domain,
					padding: indexObj.padding,
					labels: indexObj.legendLabels,
				}				
		}
	}	

}

</script>

<style>

	.map-controls {
	    background-color: #424242;	
	    background-color:#fff;
	    border: 0px solid #424242;
	    padding: 4px;
	    cursor: pointer;
	    z-index:10000;
	    color: #ddd;
	    color:#000;
	}

	.map-control-zoom {
		position: absolute;
		left: 12px;
		top: 12px;
	}

	.map-control-chart-type {
	    position: absolute;		
	    right: 12px;
	    top: 12px;
	}

	.map-control-radius-type {
		position: absolute;
		right: 12px;
		top:256px;
	}

	.map-control-data-layers {
		position: absolute;
		right:12px;
		top:342px;
	}

	.selected-chart {
		color: #64b5f6;
	}

	.char-icon {
		width:32px;
		height:32px;
		padding-top:4px;
		padding-bottom:4px;
		text-align:center;
		font-weight:800;
		font-size:18px;
	}

	.leaflet-bar {
		border-radius: 0 !important;
	}

	.leaflet-bar a {
		border:0;
		border-radius: 0 !important;
/*
		background-color:#424242 !important;
		color:#eee !important;
*/
		color:rgb(61,61,61) !important;	 	
	}

.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	 border: 0 !important;
	background-clip: padding-box;
	}

	.pointer {
		cursor: pointer;
	}

</style>	