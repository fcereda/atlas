'use strict'

function DataQuery (options) {
    let {tipo, uf, ano, cargo, numero, codMunicipio, codTse, zona, numZona, idZona } = options
    codTse = codTse || codMunicipio
    numZona = numZona || zona
    if (!idZona && codTse && numZona) {
        codTse = ('00000' + codTse).substr(-5)
        numZona = ('000' + numZona).substr(-3)
        idZona = `${codTse}-${numZona}`
    }
    
    this.url = function () { 
        return this.path
    }
    
    if (tipo == 'candidato') {
        this.path = `/candidato/${uf}/${ano}/${cargo}/${numero}`
    }
    else if (tipo == 'totais') {
        this.path = `/totais/${uf}/${ano}/${cargo}`
    }
    else if (tipo == 'maisvotados') {
        this.path = `/maisvotados/${uf}/${ano}/${cargo}/${idZona}`
    }
    else {
        throw 'Error in DataQuery constructor: invalid option "tipo"'
    }        
}

module.exports = DataQuery