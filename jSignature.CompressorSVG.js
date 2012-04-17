/** @license
 * jSignature v2 SVG export plugin.
 *
 * Copyright (c) 2011 Willow Systems Corp http://willow-systems.com
 * 
 * MIT License <http://www.opensource.org/licenses/mit-license.php> 
 */

(function(){
	
	/** 
	 (c) 2012, Vladimir Agafonkin
	 mourner.github.com/simplify-js
	*/
	(function(a,b){function c(a,b){var c=a.x-b.x,d=a.y-b.y;return c*c+d*d}function d(a,b,c){var d=b.x,e=b.y,f=c.x-d,g=c.y-e,h;if(f!==0||g!==0)h=((a.x-d)*f+(a.y-e)*g)/(f*f+g*g),h>1?(d=c.x,e=c.y):h>0&&(d+=f*h,e+=g*h);return f=a.x-d,g=a.y-e,f*f+g*g}function e(a,b){var d,e=a.length,f,g=a[0],h=[g];for(d=1;d<e;d++)f=a[d],c(f,g)>b&&(h.push(f),g=f);return g!==f&&h.push(f),h}function f(a,c){var e=a.length,f=typeof Uint8Array!=b+""?Uint8Array:Array,g=new f(e),h=0,i=e-1,j,k,l,m,n=[],o=[],p=[];g[h]=g[i]=1;while(i){k=0;for(j=h+1;j<i;j++)l=d(a[j],a[h],a[i]),l>k&&(m=j,k=l);k>c&&(g[m]=1,n.push(h),o.push(m),n.push(m),o.push(i)),h=n.pop(),i=o.pop()}for(j=0;j<e;j++)g[j]&&p.push(a[j]);return p}"use strict";var g=typeof exports!=b+""?exports:a;g.simplify=function(a,c,d){var g=c!==b?c*c:1;return d||(a=e(a,g)),a=f(a,g),a}})(this);
	
	
	function Vector(x,y){
		this.x = x
		this.y = y
		this.reverse = function(){
			return new this.__proto__.constructor( 
				this.x * -1
				, this.y * -1
			)
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
		
		/**
		 * Calculates the angle between 'this' vector and another.
		 * @public
		 * @function
		 * @returns {Number} The angle between the two vectors as measured in PI. 
		 */
		this.angleTo = function(vectorB) {
			var divisor = this.getLength() * vectorB.getLength()
			if (divisor === 0) {
				return 0
			} else {
				// JavaScript floating point math is screwed up.
				// because of it, the core of the formula can, on occasion, have values
				// over 1.0 and below -1.0.
				return Math.acos(
					Math.min( 
						Math.max( 
							( this.x * vectorB.x + this.y * vectorB.y ) / divisor
							, -1.0
						)
						, 1.0
					)
				) / Math.PI
			}
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
	
	var round = function(number, position){
		var tmp = Math.pow(10, position)
		return Math.round( number * tmp ) / tmp
	} 
//	/**
//	 * This is a simple, points-to-lines (not curves) renderer. 
//	 * Keeping it around so we can activate it from time to time and see
//	 * if smoothing logic is off much.
//	 * @public
//	 * @function
//	 * @returns {String} Like so "l 1 2 3 5' with stroke as long line chain. 
//	 */
//	, compressstroke = function(stroke, shiftx, shifty){
//		// we combine strokes data into string like this:
//		// 'M 53 7 l 1 2 3 4 -5 -6 5 -6'
//		// see SVG documentation for Path element's 'd' argument.
//		var lastx = stroke.x[0]
//		, lasty = stroke.y[0]
//		, i
//		, l = stroke.x.length
//		, answer = ['M', lastx - shiftx, lasty - shifty, 'l']
//		
//		if (l === 1){
//			// meaning this was just a DOT, not a stroke.
//			// instead of creating a circle, we just create a short line
//			answer.concat(1, -1)
//		} else {
//			for(i = 1; i < l; i++){
//				answer = answer.concat(stroke.x[i] - lastx, stroke.y[i] - lasty)
//				lastx = stroke.x[i]
//				lasty = stroke.y[i]
//			}
//		}
//		return answer.join(' ')
//	} 
	, segmentToCurve = function(stroke, positionInStroke, lineCurveThreshold){
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
			var minlenfraction = 0.1
			, maxlen = BCvector.getLength() * 0.4
			, ABCangle = BCvector.angleTo(ABvector.reverse())
			, BCDangle = CDvector.angleTo(BCvector.reverse())
			, BtoCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(
				Math.max(minlenfraction, ABCangle) * maxlen
			)
			, CtoCP2vector = (new Vector(BCvector.x + CDvector.x, BCvector.y + CDvector.y)).reverse().resizeTo(
				Math.max(minlenfraction, BCDangle) * maxlen
			)
			, BtoCP2vector = new Vector(BCvector.x + CtoCP2vector.x, BCvector.y + CtoCP2vector.y)
			
			var rounding = 4
			// returing curve for BC segment
			// all coords are vectors against Bpoint
			return [
				'c' // bezier curve
				, round( BtoCP1vector.x, rounding )
				, round( BtoCP1vector.y, rounding )
				, round( BtoCP2vector.x, rounding )
				, round( BtoCP2vector.y, rounding )
				, round( BCvector.x, rounding )
				, round( BCvector.y, rounding )
			]
		} else {
			return [
				'l' // line
				, round( BCvector.x, rounding )
				, round( BCvector.y, rounding )
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
			, ABCangle = BCvector.angleTo(ABvector.reverse())
			, minlenfraction = 0.1
			, maxlen = BCvector.getLength() / 2
			, BtoCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(
				Math.max(minlenfraction, ABCangle) * maxlen
			)

			return [
				'c' // bezier curve
				, round( BtoCP1vector.x, 3 )
				, round( BtoCP1vector.y, 3 )
				, round( BCvector.x, 3 ) // CP2 is same as Cpoint
				, round( BCvector.y, 3 ) // CP2 is same as Cpoint
				, round( BCvector.x, 3 )
				, round( BCvector.y, 3 )
			]
		} else {
			// Since there is no AB leg, there is no curve to draw. This is just line
			return [
				'l' // simple line
				, round( BCvector.x, 3 )
				, round( BCvector.y, 3 )
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
	, simplifystroke = function(stroke){
		var d = []
		, newstroke = {'x':[], 'y':[]}
		, i, l
		
		for (i = 0, l = stroke.x.length; i < l; i++){
			d.push({'x':stroke.x[i], 'y':stroke.y[i]})
		}
		d = simplify(d, 0.7, true)
		for (i = 0, l = d.length; i < l; i++){
			newstroke.x.push(d[i].x)
			newstroke.y.push(d[i].y)
		}		
		return newstroke
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
		, simplifieddata = []
		
		if(l !== 0){
			for(i = 0; i < l; i++){
				stroke = simplifystroke( data[i] )
				simplifieddata.push(stroke)
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

//		// This set is accompaniment to "simple line renderer" - compressstroke
//		answer.push(
//			'<style type="text/css"><![CDATA[.t {fill:none;stroke:#FF0000;stroke-width:2}]]></style>'
//		)
//		for(i = 0; i < l; i++){
//			stroke = data[i]
//			// This one is accompaniment to "simple line renderer"
//			answer.push('<path class="t" d="'+ compressstroke(stroke, shiftx, shifty) +'"/>')
//		}

		for(i = 0, l = simplifieddata.length; i < l; i++){
			stroke = simplifieddata[i]
			answer.push('<path class="f" d="'+ addstroke(stroke, shiftx, shifty) + '"/>')
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
	
if(this.jQuery == null) {throw new Error("We need jQuery for some of the functionality. jQuery is not detected. Failing to initialize...")}
Initializer(this.jQuery)

}).call(typeof window !== 'undefined'? window : this)