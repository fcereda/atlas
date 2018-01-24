'use strict'

import PlottingData from '../classes/plottingdata.js'
import './L.CanvasLayer.js'

const FIXED_RADIUS = 0,
    VARIABLE_RADIUS = 1   
var radianos = (new Array(101)).fill(1).map((ignore, index) => Math.PI * 2 / 100 * index),
    noventaGraus = Math.PI / 2,
    doisPI = Math.PI * 2,
    leafletMap,
    chartCanvas,
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

    setUpCanvasLayer (map) {
        leafletMap = map
        this.setChartType('winner', 'variable')
        chartCanvas = L.canvasLayer()
            .delegate(this) 
            .addTo(leafletMap);
    },

    redrawCharts () {
        chartCanvas.needRedraw()
    },

    removeCharts () {
        plottingData = []
        chartCanvas.needRedraw()
    }
  
  
    setChartType (chartType, radiusType, legendOptions) {
    
    },
  

    drawChartFactory (chartType, options, candidato, indice, chromaColor) {
        var candidatoSelecionado = null,
            indexCandidatoSelecionado = null,
            colors,
            baseRadius,  
            radius,
            lineWidth,
            drawFunction = null;

        var noChart = function () {}    

        var drawPieChart = function (ctx, dot, d, index) {
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);       
            //ctx.arc(dot.x, dot.y, radius, d.angulosIniciais[index] - noventaGraus, d.angulosIniciais[index+1] - noventaGraus);
            ctx.arc(
                dot.x, 
                dot.y, 
                radius, 
                (index > 0 ? radianos[d.points[index - 1].accumulatedPercentage] : 0 ) - noventaGraus,
                radianos[d.points[index].percentage] - noventaGraus,
            )
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.closePath();
        }

        var drawDonutChart = function (ctx, dot, d, index) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius * 3/ 4, d.angulosIniciais[index] - noventaGraus, d.angulosIniciais[index+1] - noventaGraus);         
            ctx.strokeStyle = colors[index]
            ctx.lineWidth = radius / 2
            ctx.stroke();
            ctx.closePath();
        }
        
        var drawCircleChart = function (ctx, dot, d, index) {
            var thisRadius = radius + index * lineWidth,
                angle = d.anglesForCircleChart[index]       
            ctx.beginPath()
            ctx.moveTo(dot.x + thisRadius, dot.y)
            ctx.arc(dot.x, dot.y, thisRadius, 0, angle)
            ctx.strokeStyle = colors[index]
            ctx.lineWidth = lineWidth
            ctx.stroke()    
            ctx.closePath()
        }

        var drawWinnerChart = function (ctx, dot, d, index) {
            if (index == d.maisVotado) {
                ctx.beginPath()
                ctx.moveTo(dot.x, dot.y)
                ctx.arc(dot.x, dot.y, radius, 0, doisPI)
                ctx.fillStyle = colors[index]
                ctx.fill()
                ctx.closePath()
            }
        }

        var drawBarChart = function (ctx, dot, d, index) {
            let proporcao = d.proporcoes[index] / d.proporcoes[d.maisVotado],
                numBarras = Math.max(d.proporcoes.length, 2),
                barWidth = radius * 2 / numBarras

            ctx.beginPath()
            ctx.moveTo(dot.x - radius + index*barWidth, dot.y + radius)
            ctx.lineTo(dot.x - radius + index*barWidth, dot.y + radius - radius * 2 * proporcao)
            ctx.strokeStyle = colors[index]
            ctx.lineWidth = barWidth
            ctx.stroke()
            ctx.closePath()   
        }

        var drawHorizontalBarChart = function (ctx, dot, d, index) {
            let porcentagem = d.porcentagens[index],
                porcentagemMaisVotado = d.porcentagens[d.maisVotado],
                barHeight = Math.min(radius * 2 / d.porcentagens.length, radius / 2),
                posicaoRanking = d.ranking.indexOf(index),
                posicaoY = -radius + posicaoRanking * barHeight
                
            ctx.beginPath()
            ctx.moveTo(dot.x - radius, dot.y + posicaoY)
            ctx.lineTo(dot.x - radius + radius * 2 * (porcentagem / porcentagemMaisVotado), dot.y + posicaoY)
            ctx.strokeStyle = colors[index]
            ctx.lineWidth = barHeight
            ctx.stroke()
            ctx.closePath()
        }

        var drawPillChart = function (ctx, dot, d, index) {
            var posicaoNoRanking = d.ranking.indexOf(index)
            if (posicaoNoRanking >= 2)
                return    // Pill Chart only displays data for the winner candidate and the runner-up

            var left, 
                width,
                numCandidatos = d.proporcoes.length,
                total = numCandidatos > 1 ? d.proporcoes[d.ranking[0]] + d.proporcoes[d.ranking[1]] : 1.0,
                porcentagem = d.proporcoes[index] / total

            if (posicaoNoRanking) 
                // Candidate is the 2nd place; their bar will be displayed at the right
                left = -radius + (1-porcentagem) * radius * 2
            else 
                // Candidate is the winner. their bar will be displayed on the left
                left = -radius
            width = porcentagem * radius * 2

            if (porcentagem > 1) {
                // This should never occur, so we do display an error before correcting the problem
                console.error('percentage > 1')
                console.log(`posicaoNoRanking = ${posicaoNoRanking}` + 
                    `d.porcentagens[d.ranking[0]] = ${d.porcentagens[d.ranking[0]]}` + 
                    `d.porcentagens[d.ranking[1]] = ${d.porcentagens[d.ranking[1]]}` +
                    `total = ${total}`)
                    console.log(d.ranking)
                    console.log(d.proporcoes)

                porcentagem = 1    
            }      

            ctx.beginPath()
            ctx.fillStyle = colors[index]
            ctx.fillRect(dot.x + left, dot.y - radius * (4/8), width, radius * (8/8))
            ctx.closePath()                          
        }

        var drawDiamondChart = function (ctx, dot, d, index) {
            var posicaoNoRanking = d.ranking.indexOf(index)
            if (posicaoNoRanking >= 2)
                return    // Diamond Chart only displays data for the winner candidate and the runner-up

            var left, 
                top, 
                numCandidatos = d.proporcoes.length,
                total = numCandidatos > 1 ? d.proporcoes[d.ranking[0]] + d.proporcoes[d.ranking[1]] : 1.0,
                porcentagem = d.proporcoes[index] / total

            ctx.beginPath()
            ctx.fillStyle = colors[index]
            if (!posicaoNoRanking) {
                // Winner in the district
                left = radius * (1 - Math.sqrt((1 - porcentagem) * 2))
                top = radius - left
                ctx.moveTo(dot.x - radius, dot.y)
                ctx.lineTo(dot.x, dot.y - radius)
                ctx.lineTo(dot.x + left, dot.y - top)
                ctx.lineTo(dot.x + left, dot.y + top)
                ctx.lineTo(dot.x, dot.y + radius)
                ctx.lineTo(dot.x - radius, dot.y)
            }
            else {
                // Runner-up
                left = radius * (1 - Math.sqrt(porcentagem * 2))
                top = radius - left
                ctx.moveTo(dot.x + left, dot.y - top)
                ctx.lineTo(dot.x + radius, dot.y)
                ctx.lineTo(dot.x + left, dot.y + top)
                ctx.lineTo(dot.x + left, dot.y - top)
            }
            ctx.fill()
            ctx.closePath()
        }        


        var drawIndexChart = function (ctx, dot, d, index) {
            if (index != indexCandidatoSelecionado)
                return

            // Somente plota alguma coisa caso realmente tenhamos um índice
            if (!d.indices[index])
                return
            if (d.indices[index][indice] == undefined)
                return

            var steps = [], 
                valorIndice = d.indices[index][indice],          // at this time, indice may be 'indiceLQ' or 'indicePareto'
                color = chromaColor(valorIndice).rgb() 

            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.arc(dot.x, dot.y, radius, 0, doisPI)
            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.75)`
            ctx.fill()
            ctx.closePath()
        }

        var drawEmptyChart = function () {

        }

        const functionsByChartType = {
            'bar'    : drawBarChart,
            'circle' : drawCircleChart,
            'donut'  : drawDonutChart,
            'pie'    : drawPieChart,
            'winner' : drawWinnerChart,
            'pill'   : drawPillChart,
            'hbar'   : drawHorizontalBarChart,
            'index'  : drawIndexChart,
            'diamond': drawDiamondChart,
            'empty'  : drawEmptyChart
        }       

        function drawChart (params) {
            var ctx = params.canvas.getContext('2d'),
                maxTotalVotos = 0,
                minRadius = 5,
                maxRadius = 40

            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
            posicoesCharts = []    

            for (var i = 0; i < plottingData.length; i++) {
                var d = plottingData[i] /*,
                    numCandidatos = (drawFunction == drawIndexChart) ? d.indices.length : d.votos.length;
*/
/*
                if (options.radiusType == VARIABLE_RADIUS) {
                    let tamanhoDistrito = 0
                    if (chartType == 'index')     
                        tamanhoDistrito = d.totaisUrnas ? d.totaisUrnas[indexCandidatoSelecionado] : 0
                    else
                        tamanhoDistrito = d.totalVotos
                    radius = baseRadius * Math.pow(tamanhoDistrito / maxTotalVotos, 0.5)    
                    if (radius < minRadius)
                        radius = minRadius
                    if (radius > maxRadius)
                        radius = maxRadius
                    lineWidth = radius / 4                
                }
                else {
                    radius = baseRadius
                }        
*/
                // Só para começar, fazemos todos os charts com o mesmo raio
                radius = baseRadius

                if (params.bounds.contains([d.lat, d.long]) && d.totalVotos) {    
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


        function drawChart0 (params) {
            var ctx = params.canvas.getContext('2d'),
                maxTotalVotos = 0,
                minRadius = 5,
                maxRadius = 40

            if (candidatoSelecionado) 
                indexCandidatoSelecionado = Store.candidatos.indexOf(candidatoSelecionado)
            else
                indexCandidatoSelecionado = null

            if (options.radiusType === FIXED_RADIUS) {
                baseRadius = Math.pow(2, Math.min(params.zoom, 12) / 2.2)                 
            }
            else {
                baseRadius = Math.pow(2, Math.min(params.zoom, 10)) / 12
                minRadius = Math.max(minRadius, params.zoom/2)
                if (chartType == 'index') {  
                    for (var i=0; i<plottingData.length; i++) {
                        if (plottingData[i] && plottingData[i].totaisUrnas) {
                            if (plottingData[i].totaisUrnas[indexCandidatoSelecionado] > maxTotalVotos)
                                maxTotalVotos = plottingData[i].totaisUrnas[indexCandidatoSelecionado]
                        }    
                    }
                }
                else {
                    for (var i=0; i<plottingData.length; i++) {
                        if (plottingData[i].totalVotos > maxTotalVotos)
                            maxTotalVotos = plottingData[i].totalVotos
                    }
                }    
            }

            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
            posicoesCharts = []

            for (var i = 0; i < plottingData.length; i++) {
                var d = plottingData[i],
                    numCandidatos = (drawFunction == drawIndexChart) ? d.indices.length : d.votos.length;

                if (options.radiusType == VARIABLE_RADIUS) {
                    let tamanhoDistrito = 0
                    if (chartType == 'index')     
                        tamanhoDistrito = d.totaisUrnas ? d.totaisUrnas[indexCandidatoSelecionado] : 0
                    else
                        tamanhoDistrito = d.totalVotos
                    radius = baseRadius * Math.pow(tamanhoDistrito / maxTotalVotos, 0.5)    
                    if (radius < minRadius)
                        radius = minRadius
                    if (radius > maxRadius)
                        radius = maxRadius
                    lineWidth = radius / 4                
                }
                else {
                    radius = baseRadius
                }        

                if (params.bounds.contains([d.lat, d.long]) && d.totalVotos) {    
                    let dot = params.layer._map.latLngToContainerPoint([d.lat, d.long]); 

                    for (var j = 0; j < numCandidatos; j++) {
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

/*
        if (candidato) {
            candidatoSelecionado = Store.obterCandidato(candidato)
            indice = indice || 'indiceLQ'
        }
        else
            candidatoSelecionado = null
*/
        drawFunction = functionsByChartType[chartType]
        if (drawFunction) {
            return drawChart
        } 
        return noChart
    },
 
}


module.exports = MapCharts
