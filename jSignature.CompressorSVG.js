/** @license
 * jSignature v2 SVG export plugin.
 *
 * Copyright (c) 2011 Willow Systems Corp http://willow-systems.com
 * 
 * MIT License <http://www.opensource.org/licenses/mit-license.php> 
 */

(functhion(){

	function Vector(x,y){
		this.x = x
		this.y = y
		this.reverse = function(){
			this.x = this.x * -1
			this.y = this.y * -1
			return this;
		}
		this._length = null
		this.getLength = function(){
			if (!this._length){
				this._length = Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) )
			}
			return this._length
		}
		
		var polarity = function (e){
			return Math.round(e / Math.abs(e))
		}
		this.resizeTo = function(length){
			// proportionally changes x,y such that the hypotenuse (vector length) is = new length
			if (this.x === 0 && this.y === 0){
				this._length = 0
			} else if (this.x === 0){
				this._length = length
				this.y = length * polarity(this.y)
			} else if(this.y === 0){
				this._length = length
				this.x = length * polarity(this.x)
			} else {
				var proportion = Math.abs(this.y / this.x)
					, x = Math.sqrt(Math.pow(length, 2) / (1 + Math.pow(proportion, 2)))
					, y = proportion * x
				this._length = length
				this.x = x * polarity(this.x)
				this.y = y * polarity(this.y)
			}
			return this
		}
	}
	
	function Point(x,y){
		this.x = x
		this.y = y
		
		this.getVectorToCoordinates = function (x, y) {
			return new Vector(x - this.x, y - this.y)
		}
		this.getVectorFromCoordinates = function (x, y) {
			return this.getVectorToCoordinates(x, y).reverse()
		}
		this.getVectorToPoint = function (point) {
			return new Vector(point.x - this.x, point.y - this.y)
		}
		this.getVectorFromPoint = function (point) {
			return this.getVectorToPoint(point).reverse()
		}
	}
	
	var segmentToCurve = function(stroke, positionInStroke, lineCurveThreshold){
		'use strict'
		// long lines (ones with many pixels between them) do not look good when they are part of a large curvy stroke.
		// You know, the jaggedy crocodile spine instead of a pretty, smooth curve. Yuck!
		// We want to approximate pretty curves in-place of those ugly lines.
		// To approximate a very nice curve we need to know the direction of line before and after.
		// Hence, on long lines we actually wait for another point beyond it to come back from
		// mousemoved before we draw this curve.
		
		// So for "prior curve" to be calc'ed we need 4 points 
		// 	A, B, C, D (we are on D now, A is 3 points in the past.)
		// and 3 lines:
		//  pre-line (from points A to B), 
		//  this line (from points B to C), (we call it "this" because if it was not yet, it's the only one we can draw for sure.) 
		//  post-line (from points C to D) (even through D point is 'current' we don't know how we can draw it yet)
		//
		// Well, actually, we don't need to *know* the point A, just the vector A->B

		// Again, we can only derive curve between points positionInStroke-1 and positionInStroke
		// Thus, since we can only draw a line if we know one point ahead of it, we need to shift our focus one point ahead.
		positionInStroke += 1
		// Let's hope the code that calls us knows we do that and does not call us with positionInStroke = index of last point.
		
		var Cpoint = new Point(stroke.x[positionInStroke-1], stroke.y[positionInStroke-1])
			, Dpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke])
			, CDvector = Cpoint.getVectorToPoint(Dpoint)
		// Again, we have a chance here to draw only PREVIOUS line segment - BC
		
		// So, let's start with BC curve.
		// if there is only 2 points in stroke array (C, D), we don't have "history" long enough to have point B, let alone point A.
		// so positionInStroke should start with 2, ie
		// we are here when there are at least 3 points in stroke array.
		var Bpoint = new Point(stroke.x[positionInStroke-2], stroke.y[positionInStroke-2])
		, BCvector = Bpoint.getVectorToPoint(Cpoint)
		, ABvector
		
		if ( BCvector.getLength() > lineCurveThreshold ){
			// Yey! Pretty curves, here we come!
			if(positionInStroke > 2) {
				ABvector = (new Point(stroke.x[positionInStroke-3], stroke.y[positionInStroke-3])).getVectorToPoint(Bpoint)
			} else {
				ABvector = new Vector(0,0)
			}
			var halflen = BCvector.getLength() / 2
			, BtoCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(halflen)
			, CtoCP2vector = (new Vector(BCvector.x + CDvector.x, BCvector.y + CDvector.y)).reverse().resizeTo(halflen)
			, BtoCP2vector = new Vector(BCvector.x + CtoCP2vector.x, BCvector.y + CtoCP2vector.y)

			// returing curve for BC segment
			// all coords are vectors against Bpoint
			return [
				'c' // bezier curve
				, BtoCP1vector.x
				, BtoCP1vector.y
				, BtoCP2vector.x
				, BtoCP2vector.y
				, BCvector.x
				, BCvector.y
			]
		} else {
			return [
				'l' // line
				, BCvector.x
				, BCvector.y
			]
		}
	}
	, lastSegmentToCurve = function(stroke, lineCurveThreshold){
		'use strict'
		// Here we tidy up things left unfinished
		
		// What's left unfinished there is the curve between the last points
		// in the stroke
		// We can also be called when there is only one point in the stroke (meaning, the 
		// stroke was just a dot), in which case there is nothing for us to do.

		// So for "this curve" to be calc'ed we need 3 points 
		// 	A, B, C
		// and 2 lines:
		//  pre-line (from points A to B), 
		//  this line (from points B to C) 
		// Well, actually, we don't need to *know* the point A, just the vector A->B
		// so, we really need points B, C and AB vector.
		var positionInStroke = stroke.x.length - 1
		
		// there must be at least 2 points in the stroke.for us to work. Hope calling code checks for that.
		var Cpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke])
		, Bpoint = new Point(stroke.x[positionInStroke-1], stroke.y[positionInStroke-1])
		, BCvector = Bpoint.getVectorToPoint(Cpoint)
		
		if (positionInStroke > 1 && BCvector.getLength() > lineCurveThreshold){
			// we have at least 3 elems in stroke
			var ABvector = (new Point(stroke.x[positionInStroke-2], stroke.y[positionInStroke-2])).getVectorToPoint(Bpoint)
			, BtoCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(BCvector.getLength() / 2)
			return [
				'c' // bezier curve
				, BtoCP1vector.x
				, BtoCP1vector.y
				, BCvector.x // CP2 is same as Cpoint
				, BCvector.y // CP2 is same as Cpoint
				, BCvector.x
				, BCvector.y
			]
		} else {
			// Since there is no AB leg, there is no curve to draw. This is just line
			return [
				'l' // simple line
				, BCvector.x
				, BCvector.y
			]
		}
	}
	, addstroke = function(stroke, shiftx, shifty){
		'use strict'
		// we combine strokes data into string like this:
		// 'M 53 7 l 1 2 c 3 4 -5 -6 5 -6'
		// see SVG documentation for Path element's 'd' argument.
		var lines = [
			'M' // move to
			, x = (stroke.x[0] - shiftx)
			, y = (stroke.y[0] - shifty)
		]
		// processing all points but first and last. 
		, i = 1 // index zero item in there is STARTING point. we already extracted it.
		, l = stroke.x.length - 1 // this is a trick. We are leaving last point coordinates for separate processing.
		, lineCurveThreshold = 1
		
		for(; i < l; i++){
			lines.push.apply(lines, segmentToCurve(stroke, i, lineCurveThreshold))
		}
		if (l > 0 /* effectively more than 1, since we "-1" above */){
			lines.push.apply(lines, lastSegmentToCurve(stroke, i, lineCurveThreshold))
		}
		
		return lines.join(' ')
	}
	, compressstrokes = function(data){
		'use strict'
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
		
		answer.push(
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+ 
			sizex.toString() +
			'" height="'+ 
			sizey.toString() +
			'">'
		)
		answer.push(
			'<style type="text/css"><![CDATA[.f {fill:none;stroke:#000000;stroke-width:2}]]></style>'
		)

		for(i = 0; i < l; i++){
			stroke = data[i]
			answer.push('<path class="f" d="'+ addstroke(stroke, shiftx, shifty) +'"/>')
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