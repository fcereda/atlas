'use strict'

import PlottingData from '../classes/plottingdata.js'

var MapCharts = {
  
    PlottingData: PlottingData,
  
    setPlottingData (data) {
            
        function throwError(msg) {
            throw Error('Error in MapCharts.setPlottingData: ' + msg)
        }
        
        if (!data)
            throwError('missing argument')
        if (arguments > 3)
            throwError('invalid number of arguments')
        if (arguments.length >= 2) {
            plottingData = new PlottingData(arguments[0], arguments[1], arguments[2])
        }
        else {
            plottingData = data
        }
    },
  
    setChartType (chartType, radiusType, legendOptions) {
    
    },
  
    drawChartFactory () {
    // This should not be visible for the outside world
    }
}

module.exports = MapCharts
