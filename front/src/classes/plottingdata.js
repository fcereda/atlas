'use strict'

import Store from '../lib/store.js'

var SimpleStats = require('simple-statistics')

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
        if (!Array.isArray(colors)) {
            colors = [colors]
        }    
        
        var numColors = colors.length,
        	coordenadas = Store.coordenadas,
        	maxSize = 0

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
                accumulatedPercentage = 0,
                points = values.map((value, index) => {
                    let proportion = value / sumValues,
                    	percentage = Math.round(proportion * 100)
                    accumulatedPercentage += percentage
                    return {
                        color: colors[index],
                        value,
                        proportion,
                        percentage,
                        accumulatedPercentage: Math.min(accumulatedPercentage, 100)
                    }
                }),
                //sorts a copy of the original array, keeping the original intact
                orderedPoints = points.slice().sort((a, b) => b.value - a.value),    
                firstTwoPoints = orderedPoints
            if (orderedPoints.length >= 2) {
            	accumulatedPercentage = 0
                firstTwoPoints = orderedPoints.slice(0, 2).map(point => {
                    let value = point.value,
                    	proportion = value / (orderedPoints[0].value + orderedPoints[1].value),
                    	percentage = Math.round(proportion * 100)
                    accumulatedPercentage += percentage
                    return {
                        ...point,
                        value,
                        proportion,
                        percentage,
                        accumulatedPercentage: Math.min(accumulatedPercentage, 100)
                    }
                })
            } 
            if (points.length > 0) {
            	points[points.length-1].accumulatedPercentage = 100
            	//orderedPoints[numPoints-1].accumulatedPercentage = 100
            	firstTwoPoints[firstTwoPoints.length-1].accumulatedPercentage = 100
            }
            var lat = 0,  
            	long = 0
            if (coordenadas[districtId]) {
            	lat = coordenadas[districtId].lat
            	long = coordenadas[districtId].long
            }	
            else {
            	console.warn('Coordenadas ' + districtId + ' não encontradas!')
            }
            return {
                id: districtId,
                lat,
                long,
                size,
                colors,
                values,
                numPoints: points.length,
                points,
                orderedPoints,
                firstTwoPoints
            }
        })
        this.maxSize = this.data.reduce((maximo, {size}) => Math.max(size, maximo), 0)
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

    static calcClusters (data, numClusters) {
    	const breakFunction = SimpleStats.ckmeans

        function calcDomain(chunks) {
            var clusters = chunks
                .map(chunk => Array.isArray(chunk) ? SimpleStats.min(chunk) : parseFloat(chunk))
                .concat(Array.isArray(chunks[chunks.length-1]) ? SimpleStats.max(chunks[chunks.length-1]) : parseFloat(chunks[chunks.length-1]))
            return clusters
        }

    	let values = Object.keys(data).map(districtId => {
            let item = data[districtId],    
                values = item.values ? item.values : item
            return Array.isArray(values) ? values[0] : values
		})                 	
		let chunks = breakFunction(values, numClusters)
		let clusters = calcDomain(chunks)
		return clusters
    }
    
}

export default PlottingData

//module.exports = PlottingData