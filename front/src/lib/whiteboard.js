const paneId = 'whiteboard'
var thisMap 


export default {

    addTo (map) {

        if (!map) {
            throw Error('Whiteboard error: no map specified on addTo()')
        }
        thisMap = map

        map.createPane(paneId).style.zIndex = 1000;
        initialize()
        addButtonsTo(map)

        map.on('mousedown', onMouseDown)
        map.on('mouseup',   onMouseUp)
        map.on('mouseout',  onMouseOut)
        map.on('mousemove', onMouseMove)
        map.on('zoomend',   onZoomEnd)
    },

    displayControl (show) {
        document.getElementById('whiteboard-control').style.display = show ? 'inline-block' : 'none'
    },

    getContent () {
        var content = polylines.map(polyline => {
           return {
               options: polyline.options,
               latlngs: polyline._latlngs.map(({lat, lng}) => ([lat, lng]))
           }
        })
       return content
    },

    setContent (content) {
        polylines = []
        content.forEach(({ latlngs, options }) => {
            //let polyline = L.polyline(latlngs, options)
            let polyline = createNewPolyline(latlngs, options)
            polylines.push(polyline)
            addSavedPolylineToMap(polyline)
        })
        addState(polylines)
    },

    eraseContent () {
        polylines.forEach(polyline => polyline.remove())
        polylines = []
        addState(polylines)
    },



}

// Lines displayed are stored in this array
var polylines = []

// Variables used to draw the current line
var mode = null
var oldPosition = null
var mouseIsDown = false
var currentPolyline = null

// Pen settings: color and line weight
var currentColor = 'red'
var currentWeight = 2

// Store states for allowing undo/redo
var states = []
var currentStateIndex = -1

// Initialize state

function initialize () {
    addState(polylines)
    setMode(null)
}

function setMode (newMode) {
    if (!['', null, 'draw', 'erase'].includes(newMode)) {
        return
    }
    mode = newMode
    if (!thisMap || !thisMap.dragging)
        return
    if (mode == 'draw') {
        thisMap.dragging.disable()
    }
    else {
        thisMap.dragging.enable()
    }
}

function isLeftButton (e) {
    return (e.originalEvent.which == 1)
}

function calcPolylineStyle (polyline) {
    var newZoom = thisMap.getZoom()
    var originalZoom = polyline.options.originalZoom
    var originalWeight = polyline.options.originalWeight
    var zoomDifference = newZoom - originalZoom 
    var newWeight = Math.max(originalWeight * Math.pow(2, zoomDifference), 1)
    var newOpacity = 0.8 - zoomDifference * 0.05
    if (newOpacity > 0.8) newOpacity = 0.8
    if (newOpacity < 0.3) newOpacity = 0.3
    return { 
        weight: newWeight, 
        opacity: newOpacity 
    }
}

function addPolyline (polyline) {
    if (!polyline) {   
        return
    } 
    // Transformations should always be immutable, to preserve
    // the state for undo/redo operations!
    polylines = polylines.concat(polyline) 
    addState(polylines)
}

function removePolyline (polyline) {
    if (!polyline) {
        return
    }
    // Transformations should always be immutable, to preserve
    // the state for undo/redo operations!
    polylines = polylines.filter(p => p != polyline)
    addState (polylines)	    
    polyline.remove()
}

// addSavedPolylineToMap (polyline)
// Unlike addPolyline, adds a polyline to the map using addTo(map). Besides:
// 1) adjust for changes in the map's zoom (not necessary on addPolyline, because the
// polyline being added is assumed to be on the map's current zoom);
// 2) does not touch the polylines array (it is assume callee will handle that)
// 3) does not touch the state (again, it assumeds callee will handle that)

function addSavedPolylineToMap (polyline) {
    var style = calcPolylineStyle(polyline)
    if (style && style.weight) {
        polyline.options.weight = style.weight    
    }    
    if (style && style.opacity) {
        polyline.options.opacity = style.opacity
    }
    polyline.options.pane = paneId

    polyline.addTo(thisMap)
}
 
function onZoomEnd (e) {
    polylines.forEach((polyline, index) => {
        polyline.setStyle(calcPolylineStyle(polyline))
        polyline.redraw()
    })
}     
    
function onMouseDown (e) {
    if (mode != 'draw') {
        return 
    }
    if (isLeftButton(e)) {
        mouseIsDown = true
        currentPolyline = null // Just to be on the safe side
        oldPosition = e.latlng
    }
}

function onMouseUp (e) {
    if (mouseIsDown && isLeftButton(e)) {
	    addPolyline(currentPolyline)
        currentPolyline = null
        mouseIsDown = false
    }
}

