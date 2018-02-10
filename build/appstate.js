'use strict'

const fs = require('fs')
const path = require('path')
const jsonfile = require('jsonfile')

const basePath = './appstate/'

module.exports = {
    getAppState,
    getAllAppStates,
    saveAppState,   
    dumpAllAppStates,
}


async function dumpAllAppStates (fileName='./appstates.json') {
    var appStates = await getAllAppStates(true)
    await saveFile('./statedump.json', appStates)
    return appStates.length
}

async function getAllAppStates (singleFolder=true) {
    if (!singleFolder) {
        throw Error('Error in getAllAppStates: argument singleFolder must be true')
    }

    return new Promise ((resolve, reject) => {
        fs.readdir(basePath, async function (err, list) {
            if (err) {
                return reject(err)
            }
            var ids = list
                .filter(fileName => fileName.length == 11)
                .map(fileName => fileName.substr(0, 6))
                .sort((a, b) => a > b ? 1 : a < b ? -1 : 0)
            var appStates = []
            for (var i=0; i<ids.length; i++) {
                let id = ids[i]
                var appState = await getAppState(id, singleFolder)
                appStates.push(appState)
            }

            resolve(appStates)
        })    
    })    
}

async function getAppState (id, singleFolder=true) {
    var { pathName, fileName } = calcPathFromId(id, singleFolder)
    try {
        var appState = await loadJSONFromFile(path.join(pathName, fileName + '.json'))
        return appState
    }
    catch (err) {
        return null
    }
}


async function saveAppState (appState, singleFolder=true) {
    var id = generateId(6)
    var { pathName, fileName } = calcPathFromId(id, singleFolder)
    fileName += '.json'
    appState.id = id
    appState.timestamp = new Date().getTime()
    
    try {
        await mkdir(pathName)
        await saveFile(path.join(pathName, fileName), appState)
        return id
    }
    catch (err) {
        throw Error(err)
    }
}

function calcPathFromId (id, singleFolder) {
    if (!id || id.length < 5) {
        return null
    }    
    
    var pathName,
        fileName
    
    if (singleFolder) {
        pathName = path.join(basePath)
        fileName = id
    }    
    else {
        pathName = path.join(basePath, id.substr(0, 2), id.substr(2, 2))
        fileName = id.substr(4, 100)
    }    

    return {pathName, fileName}
}

async function loadJSONFromFile (filePath) {
    return new Promise((resolve, reject) => {
        jsonfile.readFile(filePath, function (err, obj) {
            if (err) {
                //console.log(err)
                reject(err)
            }    
            else {
                resolve(obj)
            }    
        })
    }) 
}

async function saveFile (filePath, obj) {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(filePath, obj, function (err) {
            if (err) {
                console.log(err)
                reject(err)
            }
            else
                resolve()
        })
    })
}

async function mkdir (path) {

    if (!path)
        throw Error('No path specified')
    
    if (path.indexOf('./') != 0 && path.indexOf('../') != 0 && path.indexOf('/') != 0) {
        path = './' + path
    }    
    
    var dirs = path.split('/')
    
    dirs[1] = dirs[0] + '/' + (dirs[1] || '')
    
    for (var i=1, thisPath=''; i<dirs.length; i++) {
        if (thisPath) 
            thisPath += '/'
        thisPath += dirs[i]            
        await mkdirSingle(thisPath)    
    }
    
    return true
}

async function mkdirSingle (path) {

    return new Promise ((resolve, reject) => {
        fs.mkdir(path, e => {
            if(!e || (e && e.code === 'EEXIST')) {
                resolve()
            } 
            else {
                reject(e)
            }
        })
    })
}

function generateId (numChars = 6) {
    var upperCaseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        sizeUpperCaseAlphabet = upperCaseAlphabet.length,
        completeAlphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        sizeCompleteAlphabet = completeAlphabet.length,
        alphabet = upperCaseAlphabet,
        sizeAlphabet = sizeUpperCaseAlphabet,
        id = ''
    
    for (var i=0; i<numChars; i++) {
        let index = Math.floor(Math.random() * sizeAlphabet)
        if (index >= sizeAlphabet) {
            console.error('index = ' + index)
        }
        id += alphabet.charAt(index)
        sizeAlphabet = sizeCompleteAlphabet
        alphabet = completeAlphabet
    }       
    return id
}