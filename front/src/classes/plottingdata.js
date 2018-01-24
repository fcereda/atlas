'use strict'

import Store from '../lib/store.js'

class PlottingData {

    constructor (colors, data, legend) {

        function plottingDataError (msg) {
            const ERROR_PREFIX = 'Error in PlottingData constructor: '
            throw Error(ERROR_PREFIX + msg)
        }
        
        if (!colors || !data) {
            plottingDataError('missing required arguments')
        }    
        if (typeof data != 'object') {
            plottingDataError('data argument must be a dictionary')
        }  
          
        if (typeof colors == 'function') {
            colors = colors(Object.keys(data).map(districtId => data[districtId]))
        }   
        if (!colors.length) {
            colors = [colors]
        }    
        
        var numColors = colors.length,
        	coordenadas = Store.coordenadas

        this.colors = colors
        this.data = Object.keys(data).map(districtId => {
            let item = data[districtId],    
                values = item.values ? item.values : item,
                numValues = values.length

            if (!numValues) {
                values = [values]
            }
            else {
                if (numValues > numColors) {
                    plottingDataError('too many values in district ' + districtId)
                }
            }

            let sumValues = values.reduce((total, value) => total + value, 0),
                size = item.size ? item.size : sumValues,
                accumulatedPercentage = 0
                points = values.map((value, index) => {
                    let proportion = value / sumValues,
                    	percentage = Math.round(proportion * 100)
                    accumulatedPercentage += percentage
                    return {
                        color: colors[index],
                        value,
                        proportion,
                        percentage,
                        accumulatedPercentage
                    }
                }),
                orderedPoints = points.slice().sort((a, b) => b.value - a.value),    
                //points.slice().sort sorts a copy of the original array, keeping it intact
                firstTwoPoints = orderedPoints
            if (orderedPoints.length >= 2) {
            	accumulatedPercentage = 0
                firstTwoPoints = orderedPoints.slice(0, 2).map(point => {
                    let proportion = point.value / (orderedPoints[0].value + orderedPoints[1].value),
                    	percentage = Math.round(proportion * 100),
                    	accumulatedPercentage += percentage
                    return {
                        ...point,
                        value,
                        proportion,
                        percentage,
                        accumulatedPercentage
                    }
                })
            } 
 
            return {
                id: districtId,
                lat: coordenadas[districtId].lat,
                long: coordenadas[districtId].long,
                size,
                colors,
                values,
                numPoints: points.length,
                points,
                orderedPoints,
                firstTwoPoints
            }
        })
        this.legend = legend
    }

    get length () {
        return this.data.length
    }
    
    forEach (callback) {
        return this.data.forEach(callback)
    }
    
    map (callback) {
        return this.data.map(callback)
    }
    
    filter (callback) {
        return this.data.filter(callback)
    }
    
    reduce (callback, initialValue) {
        return this.data.reduce(callback, initialValue)
    }
    
}

module.exports = PlottingData