function createNewPolyline (latlng, options) {
    let thisPolyline = L.polyline(latlng, {...options, pane: paneId }).addTo(thisMap)
    
    function setStyleToDefault (polyline) {
        var style = calcPolylineStyle(polyline)
        style.dashArray = [1]
        style.mode = null
        polyline.setStyle(style)
    }

    thisPolyline.on('mouseover', (e) => {
        if (currentPolyline || (mode != 'erase')) {
            return
        }
        if (thisPolyline.options.mode == 'erase') {
            return
        }
        e.originalEvent.target.style.cursor = 'no-drop'
        let thisWeight = thisPolyline.options.weight
        let newWeight = thisWeight * 1.5
        let dashItem = thisWeight < 5 ? 5 : thisWeight
        thisPolyline.setStyle({ weight: newWeight, dashArray: [dashItem,dashItem], mode: 'erase' })
    })

    thisPolyline.on('mouseout', (e) => {
        if (mode != 'erase') {
            return
        }
        setStyleToDefault (thisPolyline)
    })

    thisPolyline.on('click', (e) => {
        if (mode != 'erase') {
            return
        }
        setStyleToDefault (thisPolyline)
        removePolyline(thisPolyline)                    
    })
    return thisPolyline
}

function onMouseMove (e) {
    if (mode != 'draw') {
        return
    }
    var newPosition = e.latlng 
    if (oldPosition) {
        if (mouseIsDown) {
            if (!currentPolyline) {
                let weight = currentWeight
                let options = {
		            smoothFactor: 0.25,  //0.5, 
                    color: currentColor, 
                    weight: weight, 
                    opacity: 0.8, 
                    originalZoom: thisMap.getZoom(),                     
                    originalWeight: weight
                }
	        currentPolyline = createNewPolyline([oldPosition, newPosition], options)
            }
            else {
                currentPolyline.addLatLng(newPosition) 
            }
        }
    }
    oldPosition = newPosition
}

function onMouseOut (e) {
    // moving out of the map is equivalent to releasing the mouse button, as in
    // both cases we must save a new polyline in case the user was drawing one
    onMouseUp(e)    
}


// *** STATE-RELATED FUNCTIONS

function addState (state) {
    if (currentStateIndex < states.length-1) {
        states.splice(currentStateIndex+1, states.length)
    }
    states.push(state)
    currentStateIndex = states.length - 1
}

// Undo
function retrieveLastState () {
    if (!states.length || currentStateIndex <= 0) {
        return null
    }
    currentStateIndex -= 1
    var state = states[currentStateIndex]
    return state
}

// Redo
function retrieveNextState () {
    if (!states.length || currentStateIndex >= states.length-1) {
        return null
    }
    currentStateIndex += 1     
    var state = states[currentStateIndex]
    return state
}



function changeStateUsing (retrieveStateFunction) {
    //console.log('changeState')
    //console.log('current polylines')
    //console.log(polylines)
    let newPolylines = retrieveStateFunction()
    //console.log('new polylines')
    //console.log(newPolylines)
    if (!newPolylines) 
        return
    polylines.forEach(polyline => polyline.remove())
    newPolylines.forEach(polyline => addSavedPolylineToMap(polyline))
    polylines = newPolylines    
}


