/**
 * jSignature v2
 *
 * Copyright 2011 Willow Systems Corp
 * http://willow-systems.com
 * 
 * Copyright (c) 2010 Brinley Ang 
 * http://www.unbolt.net
 * 
 * Released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
 */
(function($) { 
var apinamespace = 'jSignature'
	, initBase = function(options) {
		
		var settings = {
				'width' : 'max'
				,'height' : 'max'
				,'sizeRatio': 4 // only used when width or height = 'max'
				,'color' : '#000'
				,'lineWidth' : 0
				,'bgcolor': '#fff'
			}
		if (options) {
			$.extend(settings, options)
		}
		
		var $parent = $(this)
		
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
			if (typeof FlashCanvas != "undefined") {
				// FlashCanvas uses flash which has this annoying habit of NOT scaling with page zoom. It matches pixel-to-pixel to screen instead.
				// all x, y coords need to be scaled from pagezoom to Flash window.
				// since we are targeting ONLY IE with FlashCanvas, we will test the zoom only the IE8, IE7 way
				if (window && window.screen && window.screen.deviceXDPI && window.screen.logicalXDPI){
					zoom = window.screen.deviceXDPI / window.screen.logicalXDPI
				}
				canvas = FlashCanvas.initElement(canvas)
				// We effectively abbuse the brokenness of FlashCanvas and force the flash rendering surface to
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
			alert("Old or broken browser detected. Canvas element does not support 2d context. Signature capture logic cannot proceed.")			
		}

		// normally select preventer would be short, but
		// vml-based Canvas emulator on IE does NOT provide value for Event. Hence this convoluted line.
		canvas.onselectstart = function(e){if(e && e.preventDefault){e.preventDefault()}; if(e && e.stopPropagation){e.stopPropagation()}; return false;}

		// Add custom class if defined
		if(settings.cssclass && $.trim(settings.cssclass) != "") {
			$canvas.addClass(settings.cssclass)
		}

		/*
		 * About data structure:
		 * We don't store / deal with "pictures" this signature capture code captures "vectors"
		 * 
		 * We don't store bitmaps. We store "strokes" as arrays of arrays.
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
		
		var ctx = canvas.getContext("2d")
			, resetCanvas = function(){
				ctx.clearRect(0, 0, canvas.width * zoom + 30, canvas.height * zoom + 30)
				
				ctx.lineWidth = Math.ceil(parseInt(settings.lineWidth, 10) * zoom)
				ctx.strokeStyle = settings.color
				ctx.lineCap = ctx.lineJoin = "round"
				ctx.fillStyle = "rgba(255,255,255,255)"
				ctx.fillRect(0,0,canvas.width * zoom + 30, canvas.height * zoom + 30)
				ctx.fillStyle = "rgba(0,0,0,0)"

				if (!canvas_emulator && !small_screen){
					ctx.shadowColor = ctx.strokeStyle
					ctx.shadowOffsetX = ctx.lineWidth * 0.5
					ctx.shadowOffsetY = ctx.lineWidth * -0.6
					ctx.shadowBlur = 0					
				}
				
				data = []
				$canvas.data(apinamespace+'.data', data)
			}
			, lineCurveThreshold = settings.lineWidth * 3
			, fatFingerCompensation = 0 // in pixels. Usually a x5 multiple of line width enabled auto on touch.
			, data
			, stroke
			, timer = null
			// shifts - adjustment values in viewport pixels drived from position of canvas on the page
			, shiftX
			, shiftY
			, dotShift = Math.round(settings.lineWidth / 2) * -1
			, x , y, vectorx, vectory
			, drawEndBase = function(){
				x = y = null
				vectorx = vectory = 0
			}
			, drawEndHandler = function() {
				clearTimeout(timer)
				drawEndBase()
			}
			, setXY = function(e) {
				e.preventDefault()
				var first = (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e)
				// All devices i tried report correct coordinates in pageX,Y
				// Android Chrome 2.3.x, 3.1, 3.2., Opera Mobile,  safari iOS 4.x,
				// Windows: Chrome, FF, IE9, Safari
				// None of that scroll shift calc vs screenXY other sigs do is needed.
				// The only strange case is FlashCanvas. It uses Flash, which does not scale with the page zoom. * zoom is for that.
				var newx = Math.round((first.pageX + shiftX) * zoom)
					, newy = Math.round((first.pageY + shiftY) * zoom) + fatFingerCompensation
				if (newx === x && newy === y){
					return false
				} else {
					// kick done-drawing timer down the line
					clearTimeout(timer)
					timer = setTimeout(
						drawEndHandler
						, 750 // no moving = done with the stroke.
					)
					x = newx
					y = newy
					return true
				}
			}
			, basicDot = function(x, y){
				ctx.fillStyle = settings.color
				ctx.fillRect(x + dotShift, y + dotShift, settings.lineWidth, settings.lineWidth)
				ctx.fillStyle = 'rgba(0,0,0,0)'					
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
			, polarity = function (e){
				return Math.round(e / Math.abs(e))
			}
			, hypotenuse = function(x, y){
				return Math.round( Math.sqrt( Math.pow(x, 2) + Math.pow(y, 2) ) )
			}
			, getCP1 = function(vectorx, vectory, maxlen){
				var x, y
					, oldvectorlen = hypotenuse(vectorx, vectory)
					, newvectorlen = Math.min( oldvectorlen, maxlen / 2 ) // in besier curve, len of CP1 vector should be up to half the length of whole line, if we want the end of curve to come in at 0 degrees deviation from underlying (smoothed) line.
				
				if (newvectorlen == oldvectorlen){
					// this is optimization for cases when drawing speed accellerates (and next stroke is longer than prior)
					x = vectorx
					y = vectory
				} else if (vectorx === 0 && vectory === 0){
					x = 0
					y = 0
				} else if (vectorx === 0){
					x = 0
					y = newvectorlen * polarity(vectory)
				} else if(vectory === 0){
					x = newvectorlen * polarity(vectorx)
					y = 0
				} else {
					var proportion = Math.abs(vectory / vectorx)
					x = Math.sqrt(Math.pow(newvectorlen, 2) / (1 + Math.pow(proportion, 2)))
					y = proportion * x
					x = x * polarity(vectorx)
					y = y * polarity(vectory)
				}
				return {
					'x': x
					, 'y': y 
				}
			}
			, drawStartBase = function(x, y) {
				basicDot(x, y)
				stroke = {'x':[x], 'y':[y]}
				data.push(stroke)
			}
			, drawStartHandler = function(e) {
				setXY(e)
				drawStartBase(x, y)
			}
			, drawMoveBase = function(startx, starty, endx, endy){
				var newvectorx = endx - startx
					, newvectory = endy - starty
					, new_length = hypotenuse(newvectorx, newvectory)
					// stroke, vectorx, vectory are used from global scope.
					
				stroke.x.push(endx)
				stroke.y.push(endy)

				if (new_length < lineCurveThreshold){
					basicLine(startx, starty, endx, endy)
				} else {
					// here we still use vector x, y of OLD, previous line. From global scope and limit it to run of current line
					var cp = getCP1(vectorx, vectory, new_length)
					basicCurve(
						startx, starty
						, endx, endy
						, startx + cp.x, starty + cp.y
						, startx + newvectorx / 2 , starty + newvectory / 2
					)
				}
				vectorx = newvectorx
				vectory = newvectory
			}
			, drawMoveHandler = function(e) {
				if (x == null || y == null) {
					e.preventDefault()
					return
				}
				var startx = x
					, starty = y
				if( setXY(e) ){
					drawMoveBase(startx, starty, x, y)
				}
			}
			, setStartValues = function(){
				var tos = $(canvas).offset()
				shiftX = tos.left * -1
				shiftY = tos.top * -1
			}
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
			, renderStrokes = function(strokes){
				// used for rendering signature strokes passed from external sources.
				/*
				 * Plan:
				 * - make sure canvas is big enough to draw the sig
				 *   - get image size stats
				 *   - resize canvas if needed (or TODO: scale down the sig)
				 * - Iterate over strokes, render. 
				 */
				resetCanvas()
				if (strokes.length){
					var strokecnt = strokes.length
						, stroke
						, pointid
						, pointcnt
					for(var strokeid = 0; strokeid < strokecnt; strokeid++){
						stroke = strokes[strokeid]
						pointcnt = stroke.x.length
						drawStartBase(stroke.x[0], stroke.y[0])
						for(pointid = 1; pointid < pointcnt; pointid++){
							drawMoveBase(
								stroke.x[pointid-1], stroke.y[pointid-1]
								, stroke.x[pointid], stroke.y[pointid]
							)
						}
						drawEndBase()
					}
					return true
				}
				return false
			}

		if (canvas_emulator){
			$canvas.bind('mousedown.'+apinamespace, function(e){
				setStartValues()
				$canvas.unbind('mousedown.'+apinamespace)
				$canvas.bind('mousedown.'+apinamespace, drawStartHandler)
				$canvas.bind('mouseup.'+apinamespace, drawEndHandler)
				drawStartHandler(e)
				$canvas.bind('mousemove.'+apinamespace, drawMoveHandler)
			})
		} else {
			canvas.ontouchstart = function(e) {
				canvas.onmousedown = null
				fatFingerCompensation = (settings.lineWidth*-5 < -15) ? settings.lineWidth * -5 : -15 // ngative to shift up.
				setStartValues()
				canvas.ontouchstart = drawStartHandler
				canvas.ontouchend = drawEndHandler
				canvas.ontouchmove = drawMoveHandler
				drawStartHandler(e)
			}
			canvas.onmousedown = function(e) {
				canvas.ontouchstart = null
				setStartValues()
				canvas.onmousedown = drawStartHandler
				canvas.onmouseup = drawEndHandler
				canvas.onmousemove = drawMoveHandler
				drawStartHandler(e)
			}
		}
		
		/*
		 * API EXPOSED THROUGH jQuery.data() on Canvas element.
		 */
		//  $canvas.data('signature.data', data) is set every time we reset canvas. See resetCanvas
		$canvas.data(apinamespace+'.settings', settings)
		$canvas.data(apinamespace+'.clear', resetCanvas)
		$canvas.data(apinamespace+'.setData', renderStrokes)
		
		// on mouseout + mouseup canvas did not know that mouseUP fired. Continued to draw despite mouse UP.
		$(document).bind('mouseup.'+apinamespace, drawEndHandler)
		// it is bettr than
		// $canvas.bind('mouseout', drawEndHandler)
		// because we don't want to break the stroke where user accidentally gets ouside and wants to get back in quickly.
		
		if (settings.data && renderStrokes(settings.data)){
			// renderStrokes returns true on succssful render
			// false when fails
		} else {
			resetCanvas()		
		}

		drawEndBase()
	}
	, methods = {
		init : function( options ) {
			return this.each( function() {initBase.call(this, options)} ) // end Each
		}
		, clear : function( ) {
			try {
				this.children('canvas.'+apinamespace).data(apinamespace+'.clear')()
			} catch (ex) {
				// pass
			}
			return this
		}
		, getData : function(formattype) {
			var $canvas=this.children('canvas.'+apinamespace)
			if (!$canvas.length){
				return
			} else {
				switch (formattype) {
					case 'image':
						return $canvas.get(0).toDataURL()
					default:
						return $canvas.data(apinamespace+'.data')
				}
			}
		}
		, setData : function(data, formattype) {
			var $canvas=this.children('canvas.'+apinamespace)
			if (!$canvas.length){
				return this
			} else {
				switch (formattype) {
					case 'example_format_value':
						throw new Error("This format type is not implemented yet.")
						// return this
					default:
						if ( $canvas.data(apinamespace+'.setData')(data) ) {
							return this
						} else {
							throw new Error("Call to "+apinamespace+".setData failed.")
						}
				}
			}
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
})(jQuery)
