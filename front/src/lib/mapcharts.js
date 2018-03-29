'use strict'

import PlottingData from '../classes/plottingdata.js'
import Colors from './colors.js'
import './L.CanvasLayer.js'

const FIXED_RADIUS = 0,
    VARIABLE_RADIUS = 1,
    CHOROPLETH = -1   
var radianos = (new Array(101)).fill(1).map((ignore, index) => Math.PI * 2 / 100 * index),
    noventaGraus = Math.PI / 2,
    doisPI = Math.PI * 2,
    leafletMap,
    chartCanvas,
    chartBorders,
    plottingData = [],
    plottingColors = [],
    posicoesCharts = []

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

    setUpCanvasLayer (map, chartType='winner', radiusType='variable') {
        leafletMap = map
        this.setChartType(chartType, radiusType)
        chartCanvas = L.canvasLayer()
            .delegate(this) 
            .addTo(leafletMap);
    },

    setUpBordersLayer (map, borders) {
        if (!leafletMap)
            leafletMap = map
        chartBorders = borders
        //chartBorders.addTo(leafletMap)
    },

    redrawCharts () {
        // if chartBorders is not null, we're displaying a choropleth map
        if (chartBorders) {
            this.setChartBordersStyle()
        }
        chartCanvas.needRedraw()
    },

    removeCharts () {
        plottingData = []
        chartCanvas.needRedraw()
    },

    removeBorders () {
        chartBorders.removeFromMap()
        chartBorders = null
    },  
  
    setChartType (chartType, radiusType, legendOptions) {
        const radiusTypes = {
            'v': VARIABLE_RADIUS,
            'f': FIXED_RADIUS,
            'c': CHOROPLETH
        }

        var options = {
            radiusType: radiusTypes[radiusType.charAt(0).toLowerCase()]
        }
        if (options.radiusType == CHOROPLETH) {
            this.onDrawLayer = this.drawChartFactory('empty', options)
            if (chartBorders) {
                chartBorders.addTo(leafletMap)
                this.setChartBordersStyle()
            }
        }
        else {
            this.onDrawLayer = this.drawChartFactory(chartType, options)
            if (chartBorders) {
                chartBorders.setStyle({
                    fillOpacity: 0
                })
                chartBorders.removeFromMap()
            }
        }
        this.chartType = chartType
        if (radiusType) {
            this.radiusType = radiusType
        }
        if (legendOptions) {
            this.legendOptions = legendOptions
        }    
        //this.candidato = candidato
        //this.indice = indice
        //this.chromaColor = chromaColor
        
    },

    setRadiusType (radiusType) {
        this.radiusType = radiusType
        this.setChartType(this.chartType, this.radiusType, this.legendOptions)
    },

    setLegend (legendOptions) {
        this.legendOptions = legendOptions
        this.setChartType(this.chartType, this.radiusType, this.legendOptions)
    },

    setChartBordersStyle (chartType) {

        var plottingDataById = {}
        for (var i=0; i<plottingData.data.length; i++) {
            var data = plottingData.data[i]
            plottingDataById[data.id] = data
        }

        chartBorders.setStyle(feature => {
            var id = feature.properties.id
            var d = plottingDataById[feature.properties.id]
            if (!d) {
                return {
                    fillOpacity: 0
                }
            }    
            var valor = d.orderedPoints[0].value
            var color = d.orderedPoints[0].color

            if (chartType != 'index' && !valor) 
                return {
                    fillOpacity: 0,
                    fillColor: 'white'
                }

            var fillOpacity = 0.8
            var fillColor = Colors.calcColor(color, valor, fillOpacity)
            return {
                fillColor,
                fillOpacity
            }
        })

    },

    drawChartFactory (chartType, options, candidato, indice, chromaColor) {
        var candidatoSelecionado = null,
            indexCandidatoSelecionado = null,
            colors,
            baseRadius,  
            radius,
            lineWidth,
            opacity = 0.8,
            drawFunction = null;

        var noChart = function () {}    

        var drawWinnerChart = function (ctx, dot, d, index) {
            if (index)
                return     
            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.arc(dot.x, dot.y, radius, 0, doisPI)
            ctx.fillStyle = Colors.calcColor(d.orderedPoints[0].color, opacity)
            ctx.fill()
            ctx.closePath()
        }        

        var drawPieChart = function (ctx, dot, d, index) {
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);  
            ctx.arc(
                dot.x, 
                dot.y, 
                radius, 
                (index > 0 ? radianos[d.points[index - 1].accumulatedPercentage] : 0 ) - noventaGraus,
                radianos[d.points[index].accumulatedPercentage] - noventaGraus
            )
            ctx.fillStyle = Colors.calcColor(colors[index])
            ctx.fill();
            ctx.closePath();
        }

        var drawDonutChart = function (ctx, dot, d, index) {
            ctx.beginPath();
            ctx.arc(
                dot.x, 
                dot.y, 
                radius * 3/ 4, 
                (index > 0 ? radianos[d.points[index - 1].accumulatedPercentage] : 0 ) - noventaGraus,
                radianos[d.points[index].accumulatedPercentage] - noventaGraus
            )    
            ctx.strokeStyle = Colors.calcColor(colors[index], opacity)
            ctx.lineWidth = radius / 2
            ctx.stroke();
            ctx.closePath();
        }

        var drawBarChart = function (ctx, dot, d, index) {
            let proporcao = d.points[index].percentage / d.orderedPoints[0].percentage,
                numBarras = Math.max(d.points.length, 2),
                barWidth = radius * 2 / numBarras

            ctx.beginPath()
            ctx.moveTo(dot.x - radius + index*barWidth, dot.y + radius)
            ctx.lineTo(dot.x - radius + index*barWidth, dot.y + radius - radius * 2 * proporcao)
            ctx.strokeStyle = Colors.calcColor(colors[index], opacity)
            ctx.lineWidth = barWidth
            ctx.stroke()
            ctx.closePath()   
        }

        var drawHorizontalBarChart = function (ctx, dot, d, index) {
            let porcentagem = d.orderedPoints[index].percentage,
                porcentagemMaisVotado = d.orderedPoints[0].percentage,
                barHeight = Math.min(radius * 2 / d.orderedPoints.length, radius / 2),
                posicaoRanking = index,
                posicaoY = -radius + posicaoRanking * barHeight
                
            ctx.beginPath()
            ctx.moveTo(dot.x - radius, dot.y + posicaoY)
            ctx.lineTo(dot.x - radius + radius * 2 * (porcentagem / porcentagemMaisVotado), dot.y + posicaoY)
            ctx.strokeStyle = Colors.calcColor(d.orderedPoints[index].color, opacity)
            ctx.lineWidth = barHeight
            ctx.stroke()
            ctx.closePath()
        }

        var drawPillChart = function (ctx, dot, d, index) {
            if (index > 1)
                return

            var left,
                width,
                proportion = d.firstTwoPoints[index].percentage / 100
            

            if (index) {
                // Candidate is the 2nd place; their bar is displayed at the right
                left = -radius + (1-proportion) * radius * 2
            }
            else {
                // Candidate is the winner of this district. Their bar is diplayed at the left
                left = -radius
            }
            width = proportion * radius * 2

            ctx.beginPath()
            ctx.fillStyle = Colors.calcColor(d.firstTwoPoints[index].color, opacity)
            ctx.fillRect(dot.x + left, dot.y - radius * (4/8), width, radius * (8/8))
            ctx.closePath()    
                     
        }

        var drawIndexChart = function (ctx, dot, d, index) {
            const OPACITY = 0.75
            if (index)
                return
            var valor = d.points[index].value,
                color = d.points[index].color
            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.arc(dot.x, dot.y, radius, 0, doisPI)
            ctx.fillStyle = Colors.calcColor(color, valor, OPACITY)  
            //ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.75)`
            ctx.fill()
            ctx.closePath()
        }

        var drawEmptyChart = function () {

        }

        const functionsByChartType = {
            'bar'    : drawBarChart,
            'donut'  : drawDonutChart,
            'pie'    : drawPieChart,
            'winner' : drawWinnerChart,
            'pill'   : drawPillChart,
            'hbar'   : drawHorizontalBarChart,
            'index'  : drawIndexChart,
            'empty'  : drawEmptyChart,
            'choropleth': null
        }       

        function drawChart (params) {
            var ctx = params.canvas.getContext('2d'),
                maxSize = plottingData.maxSize,
                maxTotalVotos = 0,
                minRadius = 5,
                maxRadius = 40

            if (options.radiusType === FIXED_RADIUS) {
                baseRadius = Math.pow(2, Math.min(params.zoom, 12) / 2.2)                 
            }
            else {
                baseRadius = Math.pow(2, Math.min(params.zoom, 10)) / 12
                minRadius = Math.max(minRadius, params.zoom/2)
            }    

            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
            posicoesCharts = []    

            for (var i = 0; i < plottingData.length; i++) {
                var d = plottingData.data[i] 

                if (options.radiusType == VARIABLE_RADIUS) {
                    let size = d.size
                    radius = baseRadius * Math.pow(size / maxSize, 0.5)
                    if (radius < minRadius)
                        radius = minRadius
                    if (radius > maxRadius)
                        radius = maxRadius
                    lineWidth = radius / 4                
                }
                else {
                    radius = baseRadius
                }        

                if (params.bounds.contains([d.lat, d.long]) && d.size) {    
                    let dot = params.layer._map.latLngToContainerPoint([d.lat, d.long]); 

                    for (var j = 0; j < d.numPoints; j++) {
                        colors = d.colors
                        drawFunction(ctx, dot, d, j)
                    }

                    posicoesCharts.push({ 
                        id: d.id,
                        bounds: [
                          [dot.x - radius, dot.y - radius],
                          [dot.x + radius, dot.y + radius]
                        ]
                    })                      
                }
            } 
        }

        drawFunction = functionsByChartType[chartType]
        if (drawFunction) {
            return drawChart
        } 
        return noChart
    },

    get posicoesCharts () {
        return posicoesCharts
    },
 
}


export default MapCharts

//module.exports = MapCharts