function addButtonsTo (map) {

    L.Whiteboard = L.Control.extend({
        options: {
            position: 'topleft',
        },

        initialize (options) {
            this.weights = options.weights || [ 2, 3, 5 ]
            this.colors = options.colors || ['#000F55', 'blue', '#006400', 'green', '#b22222', 'red', '#333333' ]
            L.Util.setOptions(this, options)
        },

        onAdd (map) {
            var controlElementTag = 'div'
            var controlElementClass = 'whiteboard-control'
            var controlElement = L.DomUtil.create(controlElementTag, controlElementClass)

            var rootButtonsIds = ['whiteboard-btn-open', 'whiteboard-btn-draw', 'whiteboard-btn-erase', 'whiteboard-btn-undo', 'whiteboard-btn-redo']
            var drawEraseIds = ['whiteboard-btn-draw', 'whiteboard-btn-erase']
            var weightButtons = this.weights.map(weight => {
                return {
                    id: 'whiteboard-btn-weight-' + weight,
                    weight
                }                
            })
            var weightButtonsIds = weightButtons.map(weightButton => weightButton.id)
            var weightButtonsHTML = weightButtons.map(weightButton => {
                return `<button id="${weightButton.id}" class="dropbtn"><a><svg height="24" width="24">
                    <line x1="2" y1="13" x2="22" y2="13" style="stroke:inherit;stroke-width:${weightButton.weight}" />
                    </svg></a></button>`
            }).join('')
            var colorButtons = this.colors.map((color, index) => {
                return {
                    id: 'whiteboard-btn-color-' + index,
                    color
                }
            })
            var colorButtonsHTML = colorButtons.map(colorButton => {
                return `<button id="${colorButton.id}" class="dropbtn"><a href="#"><i class="material-icons" style="color:${colorButton.color};">gesture</i></a></button>`
            }).join('')

            controlElement.innerHTML = `
                <div id="whiteboard-control" class="whiteboard-controls">
                <button id="whiteboard-btn-open" class="dropbtn"><i class="material-icons">border_color</i></button>
                    <div id="whiteboard-controls-popup" style="display:none;">
                    <button id="whiteboard-btn-draw" class="dropbtn"><i class="material-icons">mode_edit</i></button>
                    <button id="whiteboard-btn-erase" class="dropbtn"><i class="material-icons">close</i></button>
                    <div class="dropdown">
                      <button class="dropbtn"><i class="material-icons">line_weight</i></button>
                      <div class="dropdown-content">
                        ${weightButtonsHTML}
                      </div>
                    </div>
                    <div class="dropdown">
                      <button id="btn-color" class="dropbtn"><i class="material-icons">format_color_fill</i></button>
                      <div class="dropdown-content">
                        ${colorButtonsHTML}
                      </div>    
                    </div>  
                    <button id="whiteboard-btn-undo" class="dropbtn"><i class="material-icons">undo</i></button>
                    <button id="whiteboard-btn-redo" class="dropbtn"><i class="material-icons">redo</i></button>
                    </div>
                </div>
                `

            function setHooks () {

                var getEl = (id) => document.getElementById(id)

                var setActive = (ids, activeId) => {
                    ids.forEach(id => {
                        let el = getEl(id)
                        el.className = el.className.replace('active', '')
                    })
                    if (activeId) {
                      getEl(activeId).className += ' active'
                    }
                }    
                        
                var factorySetActive = (group, id) => () => {
                    setActive(group, id)
                }    

                var stopEventPropagation = (event) => {
                    event.preventDefault()
                    event.stopPropagation()                    
                }

                var whiteboardControl = getEl('whiteboard-control')
                whiteboardControl.addEventListener('mousedown', stopEventPropagation)
                whiteboardControl.addEventListener('click', stopEventPropagation)
                whiteboardControl.addEventListener('dblclick', stopEventPropagation)


                getEl('whiteboard-btn-open').addEventListener('click', (e) => {
                    var ctrlPopup = getEl('whiteboard-controls-popup')
                    var btnPopup = getEl('whiteboard-btn-open')
                    if (ctrlPopup.style.display == 'none') {
                        ctrlPopup.style.display = 'block'
                        btnPopup.className = btnPopup.className + ' open'
                        setMode('draw')
                        setActive(drawEraseIds, 'whiteboard-btn-draw')
                    }        
                    else {
                        ctrlPopup.style.display = 'none'
                        btnPopup.className = btnPopup.className.replace('open', '')
                        setMode(null)
                    }    
                })    

                drawEraseIds.forEach(id => getEl(id).addEventListener('click', (e) => {
                    setActive(drawEraseIds, id)
                    if (id.indexOf('draw') >= 0)
                        setMode('draw')
                    else
                        setMode('erase')
                }))
                weightButtons.forEach(weightButton => {
                    let id = weightButton.id
                    let weight = weightButton.weight
                    getEl(id).addEventListener('click', () => {
                        factorySetActive(weightButtonsIds, id)
                        currentWeight = weight
                    })    
                })
                colorButtons.forEach(btnColor => {
                    let id = btnColor.id
                    let color = btnColor.color
                    getEl(id).addEventListener('click', () => {
                        getEl('btn-color').style.color = color
                        currentColor = color
                    })
                })   

                getEl('whiteboard-btn-undo').addEventListener('click', (e) => {
                    console.log('whiteboard undo')
                    changeStateUsing(retrieveLastState)
                })
                getEl('whiteboard-btn-redo').addEventListener('click', (e) => {
                    changeStateUsing(retrieveNextState)
                })
            }
                    
            setTimeout(setHooks.bind(this), 10)
            return controlElement
        }
    })

    L.whiteboard = function (options) {
        return new L.Whiteboard(options)
    }

    L.whiteboard({ position: 'topleft' }).addTo(map)


}

