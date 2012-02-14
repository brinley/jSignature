/** @license
 * jSignature v2 SVG export plugin.
 *
 * Copyright (c) 2011 Willow Systems Corp http://willow-systems.com
 * 
 * MIT License <http://www.opensource.org/licenses/mit-license.php> 
 */
(function(){

	var compressstroke = function(strokex, strokey, shiftx, shifty){
		// we combine strokes data into string like this:
		// 'M 53 7 l 1 2 3 4 -5 -6 5 -6'
		// see SVG documentation for Path element's 'd' argument.
		var lastx = strokex[0]
		, lasty = strokey[0]
		, i
		, l = strokex.length
		, answer = ['M', lastx - shiftx, lasty - shifty, 'l']
		
		if (l === 1){
			// meaning this was just a DOT, not a stroke.
			// instead of creating a circle, we just create a short line
			answer.concat(1, -1)
		} else {
			for(i = 1; i < l; i++){
				answer = answer.concat(strokex[i] - lastx, strokey[i] - lasty)
				lastx = strokex[i]
				lasty = strokey[i]
			}
		}
		return answer.join(' ')
	}
	, compressstrokes = function(data){
		var answer = ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>']
		, i , l = data.length
		, stroke
		, xlimits = []
		, ylimits = []
		, sizex = 0
		, sizey = 0
		, shiftx = 0
		, shifty = 0
		, minx, maxx, miny, maxy, padding = 1
		
		if(l !== 0){
			for(i = 0; i < l; i++){
				stroke = data[i]
				xlimits = xlimits.concat(stroke.x)
				ylimits = ylimits.concat(stroke.y)
			}
			 
			minx = Math.min.apply(null, xlimits) - padding
			maxx = Math.max.apply(null, xlimits) + padding
			miny = Math.min.apply(null, ylimits) - padding
			maxy = Math.max.apply(null, ylimits) + padding
			shiftx = minx < 0? 0 : minx
			shifty = miny < 0? 0 : miny
			sizex = maxx - minx
			sizey = maxy - miny
		}
		
		answer.push('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+ sizex.toString() +'" height="'+ sizey.toString() +'">')

		for(i = 0; i < l; i++){
			stroke = data[i]
			answer.push('<path style="fill:none;stroke:#000000;" d="'+ compressstroke(stroke.x, stroke.y, shiftx, shifty) +'"/>')			
		}
		answer.push('</svg>')
		return answer.join('')
	}
	, acceptedformat = 'image/svg+xml'
	, pluginCompressor = function(data){
		return [acceptedformat , compressstrokes(data)]
	}
	, Initializer = function($){
		var mothership = $.fn['jSignature']
		mothership(
			'addPlugin'
			,'export'
			,'svg' // alias
			,pluginCompressor
		)
		mothership(
			'addPlugin'
			,'export'
			,acceptedformat // full name
			,pluginCompressor
		)
	}

//  //Because plugins are minified together with jSignature, multiple defines per (minified) file blow up and dont make sense
//	//Need to revisit this later.
	
//	if ( typeof define === "function" && define.amd != null) {
//		// AMD-loader compatible resource declaration
//		// you need to call this one with jQuery as argument.
//		define(function(){return Initializer} )
//	} else {
		// global-polluting outcome.
		if(this.jQuery == null) {throw new Error("We need jQuery for some of the functionality. jQuery is not detected. Failing to initialize..."); return}
		Initializer(this.jQuery)
//	}

}).call(typeof window !== 'undefined'? window : this)