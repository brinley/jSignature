/** @preserve
jSignature v2
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
Copyright (c) 2010 Brinley Ang http://www.unbolt.net
MIT License <http://www.opensource.org/licenses/mit-license.php> 

*/
;(function() {
	
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
			return new this.constructor( 
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
		this.data = storageObject // we expect this to be an instance of Array

		this.changed = function(){}
		
		this.startStrokeFn = function(){}
		this.addToStrokeFn = function(){}
		this.endStrokeFn = function(){}
	
		this.inStroke = false
		
		this._lastPoint = null
		this._stroke = null
		this.startStroke = function(point){
			if(point && typeof(point.x) == "number" && typeof(point.y) == "number"){
				this._stroke = {'x':[point.x], 'y':[point.y]}
				this.data.push(this._stroke)
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
				(Math.abs(point.x - this._lastPoint.x) + Math.abs(point.y - this._lastPoint.y)) > 4
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
				
				var changedfn = this.changed
				setTimeout(
					// some IE's don't support passing args per setTimeout API. Have to create closure every time instead.
					changedfn
					, 3
				)
				return true
			} else {
				return null
			}
		}
	}
	
	var apinamespace = 'jSignature'
	, boundevents = {}
	, initBase = function(options) {
		
		var pubsubtokens = {}
		
		var settings = {
			'width' : 'ratio'
			,'height' : 'ratio'
			,'sizeRatio': 4 // only used when height = 'ratio'
			,'color' : '#000'
			,'background-color': '#fff'
			,'decor-color': '#eee'
			,'lineWidth' : 0
			,'minFatFingerCompensation' : -10
		}
		
		var $parent = $(this)
		$.extend(settings, getColors($parent))
		if (options) {
			$.extend(settings, options)
		}
		
		// We cannot work with circular dependency
		if (settings.width === settings.height && settings.height === 'ratio') {
        	settings.width = '100%'
        }

		var canvas = document.createElement('canvas')
		, $canvas = $(canvas)

		$canvas.css(
			'margin'
			, 0
		).css(
			'padding'
			, 0
		).css(
			'border'
			, 'none'
		).css(
			'height'
			, settings.height === 'ratio' || !settings.height ? 1 : settings.height.toString(10)
		).css(
			'width'
			, settings.width === 'ratio' || !settings.width ? 1 : settings.width.toString(10)
		)

		$canvas.appendTo($parent)

		// we could not do this until canvas is rendered (appended to DOM)
		if (settings.height === 'ratio') {
			$canvas.css(
				'height'
				, Math.round( $canvas.width() / settings.sizeRatio )
			)
        } else if (settings.width === 'ratio') {
			$canvas.css(
				'width'
				, Math.round( $canvas.height() * settings.sizeRatio )
			)
        }

		$canvas.addClass(apinamespace)

		// canvas's drawing area resolution is independent from canvas's size.
		// pixels are just scaled up or down when internal resolution does not
		// match external size. So...

		canvas.width = $canvas.width()
		canvas.height = $canvas.height()
		
		var canvas_emulator = (function(){
			if (canvas.getContext){
				return false
			} else if (typeof FlashCanvas !== "undefined") {
				canvas = FlashCanvas.initElement(canvas)
				
				var zoom = 1
				// FlashCanvas uses flash which has this annoying habit of NOT scaling with page zoom. 
				// It matches pixel-to-pixel to screen instead.
				// Since we are targeting ONLY IE 7, 8 with FlashCanvas, we will test the zoom only the IE8, IE7 way
				if (window && window.screen && window.screen.deviceXDPI && window.screen.logicalXDPI){
					zoom = window.screen.deviceXDPI * 1.0 / window.screen.logicalXDPI
				}
				if (zoom !== 1){
					// We effectively abuse the brokenness of FlashCanvas and force the flash rendering surface to
					// occupy larger pixel dimensions than the wrapping, scaled up DIV and Canvas elems.
					$canvas.children('object').get(0).resize(Math.ceil(canvas.width * zoom), Math.ceil(canvas.height * zoom))
					// And by applying "scale" transformation we can talk "browser pixels" to FlashCanvas
					// and have it translate the "browser pixels" to "screen pixels"
					canvas.getContext('2d').scale(zoom, zoom)
					// Note to self: don't reuse Canvas element. Repeated "scale" are cumulative.
				}
				return true
			} else {
				throw new Error("Canvas element does not support 2d context. "+apinamespace+" cannot proceed.")			
			}
		})();

		settings.lineWidth = (function(defaultLineWidth, canvasWidth){
			if (defaultLineWidth === 0){
				return Math.max(
					Math.round(canvasWidth / 400) /*+1 pixel for every extra 300px of width.*/
					, 2 /* minimum line width */
				) 
			} else {
				return defaultLineWidth
			}
		})(settings.lineWidth, canvas.width);
	
		var small_screen = canvas.width < 600 ? true : false
		
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
			
			ctx.clearRect(0, 0, cw + 30, ch + 30)

			ctx.shadowColor = ctx.fillStyle = settings['background-color']
			if (canvas_emulator){
				// FLashCanvas fills with Black by default, covering up the parent div's background
				// hence we refill 
				ctx.fillRect(0,0,cw + 30, ch + 30)
			}

			ctx.lineWidth = Math.ceil(parseInt(settings.lineWidth, 10))
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
			dataEngine.changed = function(){ $parent.trigger('change') }
			
			$canvas.data(apinamespace+'.data', data)
			settings.data = data
			$canvas.data(apinamespace+'.settings', settings)
			
			// import filters will be passing this back as indication of "we rendered"
			return true
		}
		, timer = null // used for endign stroke when no movement occurs for some time.
		, clearIdleTimeout = function(){
			clearTimeout(timer)
		}
		, drawEndHandler = function(e) {
			try {
				e.preventDefault()						
			} catch (ex) {
			}
			clearIdleTimeout()
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
			// ... oh, yeah, the "fatFinger.." is for tablets so that people see what they draw.
			return new Point(
				Math.round(firstEvent.pageX + shiftX)
				, Math.round(firstEvent.pageY + shiftY) + fatFingerCompensation
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
			// 	A, B, C, D (we are on D now, A is 3 points in the past.)
			// and 3 lines:
			//  pre-line (from points A to B), 
			//  this line (from points B to C), (we call it "this" because if it was not yet, it's the only one we can draw for sure.) 
			//  post-line (from points C to D) (even through D point is 'current' we don't know how we can draw it yet)
			//
			// Well, actually, we don't need to *know* the point A, just the vector A->B
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

					var minlenfraction = 0.05
					, maxlen = BCvector.getLength() * 0.35
					, ABCangle = BCvector.angleTo(ABvector.reverse())
					, BCDangle = CDvector.angleTo(BCvector.reverse())
					, BCP1vector = new Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).resizeTo(
						Math.max(minlenfraction, ABCangle) * maxlen
					)
					, CCP2vector = (new Vector(BCvector.x + CDvector.x, BCvector.y + CDvector.y)).reverse().resizeTo(
						Math.max(minlenfraction, BCDangle) * maxlen
					)
					
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
				canvas.onmouseup = null
				canvas.onmousemove = null
				fatFingerCompensation = (
					settings.minFatFingerCompensation && 
					settings.lineWidth * -3 > settings.minFatFingerCompensation
				) ? settings.lineWidth * -3 : settings.minFatFingerCompensation
				drawStartHandler(e)
				canvas.ontouchend = drawEndHandler
				canvas.ontouchstart = drawStartHandler
				canvas.ontouchmove = drawMoveHandler
			}
			canvas.onmousedown = function(e) {
				canvas.ontouchstart = null
				canvas.ontouchend = null
				canvas.ontouchmove = null
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

		// If we have proportional width, we sign up to events broadcasting "window resized" and checking if
		// parent's width changed. If so, we (1) extract settings + data from current signature pad,
		// (2) remove signature pad from parent, and (3) reinit new signature pad at new size with same settings, (rescaled) data.
		if ((function(settingsWidth){
				return ( settingsWidth === 'ratio' || settingsWidth.split('')[settingsWidth.length - 1] === '%' )
			})(settings.width.toString(10))
		) {

			pubsubtokens[apinamespace + '.parentresized'] = $.fn[apinamespace]('PubSub').subscribe(
				apinamespace + '.parentresized'
				, (function(pubsubtokens, apinamespace, $parent, originalParentWidth, sizeRatio){
					'use strict'
	
					return function(){
						'use strict'
						var w = $parent.width()
						if (w !== originalParentWidth) {
						
							// UNsubscribing this particular instance of signature pad only.
							// there is a separate `pubsubtokens` per each instance of signature pad 
							var pubsub = $parent[apinamespace]('PubSub')
							for (var key in pubsubtokens){
								if (pubsubtokens.hasOwnProperty(key)) {
									pubsub.unsubscribe(pubsubtokens[key])
									delete pubsubtokens[key]               	
	                            }
							}
	
							// $parent sits in upper closue because it's part of upper self-exec'ing function's args.
							// we support separate parent for each instance of signature pad.
							// in other words, you can still have more than one signature pad per page.
							var $canvas = $parent.find('canvas')
							, settings = $canvas.data(apinamespace+'.settings')
							$canvas.remove()
							
							// scale data to new signature pad size
							settings.data = (function(data, scale){
								var newData = []
								var o, i, l, j, m, stroke
								for ( i = 0, l = data.length; i < l; i++) {
                                	stroke = data[i]
                                	
                                	o = {'x':[],'y':[]}
                                	
                                	for ( j = 0, m = stroke.x.length; j < m; j++) {
                                    	o.x.push(stroke.x[j] * scale)
                                    	o.y.push(stroke.y[j] * scale)
                                    }
                                
                                	newData.push(o)
                                }
								return newData
							})(
								settings.data
								, w * 1.0 / originalParentWidth
							)
							
							$parent[apinamespace](settings)
				        }
					}
				})(
					pubsubtokens
					, apinamespace
					, $parent
					, $parent.width()
					, canvas.width * 1.0 / canvas.height
				)
			)
        }

		// we have one (aka `singleton`) `boundevents' per whole jSignature. 
		if (! boundevents['windowresize']) {
			boundevents['windowresize'] = true
			
			;(function(apinamespace, $, window){
				'use strict'

				var resizetimer
				, runner = function(){
					$.fn[apinamespace]('PubSub').publish(
						apinamespace + '.parentresized'
					)
				}

				$(window).bind('resize.'+apinamespace, function(){
					if (resizetimer) {
		                clearTimeout(resizetimer)
					}
					resizetimer = setTimeout( 
						runner
						, 700
					)
				})
			})(apinamespace, $, window)
		} 

		// on mouseout + mouseup canvas did not know that mouseUP fired. Continued to draw despite mouse UP.
		// it is bettr than
		// $canvas.bind('mouseout', drawEndHandler)
		// because we don't want to break the stroke where user accidentally gets ouside and wants to get back in quickly.
		pubsubtokens[apinamespace + '.windowmouseup'] = $.fn[apinamespace]('PubSub').subscribe(
			apinamespace + '.windowmouseup'
			, drawEndHandler
		)
		
		if (! boundevents['windowmouseup']) {
			boundevents['windowmouseup'] = true

			;(function(apinamespace, $, window){
				'use strict'
				$(window).bind('mouseup.'+apinamespace, function(e){
					$.fn[apinamespace]('PubSub').publish(
						apinamespace + '.windowmouseup'
						, e
					)
				})
			})(apinamespace, $, window)
		}
		
		resetCanvas(settings.data)
	} // end of initBase
	
	var exportplugins = {
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

	function _renderImageOnCanvas( data, formattype, rerendercallable ) {
		'use strict'
		// #1. Do NOT rely on this. No worky on IE 
		//   (url max len + lack of base64 decoder + possibly other issues)
		// #2. This does NOT affect what is captured as "signature" as far as vector data is 
		// concerned. This is treated same as "signature line" - i.e. completely ignored
		// the only time you see imported image data exported is if you export as image.

		// we do NOT call rerendercallable here (unlike in other import plugins)
		// because importing image does absolutely nothing to the underlying vector data storage
		// This could be a way to "import" old signatures stored as images
		// This could also be a way to import extra decor into signature area.
		
		var img = new Image()
		// this = Canvas DOM elem. Not jQuery object. Not Canvas's parent div.
		, c = this

		img.onload = function() {
			var ctx = c.getContext("2d").drawImage( 
				img, 0, 0
				, ( img.width < c.width) ? img.width : c.width
				, ( img.height < c.height) ? img.height : c.height
			)
		}

		img.src = 'data:' + formattype + ',' + data
	}

	var importplugins = {
		'native':function(data, formattype, rerendercallable){
			// we expect data as Array of objects of arrays here - whatever 'default' EXPORT plugin spits out.
			// returning Truthy to indicate we are good, all updated.
			rerendercallable( data )
		}
		, 'image': _renderImageOnCanvas
		, 'image/png;base64': _renderImageOnCanvas
		, 'image/jpeg;base64': _renderImageOnCanvas
		, 'image/jpg;base64': _renderImageOnCanvas
	}

	function _clearDrawingArea( data ) {
		this.find('canvas.'+apinamespace)
		.add(this.filter('canvas.'+apinamespace))
		.data(apinamespace+'.reset')( data )
		return this
	}

	function _setDrawingData( data, formattype ) {
		var undef

		if (formattype === undef && typeof data === 'string' && data.substr(0,5) === 'data:') {
			formattype = data.slice(5).split(',')[0]
			// 5 chars of "data:" + mimetype len + 1 "," char = all skipped.
			data = data.slice(6 + formattype.length) 
			if (formattype === data) return
		}

		var $canvas = this.find('canvas.'+apinamespace).add(this.filter('canvas.'+apinamespace))

		if (!importplugins.hasOwnProperty(formattype)){
			throw new Error(apinamespace + " is unable to find import plugin with for format '"+ String(formattype) +"'")
		} else if ($canvas.length !== 0){
			importplugins[formattype].call(
				$canvas[0]
				, data
				, formattype
				, $canvas.data(apinamespace+'.reset')
			)
		}

		return this
	}

	var PubSubInstance = new (function(){
	    'use strict'
	    /*  @preserve 
	    -----------------------------------------------------------------------------------------------
	    PubSub
	    2012 (c) ddotsenko@willowsystems.com
	    based on Peter Higgins (dante@dojotoolkit.org)
	    Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.
	    Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
	    http://dojofoundation.org/license for more information.
	    -----------------------------------------------------------------------------------------------
	    */
	    this.topics = {};
	    /**
	     * Allows caller to emit an event and pass arguments to event listeners.
	     * @public
	     * @function
	     * @param topic {String} Name of the channel on which to voice this event
	     * @param **arguments Any number of arguments you want to pass to the listeners of this event.
	     */
	    this.publish = function(topic, arg1, arg2, etc) {
	        'use strict'
	        if (this.topics[topic]) {
	            var currentTopic = this.topics[topic]
	            , args = Array.prototype.slice.call(arguments, 1)
	            
	            for (var i = 0, l = currentTopic.length; i < l; i++) {
	                currentTopic[i].apply(null, args);
	            }
	        }
	    };
	    /**
	     * Allows listener code to subscribe to channel and be called when data is available 
	     * @public
	     * @function
	     * @param topic {String} Name of the channel on which to voice this event
	     * @param callback {Function} Executable (function pointer) that will be ran when event is voiced on this channel.
	     * @returns {Object} A token object that cen be used for unsubscribing.  
	     */
	    this.subscribe = function(topic, callback) {
	        'use strict'
	        if (!this.topics[topic]) {
	            this.topics[topic] = [callback];
	        } else {
	            this.topics[topic].push(callback);
	        }
	        return {
	            "topic": topic,
	            "callback": callback
	        };
	    };
	    /**
	     * Allows listener code to unsubscribe from a channel 
	     * @public
	     * @function
	     * @param token {Object} A token object that was returned by `subscribe` method 
	     */
	    this.unsubscribe = function(token) {
	        if (this.topics[token.topic]) {
	            var currentTopic = this.topics[token.topic]
	            
	            for (var i = 0, l = currentTopic.length; i < l; i++) {
	                if (currentTopic[i] === token.callback) {
	                    currentTopic.splice(i, 1)
	                }
	            }
	        }
	    }
	})();
	
	//These are exposed as methods under $obj.jSignature('methodname', *args)
	var methods = {
		'init' : function( options ) {
			return this.each( function() {initBase.call(this, options)} ) // end Each
		}
		, 'getSettings' : function() {
			var undef, $canvas=this.find('canvas.'+apinamespace).add(this.filter('canvas.'+apinamespace))
			return $canvas.data(apinamespace+'.settings')
		}
		// around since v1
		, 'clear' : _clearDrawingArea
		// was mistakenly introduced instead of 'clear' in v2
		, 'reset' : _clearDrawingArea
		, 'addPlugin' : function(pluginType, pluginName, callable){
			var plugins = {'export':exportplugins, 'import':importplugins}
			if (plugins.hasOwnProperty(pluginType)){
				plugins[pluginType][pluginName] = callable
			}
			return this
		}
		, 'listPlugins' : function(pluginType){
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
		, 'getData' : function( formattype ) {
			var undef, $canvas=this.find('canvas.'+apinamespace).add(this.filter('canvas.'+apinamespace))
			if (formattype === undef) formattype = 'default'
			if ($canvas.length !== 0 && exportplugins.hasOwnProperty(formattype)){				
				return exportplugins[formattype].call(
					$canvas.get(0) // canvas dom elem
					, $canvas.data(apinamespace+'.data') // raw signature data as array of objects of arrays
				)
			}
		}
		// around since v1. Took only one arg - data-url-formatted string with (likely png of) signature image
		, 'importData' : _setDrawingData
		// was mistakenly introduced instead of 'importData' in v2
		, 'setData' : _setDrawingData
		, 'PubSub' : function(){return PubSubInstance} 
	} // end of methods declaration.
	
	$.fn[apinamespace] = function(method) {
		'use strict'
		if ( !method || typeof method === 'object' ) {
			return methods.init.apply( this, arguments )
		} else if ( typeof method === 'string' && methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ))
		} else {
			$.error( 'Method ' +  String(method) + ' does not exist on jQuery.' + apinamespace )
		}
	}

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

})(typeof window !== 'undefined'? window : this);
