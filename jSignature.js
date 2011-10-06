/**
 * jSignature v1.2
 * 
 * Copyright (c) 2010 Brinley Ang 
 * http://www.unbolt.net
 * 
 * Released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
 */
(function($) {
	var methods = {
		init : function( options ) {
			if(!document.createElement('canvas').getContext)
			{
				alert("Oops, you need a newer browser to use this.")
				return
			}

			var settings = {
				'width' : 'max'
				,'height' : 'max'
				,'sizeRatio': 4
				,'color' : '#000'
				,'lineWidth' : 0
				,'bgcolor': '#fff'
			}

			return this.each(function() {

				if (options) {
					$.extend(settings, options)
				}

				var $parent = $(this)
				
				if (settings.width == 'max' || settings.height == 'max'){
					// this maxes the sig widget within the parent container.
					var pw = $parent.width()
						, ph = $parent.height()
					if ((pw / settings.sizeRatio) > ph) {
						ph = parseInt(pw/settings.sizeRatio)
					}
					settings.width = pw
					settings.height = ph					
				}
				
				if (settings.lineWidth == 0){
					var width = parseInt(settings.width)
						, lineWidth = parseInt( width / 300 ) // +1 pixel for every extra 300px of width.
					if (lineWidth < 2) {
					    settings.lineWidth = 2 
					} else {
						settings.lineWidth = lineWidth
					}
				}
				
				
				var canvas = $("<canvas width='"+settings.width+"' height='"+settings.height+"'></canvas>").appendTo($parent)[0]

				canvas.onselectstart = function(e){e.preventDefault(); e.stopPropagation(); return false;}
				
				// Check for compatibility
				if (canvas && canvas.getContext) {
					var ctx = canvas.getContext("2d")
					
					ctx.lineWidth = settings.lineWidth
					ctx.strokeStyle = ctx.fillStyle = settings.color
					ctx.lineCap = ctx.lineJoin = "round"

					ctx.shadowColor = settings.color
					ctx.shadowOffsetX = settings.lineWidth * 0.5
					ctx.shadowOffsetY = settings.lineWidth * -0.6
					ctx.shadowBlur = 0

//					// Add custom class if defined
//					if(settings.cssclass && $.trim(settings.cssclass)!="") {
//						$(canvas).addClass(settings.cssclass)
//					}
					
					var timer = null
						// shifts - adjustment values in viewport pixels drived from position of canvas on the page
						, shiftX
						, shiftY
						, dotShift = parseInt( settings.lineWidth / 2 )
						, x , y
						, drawEnd = function() {
							clearTimeout(timer)
							x = null
							y = null
						}
						, setXY = function(e) {
							e.preventDefault()
							var first = (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e)
							// All devices i tried report correct coordinates in pageX,Y
							// Android Chrome 2.3.x, 3.1, 3.2., Opera Mobile,  safari iOS 4.x,
							// Windows: Chrome, FF, IE9, Safari
							// None of that scroll shift calc vs screenXY other sigs do is needed.
							var newx = first.pageX + shiftX
								, newy = first.pageY + shiftY
							if (newx == x && newy == y){
								// ignore
							} else {
								// kick done drawing timer down the line
								clearTimeout(timer)
								timer = setTimeout(
									drawEnd
									, 750 // no moving = done with the stroke.
								)
								x = newx
								y = newy
							}
						}
						, drawStart = function(e) {
							setXY(e)
							ctx.fillRect(x - dotShift, y - dotShift, settings.lineWidth, settings.lineWidth)
						}
						, drawMove = function(e) {
							if (x != null && y != null) {
								ctx.beginPath()
								ctx.moveTo(x, y)
								setXY(e)
								ctx.lineTo(x, y)
								ctx.stroke()
								ctx.closePath()
							}
						}
						, setStartValues = function(){
							var tos = $(canvas).offset()
							shiftX = tos.left * -1
							shiftY = tos.top * -1
						}

					canvas.ontouchstart = function(e) {
						canvas.onmousedown = null
						setStartValues()
						canvas.ontouchstart = drawStart
						canvas.ontouchend = drawEnd
						canvas.ontouchmove = drawMove
						drawStart(e)
					}
					canvas.onmousedown = function(e) {
						canvas.ontouchstart = null
						setStartValues()
						canvas.onmousedown = drawStart
						canvas.onmouseup = drawEnd
						canvas.onmousemove = drawMove
						drawStart(e)
					}
				}
			})
		},
		clear : function( ) {
			var canvas=$(this).children("canvas")
			var ctx=canvas[0].getContext("2d")
			var color=ctx.strokeStyle
			var lineWidth=ctx.lineWidth
			var w = $(canvas).attr("width")
			canvas.attr("width",0).attr("width",w)
			ctx.strokeStyle=color
			ctx.lineWidth=lineWidth
			ctx.beginPath()
			return $(this)
		},
		getData : function( ) { 
			var canvas=$(this).children("canvas")
			if(canvas.length) return canvas[0].toDataURL()
			else return
		}
//		importData : function( dataurl ) {
//			var img=new Image()
//			var cv=$(this).children("canvas")[0]
//			img.src=dataurl
//			img.onload=function() {
//				var dw=(img.width<cv.width)?img.width:cv.width
//				var dh=(img.height<cv.height)?img.height:cv.height
//				cv.getContext("2d").drawImage(img,0,0,dw,dh)
//			}
//		}
	}
	
	$.fn.jSignature = function(method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ))
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments )
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.jSignature' )
		}    
	}
})(jQuery)
