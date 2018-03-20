'use strict'

//import topojson from 'topojson'

if (!topojson) {
    try {
        topojson = require('topojson')
    }
    catch(err) {
    }
}

class Borders {

    constructor (topology, options) {
        if (!options) {
            options = {}
        }
        options.style = options.style || {
            fillColor: '#888',
            fillOpacity: 0,
            color: 'black',
            weight: 0,
            opacity: 0,
            dashArray: '3'
        }

        this.geoJSON = topojson.feature(topology, topology.objects.municipios)
        this.leoJSON = L.geoJSON(this.geoJSON, options)
    }

    setStyle (options) {
        var optionsFunc = options
        if (typeof options == 'function') {
            optionsFunc = options
        }
        else {
            optionsFunc = (layer) => options
        }
        this.leoJSON.eachLayer(layer => {
            let layerOptions = optionsFunc(layer.feature)
            layer.setStyle(layerOptions)
        })
    }

    on (event, handler) {
        this.leoJSON.eachLayer(layer => {
            layer.on(event, handler)
        })
    }

    off (event, handler) {
        this.leoJSON.eachLayer(layer => {
            layer.off(event, handler)
        })
    }

    addTo (map) {
        this.map = map
        this.leoJSON.addTo(this.map)
    }

    removeFromMap () {
        if (!this.map)
            return
        this.map.removeLayer(this.leoJSON)
        this.map = null
    }

}


export default Borders