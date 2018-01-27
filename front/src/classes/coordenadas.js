'use strict'

import Voronoi from 'voronoi'

class Coordenadas {

	constructor (coords) {
		var vizinhos = Coordenadas.calcularVizinhos(coords)
		for (var id in coords) {
			this[id] = coords[id]
			//console.log(id)
			if (!vizinhos[id]) {
				// ESTA SITUAÇÃO NÃO DEVERIA ACONTECER!
				console.error('Erro calculando vizinhos do id ' + id)	
				this[id].vizinhos = []
			}
			else {
				this[id].vizinhos = vizinhos[id].vizinhos
			}	
		}

		return this
	}

	static calcularVizinhos (coordenadas) {
    	var sites,
    		bbox,
    		bboxInicial			// We use this intermediate variable just to make the logic clearer

    	// Voronoi.compute requires two variables: sites and bbox
    	// sites is an array of objects in the format {x, y, id}
    	sites = Object.keys(coordenadas).map(id => {
    		var {municipio, lat, long} = coordenadas[id]
            return {
                id,
                municipio,
                x: parseFloat(lat),
                y: parseFloat(long)
            }
        }).sort((a, b) => {
        	if (a.x == b.x)
        		return a.y - b.y
        	else
        		return a.x - b.x
        })
        // Pequeno ajuste para impedir que duas coordenadas sejam idênticas
        for (var i=1; i<sites.length; i++) {
        	var siteAtual = sites[i],
        		siteAnterior = sites[i-1]
        	if (siteAtual.x == siteAnterior.x && siteAtual.y == siteAnterior.y) {
        		siteAtual.x += 0.00001
        	}
        }
        bboxInicial = {
            xl: 0,
            xr: -90,
            yt: 0,
            yb: -90
        }        
        bbox = sites.reduce((bbox, site) => {
            if (site.x < bbox.xl)
                bbox.xl = site.x
            if (site.x > bbox.xr)
                bbox.xr = site.x
            if (site.y < bbox.yt)
                bbox.yt = site.y
            if (site.y > bbox.yb)
                bbox.yb = site.y
            return bbox
        }, bboxInicial)
        bbox.xl -= 1
        bbox.xr += 1
        bbox.yt -= 1
        bbox.yb += 1
        
        var vizinhos = Coordenadas.calcularVizinhosUsandoVoronoi(sites, bbox),
        	vizinhosDict = {}

		vizinhos.forEach(vizinho => {
			vizinhosDict[vizinho.id] = vizinho
		})
        return vizinhosDict    
    }    

	static calcularVizinhosUsandoVoronoi (sites, bbox) {
		var voronoi = new Voronoi(),
    		diagram = voronoi.compute(sites, bbox)
    
    	console.log('Diagrama criado em ' + diagram.execTime + 'ms')

	    return diagram.cells.map((cell) => {
	        var id = cell.site.id,
	            municipio = cell.site.municipio,
	            vizinhos = []
	        
	        cell.halfedges.forEach((halfedge) => {
	            if (halfedge.edge.lSite && halfedge.edge.lSite.id != cell.site.id) {
	                vizinhos.push(halfedge.edge.lSite.id)
	            }
	            if (halfedge.edge.rSite && halfedge.edge.rSite.id != cell.site.id) {
	                vizinhos.push(halfedge.edge.rSite.id)
	            }
	        })

	        return {
	            id, 
	            municipio,
	            vizinhos
	        }
	    })
	}    

}

export default Coordenadas