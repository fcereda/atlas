'use strict'

import axios from 'axios'

var mapasMunicipios = {},
	mapaAtual = null,
	dadosIbge = {},
	dadosAtual = null,
	topoLayer = null

export default {

	carregarMapaMunicipiosUf (uf) {
		var codIbge = uf.codIbge,
			topoFile = `/public/maps/municipios/${ codIbge }.json`

		if (mapasMunicipios[codIbge])
			return new Promise((resolve, reject) => resolve(mapasMunicipios[codIbge]))

		return axios.get(topoFile)
		.then((response) => {
			var mapa = response.data
			mapasMunicipios[codIbge] = mapa
			mapaAtual = mapa
			return new Promise((resolve, reject) => resolve(mapa))
		})
		.catch((error) => {
			console.log('Error trying to load file ' + topoFile)
			return new Promise((resolve, reject) => reject(error))
		})
	},

	carregarDadosIbge (uf) {
		var sigla = uf.sigla,
			url = `/api/municipios?uf=${sigla}`

		if (dadosIbge[sigla])  
			return new Promise((resolve, reject) => resolve(dadosIbge[sigla]))

		return axios.get(url)
		.then((response) => {
			var dados = response.data
			// dados é um array de objetos. Queremos transformá-lo em um dicionário com a chave id
			dadosIbge[sigla] = dados.reduce((dict, municipio) => {
				var id = parseInt(municipio.id)
				dict[id] = municipio
				return dict
			}, {})
			dadosAtual = dadosIbge[sigla]

			return new Promise((resolve, reject) => resolve(dados))
		})
		.catch((error) => {
			console.log('Error trying to load IBGE data for ' + sigla)
			return new Promise((resolve, reject) => reject(error))
		})

	},

	mostrarLayer (mapa, indice, chromaColors) {
		console.log('Vamos mostrar o data layer referente ao índice ' + indice)
		if (topoLayer) {
			mapa.removeLayer(topoLayer)
		}
		topoLayer = new L.TopoJSON();

		function handleLayer (layer) {
			var codIbge = layer.feature.properties.cod,
				valorIndice = dadosAtual[codIbge][indice]

			if (valorIndice == 'null')	{
				layer.setStyle({
					fillColor: 0,
					fillOpacity: 0
				})
				return
			}
			layer.setStyle({
			    fillColor: chromaColors(valorIndice),
			    fillOpacity: 0.4,
			    color: '#555',
			    weight: 1,
			    opacity: 0.2
			});

		}

		console.error('mostrando dadosaAtual')
		console.log(dadosAtual)
		//return;

	    topoLayer.addData(mapaAtual);
	    topoLayer.addTo(mapa);
	    topoLayer.eachLayer(handleLayer);
	    return topoLayer
	},

	removerLayer (mapa, topoLayer) {
		if (topoLayer)
			mapa.removeLayer(topoLayer)
	}

}