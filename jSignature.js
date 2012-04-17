/** @preserve ==============
jSignature v2
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
Copyright (c) 2010 Brinley Ang http://www.unbolt.net
MIT License <http://www.opensource.org/licenses/mit-license.php> 
==============
*/
(function() {
	
var Initializer = function($){
	
	/// Returns front, back and "decor" colors derived from element (as jQuery obj)
	function getColors($e){
		var tmp
		, undef
		, frontcolor = $e.css('color')
		, backcolor
		
		while(backcolor === undef && $e !== undef){
			try{
				tmp = $e.css('background-color')				
			} catch (ex) {
				tmp = 'transparent'
			}
			if (tmp !== 'transparent' && tmp !== 'rgba(0, 0, 0, 0)'){
				backcolor = tmp
			}
			try{
				$e = $e.parent()
				if ($e[0] === document){
					$e = undef
				}
			} catch (ec) {
				$e = undef
			}
		}

		var rgbaregex = /rgb[a]*\((\d+),\s*(\d+),\s*(\d+)/ // modern browsers
		, hexregex = /#([AaBbCcDdEeFf\d]{2})([AaBbCcDdEeFf\d]{2})([AaBbCcDdEeFf\d]{2})/ // IE 8 and less.
		, frontcolorcomponents

		// Decomposing Front color into R, G, B ints
		tmp = undef
		tmp = frontcolor.match(rgbaregex)
		if (tmp){
			frontcolorcomponents = {'r':parseInt(tmp[1],10),'g':parseInt(tmp[2],10),'b':parseInt(tmp[3],10)}
		} else {
			tmp = frontcolor.match(hexregex)
			if (tmp) {
				frontcolorcomponents = {'r':parseInt(tmp[1],16),'g':parseInt(tmp[2],16),'b':parseInt(tmp[3],16)}
			}
		}
//		if(!frontcolorcomponents){
//			frontcolorcomponents = {'r':255,'g':255,'b':255}
//		}

		var backcolorcomponents
		// Decomposing back color into R, G, B ints
		if(!backcolor){
			// HIghly unlikely since this means that no background styling was applied to any element from here to top of dom.
			// we'll pick up back color from front color
			if(frontcolorcomponents){
				if (Math.max.apply(null, [frontcolorcomponents.r, frontcolorcomponents.g, frontcolorcomponents.b]) > 127){
					backcolorcomponents = {'r':0,'g':0,'b':0}
				} else {
					backcolorcomponents = {'r':255,'g':255,'b':255}
				}
			} else {
				// arg!!! front color is in format we don't understand (hsl, named colors)
				// Let's just go with white background.
				backcolorcomponents = {'r':255,'g':255,'b':255}
			}
		} else {
			tmp = undef
			tmp = backcolor.match(rgbaregex)
			if (tmp){
				backcolorcomponents = {'r':parseInt(tmp[1],10),'g':parseInt(tmp[2],10),'b':parseInt(tmp[3],10)}
			} else {
				tmp = backcolor.match(hexregex)
				if (tmp) {
					backcolorcomponents = {'r':parseInt(tmp[1],16),'g':parseInt(tmp[2],16),'b':parseInt(tmp[3],16)}
				}
			}
//			if(!backcolorcomponents){
//				backcolorcomponents = {'r':0,'g':0,'b':0}
//			}
		}
		
		// Deriving Decor color
		// THis is LAZY!!!! Better way would be to use HSL and adjust luminocity. However, that could be an overkill. 
		
		var toRGBfn = function(o){return 'rgb(' + [o.r, o.g, o.b].join(', ') + ')'} 
		, decorcolorcomponents
		, frontcolorbrightness
		, adjusted
		
		if (frontcolorcomponents && backcolorcomponents){
			var backcolorbrightness = Math.max.apply(null, [frontcolorcomponents.r, frontcolorcomponents.g, frontcolorcomponents.b])
			
			frontcolorbrightness = Math.max.apply(null, [backcolorcomponents.r, backcolorcomponents.g, backcolorcomponents.b])
			adjusted = Math.round(frontcolorbrightness + (-1 * (frontcolorbrightness - backcolorbrightness) * 0.75)) // "dimming" the difference between pen and back.
			decorcolorcomponents = {'r':adjusted,'g':adjusted,'b':adjusted} // always shade of gray
		} else if (frontcolorcomponents) {
			frontcolorbrightness = Math.max.apply(null, [frontcolorcomponents.r, frontcolorcomponents.g, frontcolorcomponents.b])
			var polarity = +1
			if (frontcolorbrightness > 127){
				polarity = -1
			}
			// shifting by 25% (64 points on RGB scale)
			adjusted = Math.round(frontcolorbrightness + (polarity * 96)) // "dimming" the pen's color by 75% to get decor color.
			decorcolorcomponents = {'r':adjusted,'g':adjusted,'b':adjusted} // always shade of gray
		} else {
			decorcolorcomponents = {'r':191,'g':191,'b':191} // always shade of gray
		}

		return {
			'color': frontcolor
			, 'background-color': backcolorcomponents? toRGBfn(backcolorcomponents) : backcolor
			, 'decor-color': toRGBfn(decorcolorcomponents)
		}
	}
	
	function Vector(x,y){
		this.x = x
		this.y = y
		this.reverse = function(){
			this.x = this.x * -1
			this.y = this.y * -1
			return this
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
	
	/*
	 * About data structure:
	 * We don't store / deal with "pictures" this signature capture code captures "vectors"
	 * 
	 * We don't store bitmaps. We store "strokes" as arrays of arrays. (Actually, arrays of objects containing arrays of coordinates.
	 * 
	 * Stroke = mousedown + mousemoved * n (+ mouseup but we don't record that as that was the "end / lack of movement" indicator)
	 * 
	 * Vectors = not classical vectors where numbers indicated shift relative last position. Our vectors are actually coordinates against top left of canvas.
	 * 			we could calc the classical vectors, but keeping the the actual coordinates allows us (through Math.max / min) 
	 * 			to calc the size of resulting drawing very quickly. If we want classical vectors later, we can always get them in backend code.
	 * 
	 * So, the data structure:
	 * 
	 * var data = [
	 * 	{ // stroke starts
	 * 		x : [101, 98, 57, 43] // x points
	 * 		, y : [1, 23, 65, 87] // y points
	 * 	} // stroke ends
	 * 	, { // stroke starts
	 * 		x : [55, 56, 57, 58] // x points
	 * 		, y : [101, 97, 54, 4] // y points
	 * 	} // stroke ends
	 * 	, { // stroke consisting of just a dot
	 * 		x : [53] // x points
	 * 		, y : [151] // y points
	 * 	} // stroke ends
	 * ]
	 * 
	 * we don't care or store stroke width (it's canvas-size-relative), color, shadow values. These can be added / changed on whim post-capture.
	 * 
	 */
	function DataEngine(storageObject){
		this._storageObject = storageObject // we expect this to be an instance of Array
		
		this.startStrokeFn = function(){}
		this.addToStrokeFn = function(){}
		this.endStrokeFn = function(){}
	
		this.inStroke = false
		
		this._lastPoint = null
		this._stroke = null
		this.startStroke = function(point){
			if(point && typeof(point.x) == "number" && typeof(point.y) == "number"){
				this._stroke = {'x':[point.x], 'y':[point.y]}
				this._storageObject.push(this._stroke)
				this._lastPoint = point
				this.inStroke = true
				// 'this' does not work same inside setTimeout(
				var stroke = this._stroke 
				, fn = this.startStrokeFn
				setTimeout(
					// some IE's don't support passing args per setTimeout API. Have to create closure every time instead.
					function() {fn(stroke)}
					, 3
				)
				return point
			} else {
				return null
			}
		}
		// that "5" at the very end of this if is important to explain.
		// we do NOT render links between two captured points (in the middle of the stroke) if the distance is shorter than that number.
		// not only do we NOT render it, we also do NOT capture (add) these intermediate points to storage.
		// when clustering of these is too tight, it produces noise on the line, which, because of smoothing, makes lines too curvy.
		// maybe, later, we can expose this as a configurable setting of some sort.
		this.addToStroke = function(point){
			if (this.inStroke && 
				typeof(point.x) === "number" && 
				typeof(point.y) === "number" &&
				// calculates absolute shift in diagonal pixels away from original point
				(Math.abs(point.x - this._lastPoint.x) + Math.abs(point.y - this._lastPoint.y)) > 2
			){
				var positionInStroke = this._stroke.x.length
				this._stroke.x.push(point.x)
				this._stroke.y.push(point.y)
				this._lastPoint = point
				
				var stroke = this._stroke
				, fn = this.addToStrokeFn
				setTimeout(
					// some IE's don't support passing args per setTimeout API. Have to create closure every time instead.
					function() {fn(stroke, positionInStroke)}
					, 3
				)
				return point
			} else {
				return null
			}
		}
		this.endStroke = function(){
			var c = this.inStroke
			this.inStroke = false
			this._lastPoint = null
			if (c){
				var fn = this.endStrokeFn // 'this' does not work same inside setTimeout(
					, stroke = this._stroke
				setTimeout(
					// some IE's don't support passing args per setTimeout API. Have to create closure every time instead.
					function(){ fn(stroke) }
					, 3
				)
				return true
			} else {
				return null
			}
		}
	}
	
	var apinamespace = 'jSignature'
	, initBase = function(options) {
		
		var settings = {
			'width' : 'max'
			,'height' : 'max'
			,'sizeRatio': 4 // only used when width or height = 'max'
			,'color' : '#000'
			,'background-color': '#fff'
			,'decor-color': '#eee'
			,'lineWidth' : 0
		}
		
		var $parent = $(this)
		$.extend(settings, getColors($parent))
		if (options) {
			$.extend(settings, options)
		}
		
		if (settings.width == 'max' || settings.height == 'max'){
			// this maxes the sig widget within the parent container.
			var pw = $parent.width()
				, ph = $parent.height()
			if ((pw / settings.sizeRatio) > ph) {
				ph = parseInt(pw/settings.sizeRatio, 10)
			}
			settings.width = pw
			settings.height = ph					
		}
		
		if (settings.lineWidth == 0){
			var width = parseInt(settings.width, 10)
				, lineWidth = parseInt( width / 300 , 10) // +1 pixel for every extra 300px of width.
			if (lineWidth < 2) {
			    settings.lineWidth = 2 
			} else {
				settings.lineWidth = lineWidth
			}
		}
	
		var small_screen = parseInt(settings.width, 10) < 1000? true : false
		
		var $canvas = $parent.find('canvas')
			, canvas
		if (!$canvas.length){
			canvas = document.createElement('canvas')
			canvas.width = settings.width
			canvas.height = settings.height
			$canvas = $(canvas)
			$canvas.appendTo($parent)
		} else {
			canvas = $canvas.get(0)
		}
		$canvas.addClass(apinamespace)
		
		var canvas_emulator = false
			, zoom = 1
		if (!canvas.getContext){
			if (typeof FlashCanvas !== "undefined") {
				// FlashCanvas uses flash which has this annoying habit of NOT scaling with page zoom. It matches pixel-to-pixel to screen instead.
				// all x, y coords need to be scaled from pagezoom to Flash window.
				// since we are targeting ONLY IE 7, 8 with FlashCanvas, we will test the zoom only the IE8, IE7 way
				if (window && window.screen && window.screen.deviceXDPI && window.screen.logicalXDPI){
					zoom = window.screen.deviceXDPI / window.screen.logicalXDPI
				}
				canvas = FlashCanvas.initElement(canvas)
				// We effectively abuse the brokenness of FlashCanvas and force the flash rendering surface to
				// occupy larger pixel dimensions than the wrapping, scaled up DIV and Canvas elems.
				if (zoom != 1){
					$canvas.children('object').get(0).resize(Math.ceil(canvas.width * zoom), Math.ceil(canvas.height * zoom))
				}
				canvas_emulator = true
			} else if ( typeof G_vmlCanvasManager != 'undefined'){
				canvas = G_vmlCanvasManager.initElement(canvas)
				canvas_emulator = true
			}
		}
	
		if (!canvas.getContext){
			throw new Error("Canvas element does not support 2d context. "+apinamespace+" cannot proceed.")			
		}
	
		// normally select preventer would be short, but
		// vml-based Canvas emulator on IE does NOT provide value for Event. Hence this convoluted line.
		canvas.onselectstart = function(e){if(e && e.preventDefault){e.preventDefault()}; if(e && e.stopPropagation){e.stopPropagation()}; return false;}
	
		// Add custom class if defined
		if(settings.cssclass && $.trim(settings.cssclass) != "") {
			$canvas.addClass(settings.cssclass)
		}
	
		var ctx = canvas.getContext("2d")
		, dataEngine, undef
		, strokeStartCallback, strokeAddCallback, strokeEndCallback
		// shifts - adjustment values in viewport pixels drived from position of canvas on the page
		, shiftX
		, shiftY
		, dotShift = Math.round(settings.lineWidth / 2) * -1 // only for single dots at start. this draws fat ones "centered"
		, basicDot = function(x, y){
			ctx.fillStyle = settings.color
			ctx.fillRect(x + dotShift, y + dotShift, settings.lineWidth, settings.lineWidth)
			ctx.fillStyle = settings['background-color']
		}
		, basicLine = function(startx, starty, endx, endy){
			ctx.beginPath()
			ctx.moveTo(startx, starty)
			ctx.lineTo(endx, endy)
			ctx.stroke()
		}
		, basicCurve = function(startx, starty, endx, endy, cp1x, cp1y, cp2x, cp2y){
			ctx.beginPath()
			ctx.moveTo(startx, starty)
			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy)
			ctx.stroke()
		}
		, resetCanvas = function(data){
			var cw = canvas.width
			, ch = canvas.height
			
			ctx.clearRect(0, 0, cw * zoom + 30, ch * zoom + 30)

			ctx.shadowColor = ctx.fillStyle = settings['background-color']
			if (canvas_emulator){
				// FLashCanvas on IE9 fills with Black by default, covering up the parent div's background
				// hence we refill 
				ctx.fillRect(0,0,cw * zoom + 30, ch * zoom + 30)
			}

			ctx.lineWidth = Math.ceil(parseInt(settings.lineWidth, 10) * zoom)
			ctx.lineCap = ctx.lineJoin = "round"
			
			// signature line
			var lineoffset = Math.round( ch / 5 )
			ctx.strokeStyle = settings['decor-color']
			ctx.shadowOffsetX = 0
			ctx.shadowOffsetY = 0
			basicLine(lineoffset * 1.5, ch - lineoffset, cw - (lineoffset * 1.5), ch - lineoffset)
			
			ctx.strokeStyle = settings.color
	
			if (!canvas_emulator && !small_screen){
				ctx.shadowColor = ctx.strokeStyle
				ctx.shadowOffsetX = ctx.lineWidth * 0.5
				ctx.shadowOffsetY = ctx.lineWidth * -0.6
				ctx.shadowBlur = 0					
			}
			
			if (data === undef) { data = [] }
			else {
				// we have data to render
				var numofstrokes = data.length
				, stroke
				, numofpoints
				
				for (var i = 0; i < numofstrokes; i++){
					stroke = data[i]
					numofpoints = stroke.x.length
					strokeStartCallback(stroke)
					for(var j = 1; j < numofpoints; j++){
						strokeAddCallback(stroke, j)
					}
					strokeEndCallback(stroke)
				}
			}
			
			dataEngine = new DataEngine(data)
			dataEngine.startStrokeFn = strokeStartCallback
			dataEngine.addToStrokeFn = strokeAddCallback
			dataEngine.endStrokeFn = strokeEndCallback
			
			$canvas.data(apinamespace+'.data', data)
			
			// import filters will be passing this back as indication of "we rendered"
			return true
		}
		, timer = null // used for endign stroke when no movement occurs for some time.
		, clearIdeeTimeout = function(){
			clearTimeout(timer)
		}
		, drawEndHandler = function(e) {
			try {
				e.preventDefault()						
			} catch (ex) {
			}
			clearIdeeTimeout()
			dataEngine.endStroke()
		}
		, resetIdleTimeout = function(){
			// global scope:
			// timer, drawEndHandler
			clearTimeout(timer)
			timer = setTimeout(
				drawEndHandler
				, 750 // no moving for this many ms? = done with the stroke.
			)
		}
		, setStartValues = function(){
			var tos = $canvas.offset()
			shiftX = tos.left * -1
			shiftY = tos.top * -1
		}
		, fatFingerCompensation = 0 // in pixels. Usually a x5 multiple of line width enabled auto on touch devices.
		, getPointFromEvent = function(e) {
			var firstEvent = (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e)
			// All devices i tried report correct coordinates in pageX,Y
			// Android Chrome 2.3.x, 3.1, 3.2., Opera Mobile,  safari iOS 4.x,
			// Windows: Chrome, FF, IE9, Safari
			// None of that scroll shift calc vs screenXY other sigs do is needed.
			// The only strange case is FlashCanvas. It uses Flash, which does not scale with the page zoom. * zoom is for that.
			// ... oh, yeah, the "fatFinger.." is for tablets so that people see what they draw.
			return new Point(
				Math.round((firstEvent.pageX + shiftX) * zoom)
				, Math.round((firstEvent.pageY + shiftY) * zoom) + fatFingerCompensation
			)
		}
		, drawStartHandler = function(e) {
			e.preventDefault()
			// for performance we cache the offsets
			// we recalc these only at the beginning the stroke			
			setStartValues() 
			dataEngine.startStroke( getPointFromEvent(e) )
			resetIdleTimeout()
		}
		, drawMoveHandler = function(e) {
			e.preventDefault()
			if (!dataEngine.inStroke){
				return
			} else {
				var acceptedPoint = dataEngine.addToStroke(getPointFromEvent(e))
				if (acceptedPoint){
					resetIdleTimeout()
				}
			}
		}
		, lineCurveThreshold = settings.lineWidth * 3
		/*
		, getDataStats = function(){
			var strokecnt = strokes.length
				, stroke
				, pointid
				, pointcnt
				, x, y
				, maxX = Number.NEGATIVE_INFINITY
				, maxY = Number.NEGATIVE_INFINITY
				, minX = Number.POSITIVE_INFINITY
				, minY = Number.POSITIVE_INFINITY
			for(strokeid = 0; strokeid < strokecnt; strokeid++){
				stroke = strokes[strokeid]
				pointcnt = stroke.length
				// basicDot(stroke.x[0], stroke.y[0])
				for(pointid = 0; pointid < pointcnt; pointid++){
					x = stroke.x[pointid]
					y = stroke.y[pointid]
					if (x > maxX){
						maxX = x
					} else if (x < minX) {
						minX = x
					}
					if (y > maxY){
						maxY = y
					} else if (y < minY) {
						minY = y
					}
				}
			}
			return {'maxX': maxX, 'minX': minX, 'maxY': maxY, 'minY': minY}
		}
		*/
		
		strokeStartCallback = function(stroke) {
			basicDot(stroke.x[0], stroke.y[0])
		}
		strokeAddCallback = function(stroke, positionInStroke){
			// Because we are funky this way, here we draw TWO curves.
			// 1. POSSIBLY "this line" - spanning from point right before us, to this latest point.
			// 2. POSSIBLY "prior curve" - spanning from "latest point" to the one before it.
			
			// Why you ask?
			// long lines (ones with many pixels between them) do not look good when they are part of a large curvy stroke.
			// You know, the jaggedy crocodile spine instead of a pretty, smooth curve. Yuck!
			// We want to approximate pretty curves in-place of those ugly lines.
			// To approximate a very nice curve we need to know the direction of line before and after.
			// Hence, on long lines we actually wait for another point beyond it to come back from
			// mousemoved before we draw this curve.
			
			// So for "prior curve" to be calc'ed we need 4 points 
			// 	A, B, C, D
			// and 3 lines:
			//  pre-line (from points A to B), 
			//  this line (from points B to C), (we call it "this" because if it was not yet, it's the only one we can draw for sure.) 
			//  post-line (from points C to D) (even through it's 'current' line we don't know if we can draw it yet)
			//
			// Well, actually, we don't need to *know* the point A, just the vector A->B
			// 
			// 'Dpoint' we get in the args is the D point.
			var Cpoint = new Point(stroke.x[positionInStroke-1], stroke.y[positionInStroke-1])
				, Dpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke])
				, CDvector = Cpoint.getVectorToPoint(Dpoint)
				
			// Again, we have a chance here to draw TWO things:
			//  BC Curve (only if it's long, because if it was short, it was drawn by previous callback) and 
			//  CD Line (only if it's short)
			
			// So, let's start with BC curve.
			// if there is only 2 points in stroke array, we don't have "history" long enough to have point B, let alone point A.
			// Falling through to drawing line CD is proper, as that's the only line we have points for.
			if(positionInStroke > 1) {
				// we are here when there are at least 3 points in stroke array.
				var Bpoint = new Point(stroke.x[positionInStroke-2], stroke.y[positionInStroke-2])
					, BCvector = Bpoint.getVectorToPoint(Cpoint)
					, ABvector
				if(BCvector.getLength() > lineCurveThreshold){
					// Yey! Pretty curves, here we come!
					if(positionInStroke > 2) {
						// we are here when at least 4 points in stroke array.
						ABvector = (new Point(stroke.x[positionInStroke-3], stroke.y[positionInStroke-3])).getVectorToPoint(Bpoint)
					} else {
						ABvector = new Vector(0,0)
					}
					var halflen = BCvector.getLength() / 2
						, BCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(halflen)
						, CCP2vector = (new Vector(BCvector.x + CDvector.x, BCvector.y + CDvector.y)).reverse().resizeTo(halflen)
					basicCurve(
						Bpoint.x
						, Bpoint.y
						, Cpoint.x
						, Cpoint.y
						, Bpoint.x + BCP1vector.x
						, Bpoint.y + BCP1vector.y
						, Cpoint.x + CCP2vector.x
						, Cpoint.y + CCP2vector.y
					)
				}
			}
			if(CDvector.getLength() <= lineCurveThreshold){
				basicLine(
					Cpoint.x
					, Cpoint.y
					, Dpoint.x
					, Dpoint.y
				)
			}
		}
		strokeEndCallback = function(stroke){
			// Here we tidy up things left unfinished in last strokeAddCallback run.
			
			// What's POTENTIALLY left unfinished there is the curve between the last points
			// in the stroke, if the len of that line is more than lineCurveThreshold
			// If the last line was shorter than lineCurveThreshold, it was drawn there, and there
			// is nothing for us here to do.
			// We can also be called when there is only one point in the stroke (meaning, the 
			// stroke was just a dot), in which case, again, there is nothing for us to do.
						
			// So for "this curve" to be calc'ed we need 3 points 
			// 	A, B, C
			// and 2 lines:
			//  pre-line (from points A to B), 
			//  this line (from points B to C) 
			// Well, actually, we don't need to *know* the point A, just the vector A->B
			// so, we really need points B, C and AB vector.
			var positionInStroke = stroke.x.length - 1
			
			if (positionInStroke > 0){
				// there are at least 2 points in the stroke.we are in business.
				var Cpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke])
					, Bpoint = new Point(stroke.x[positionInStroke-1], stroke.y[positionInStroke-1])
					, BCvector = Bpoint.getVectorToPoint(Cpoint)
					, ABvector
				if (BCvector.getLength() > lineCurveThreshold){
					// yep. This one was left undrawn in prior callback. Have to draw it now.
					if (positionInStroke > 1){
						// we have at least 3 elems in stroke
						ABvector = (new Point(stroke.x[positionInStroke-2], stroke.y[positionInStroke-2])).getVectorToPoint(Bpoint)
						var BCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(BCvector.getLength() / 2)
						basicCurve(
							Bpoint.x
							, Bpoint.y
							, Cpoint.x
							, Cpoint.y
							, Bpoint.x + BCP1vector.x
							, Bpoint.y + BCP1vector.y
							, Cpoint.x
							, Cpoint.y
						)
					} else {
						// Since there is no AB leg, there is no curve to draw. This line is still "long" but no curve.
						basicLine(
							Bpoint.x
							, Bpoint.y
							, Cpoint.x
							, Cpoint.y
						)
					}
					
				}
			}
		}
		
		if (canvas_emulator){
			$canvas.bind('mousedown.'+apinamespace, function(e){
				$canvas.unbind('mousedown.'+apinamespace)
				drawStartHandler(e)
				$canvas.bind('mousemove.'+apinamespace, drawMoveHandler)
				$canvas.bind('mouseup.'+apinamespace, drawEndHandler)
				$canvas.bind('mousedown.'+apinamespace, drawStartHandler)
			})
		} else {
			canvas.ontouchstart = function(e) {
				canvas.onmousedown = null
				fatFingerCompensation = (settings.lineWidth*-5 < -15) ? settings.lineWidth * -5 : -15 // ngative to shift up.
				drawStartHandler(e)
				canvas.ontouchend = drawEndHandler
				canvas.ontouchstart = drawStartHandler
				canvas.ontouchmove = drawMoveHandler
			}
			canvas.onmousedown = function(e) {
				canvas.ontouchstart = null
				drawStartHandler(e)
				canvas.onmousedown = drawStartHandler
				canvas.onmouseup = drawEndHandler
				canvas.onmousemove = drawMoveHandler
			}
		}
		
		/*
		 * API EXPOSED THROUGH jQuery.data() on Canvas element.
		 */
		//  $canvas.data('signature.data', data) is set every time we reset canvas. See resetCanvas
		// $canvas.data(apinamespace+'.settings', settings)
		$canvas.data(apinamespace+'.reset', resetCanvas)
		
		// on mouseout + mouseup canvas did not know that mouseUP fired. Continued to draw despite mouse UP.
		$(document).bind('mouseup.'+apinamespace, drawEndHandler)
		// it is bettr than
		// $canvas.bind('mouseout', drawEndHandler)
		// because we don't want to break the stroke where user accidentally gets ouside and wants to get back in quickly.
		
		resetCanvas(settings.data)
	} // end of initBase
	, exportplugins = {
		'default':function(data){return this.toDataURL()}
		, 'native':function(data){return data}
		, 'image':function(data){
			/*this = canvas elem */
			var imagestring = this.toDataURL()
			
			if (typeof imagestring === 'string' && 
				imagestring.length > 4 && 
				imagestring.slice(0,5) === 'data:' &&
				imagestring.indexOf(',') !== -1){
				
				var splitterpos = imagestring.indexOf(',')

				return [
			        imagestring.slice(5, splitterpos)
			        , imagestring.substr(splitterpos + 1)
		        ]
			}
			return []
		}
	}
	, importplugins = {
		'native':function(data, formattype, rerendercallable){
			// we expect data as Array of objects of arrays here - whatever 'default' EXPORT plugin spits out.
			// returning Truthy to indicate we are good, all updated.
			rerendercallable( data )
		}
	}
	//These are exposed as methods under $obj.jSignature('methodname', *args)
	, methods = {
		init : function( options ) {
			return this.each( function() {initBase.call(this, options)} ) // end Each
		}
		, reset : function( data ) {
			this.find('canvas.'+apinamespace)
			.add(this.filter('canvas.'+apinamespace))
			.data(apinamespace+'.reset')( data )
			return this
		}
		, addPlugin : function(pluginType, pluginName, callable){
			var plugins = {'export':exportplugins, 'import':importplugins}
			if (plugins.hasOwnProperty(pluginType)){
				plugins[pluginType][pluginName] = callable
			}
			return this
		}
		, listPlugins : function(pluginType){
			var plugins = {'export':exportplugins, 'import':importplugins}
			, answer = []
			if (plugins.hasOwnProperty(pluginType)){
				var o = plugins[pluginType]
				for (var k in o){
					if (o.hasOwnProperty(k)){
						answer.push(k)
					}
				}
			}
			return answer
		}
		, getData : function( formattype ) {
			var undef, $canvas=this.find('canvas.'+apinamespace).add(this.filter('canvas.'+apinamespace))
			if (formattype === undef) formattype = 'default'
			if ($canvas.length !== 0 && exportplugins.hasOwnProperty(formattype)){				
				return exportplugins[formattype].call(
					$canvas.get(0) // canvas dom elem
					, $canvas.data(apinamespace+'.data') // raw signature data as array of objects of arrays
				)
			}
		}
		, setData : function(data, formattype) {
			var undef, $canvas=this.find('canvas.'+apinamespace).add(this.filter('canvas.'+apinamespace))
			if (formattype === undef && typeof data === 'string') {
				formattype = data.split(',')[0]
				if (formattype === data) return
			}
			if ($canvas.length !== 0 && importplugins.hasOwnProperty(formattype)){
				importplugins[formattype].call(
					$canvas.get(0) // canvas dom elem
					, data
					, formattype
					, $canvas.data(apinamespace+'.reset')
				)
			}
			return this
		}
	} // end of methods dclaration.
	
	$.fn[apinamespace] = function(method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ))
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments )
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.' + apinamespace )
		}
	}
	
	return $
} // end of Initializer

////Because plugins are minified together with jSignature, multiple defines per (minified) file blow up and dont make sense
////Need to revisit this later.

//if ( typeof define === "function" && define.amd != null) {
//	// AMD-loader compatible resource declaration
//	// you need to call this one with jQuery as argument.
//	define(function(){return Initializer} )
//} else {
	// global-polluting outcome.
	if(this.jQuery == null) {throw new Error("We need jQuery for some of the functionality. jQuery is not detected. Failing to initialize...")}
	Initializer(this.jQuery)
//}

})(typeof window !== 'undefined'? window : this)
