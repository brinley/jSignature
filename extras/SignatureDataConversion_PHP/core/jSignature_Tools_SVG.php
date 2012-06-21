<?php

/** @license
jSignature v2 SVG export plugin.
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
	
	function round (number, position){
		var tmp = Math.pow(10, position)
		return Math.round( number * tmp ) / tmp
	}
	/**
	 * This is a simple, points-to-lines (not curves) renderer. 
	 * Keeping it around so we can activate it from time to time and see
	 * if smoothing logic is off much.
	 * @public
	 * @function
	 * @returns {String} Like so "l 1 2 3 5' with stroke as long line chain. 
	 */
	function addstroke(stroke, shiftx, shifty){
		// we combine strokes data into string like this:
		// 'M 53 7 l 1 2 3 4 -5 -6 5 -6'
		// see SVG documentation for Path element's 'd' argument.
		var lastx = stroke.x[0]
		, lasty = stroke.y[0]
		, i
		, l = stroke.x.length
		, answer = ['M', round( lastx - shiftx, 2) , round( lasty - shifty, 2), 'l']
		
		if (l === 1){
			// meaning this was just a DOT, not a stroke.
			// instead of creating a circle, we just create a short line
			answer.concat(1, -1)
		} else {
			for(i = 1; i < l; i++){
				answer = answer.concat(stroke.x[i] - lastx, stroke.y[i] - lasty)
				lastx = stroke.x[i]
				lasty = stroke.y[i]
			}
		}
		return answer.join(' ')
	} 
	
	function compressstrokes(data){
		'use strict'
		var answer = [
			'<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
			, '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
        ]
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
		
		answer.push(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+ 
			sizex.toString() +
			'" height="'+ 
			sizey.toString() +
			'">'
		)
		
//		// This is a nice idea: use style declaration on top, and mark the lines with 'class="f"'
//		// thus saving space in svg... 
//		// alas, many SVG renderers don't understand "class" and render the strokes in default "fill = black, no stroke" style. Ugh!!!
//		// TODO: Rewrite ImageMagic / GraphicsMagic, InkScape, http://svg.codeplex.com/ to support style + class. until then, we hardcode the stroke style within the path. 
//		answer.push(
//			'<style type="text/css"><![CDATA[.f {fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}]]></style>'
//		)

		for(i = 0; i < l; i++){
			answer.push('<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="'+ addstroke(data[i], shiftx, shifty) +'"/>')
		}

		answer.push('</svg>')
		return answer.join('')
	}

?>