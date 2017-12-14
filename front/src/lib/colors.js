import chroma from 'chroma-js'

const colorCircle = [
[	
	[254, 241, 101],	// yellow
	[241, 199, 91],
	[225, 150, 83],		// light orange
	[216, 119, 76],
	[211, 90, 73],		// reddish
	[183, 91, 158],		// pink	
	[110, 76, 154],		// purple	
	[75, 106, 171],		// deep blue	
	[94, 148, 194],		// light blue	
	[115, 181, 171],	// teal	
	[113, 170, 102],	// green	
	[186, 208, 99]		// light green
],	
[
	[215, 199, 62],
	[204, 159, 56],
	[193, 107, 48],
	[189, 76, 44],
	[186, 52, 43],
	[148, 53, 119],
	[64, 47, 115],
	[46, 71, 127],
	[53, 107, 153],
	[74, 135, 130],
	[71, 119, 67],
	[139, 164, 72]
]
]

const materializeSequence = ["229,57,53", "30,136,229", "251,140,0", "76,175,80", "94,53,177", "224,64,251", "255,112,67","142,36,170","255,179,0", 
"57,73,171", "216,27,96", "192,202,51", "0,137,123", "253,216,53"]

const brewerScales = {
	'set1': ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'],
	'paired': ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'],
	'dark2': ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02','#a6761d','#666666'],
}

function hexToRgb (hex) {
	var value = parseInt(hex, 16)
	return Math.floor(value / 256 / 256) + ',' + Math.floor(value / 256) % 256 + ',' + value % 256;
}

var categoricalScales = (function () {
	const categoricalScales = {},
		circleScales = {
			teal: [9, 7, 5, 3, 1, 11, 8, 6, 4, 2, 0, 10],
			usable: [7, 2, 10, 4, 0, 6, 1, 8, 3, 11]
		},
		materializeScales = {
			standard: [0,1,2,3,4,5,6,7,8,9,10,11,12,13],
			reversed: [13,12,11,10,9,8,7,6,5,4,3,2,1],
			blueFirst: [1,0,3,2,4,5,6,7,8,9,10,11,12,13]
		}
		
	for (var scaleName in materializeScales) {
		let scale = materializeScales[scaleName],
			colors = scale.map((index) => materializeSequence[index])

		categoricalScales[scaleName] = colors
	}

	for (var scaleName in circleScales) {			
		let colors = [],
			scale = circleScales[scaleName];
		
		[0, 1].forEach((circle) => {
			scale.forEach((index) => {
				var color = colorCircle[circle][index]
				colors.push(`${color[0]}, ${color[1]}, ${color[2]}`)
			})
		})
		categoricalScales[scaleName] = colors
	}

	for (var scaleName in brewerScales) {
		let colors = [],
			scale = brewerScales[scaleName]
		scale.forEach((color) => {
			let colorNumber = color.replace('#', '')
			//console.log(color.replace('#', ''), hexToRgb(colorNumber))
			colors.push(hexToRgb(colorNumber))
		})	
		categoricalScales[scaleName] = colors
	}
	return categoricalScales
})()
	
export default {

	ColorSequence (type = 'categorical', baseColor='usable', numColors = 10) {

		const scales = {
		    hotScale: [1, 3, 5, 7, 9, 10, 0, 2, 4, 6, 8, 11],
		    tealScale: [9, 7, 5, 3, 1, 11, 8, 6, 4, 2, 0, 10],
		    usableScale: [7, 2, 10, 4, 0, 6, 1, 8, 3, 11]
		}  


		var colors = [],
			scale;

		if (type == 'categorical') {
/*
			[0, 1].forEach((circle) => {
				scale.forEach((index) => {
					var color = colorCircle[circle][index]
					colors.push({
						rgbColor: `${color[0]}, ${color[1]}, ${color[2]}`,
						inUse: false
					})
				})
			})		
*/
			scale = categoricalScales[baseColor]
			scale.forEach((color) => {
				colors.push({
					rgbColor: color,
					inUse: 0
				})
			})
		}
		else {
			scale = chroma.scale([baseColor, 'white']).padding([0, 0.4]).colors(numColors)
			for (var i=0; i<numColors; i++) {
				var color = hexToRgb(scale[i].replace('#', '0x'))
				colors.push({
					rgbColor: color,
					inUse: 0
				})
			}	
		}	

		this.colors = colors
		this.type = type
		this.baseColor = baseColor

		this.getNextColor = function () {
			var numUsers = 0
			// this while clause is just to make sure the look will 
			// eventually end -- we don't want numUsers to get this big!
			while (numUsers < 100) {
				for (var i=0; i<this.colors.length; i++) {
					if (this.colors[i].inUse <= numUsers) {
						this.colors[i].inUse = numUsers + 1
						return this.colors[i].rgbColor
					}
				}
				numUsers += 1
			}	
		}

		this.getColorsFromSequence = function (start = 0, size) {
			var colors = []
			size = size || this.colors.length
			for (var i = 0; i < size; i++)
				colors.push(this.colors[start+i].rgbColor)
			return colors
		}	

		this.getLinearColorSequence = function () {
			return hexToRgb(materialColors[this.color])
		}

		this.returnColor = function (color) {
			for (var i=0; i<this.colors.length; i++) {
				if (this.colors[i].color == color || this.colors[i].rgbColor == color) {
					this.colors[i].inUse -= 1
					return color
				}
			}
		}

	}	


}

