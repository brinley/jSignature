/**
 * jSignature v1.1a
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
				alert("Oops, you need a newer browser to use this.");
				return;
			}

			var settings = {
				'width' : '250',
				'height' : '150',
				'color' : '#000',
				'lineWidth' : 1,
				'bgcolor': '#fff'
			};

			return this.each(function() {
				if (options) {
					$.extend(settings, options);
				}

				var canvas = $("<canvas width='"+settings.width+"' height='"+settings.height+"'></canvas>").appendTo($(this))[0];
				// Check for compatibility
				if (canvas && canvas.getContext) {
					var ctx = canvas.getContext("2d");
					ctx.lineWidth=settings.lineWidth;
					ctx.strokeStyle = ctx.fillStyle = settings.color;
					
					// Add custom class if defined
					if(settings.cssclass&&$.trim(settings.cssclass)!="") {
						$(canvas).addClass(settings.cssclass);
					}
					var x;
					var y;
					var hasMoved;

					canvas.ontouchstart = canvas.onmousedown = function(e) {
						ctx.beginPath();
						hasMoved=false;
						var first = (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e);
						x = first.clientX - $(this).offset().left + $(window).scrollLeft();
						y = first.clientY - $(this).offset().top + $(window).scrollTop();
						ctx.moveTo(x, y);
					}

					canvas.ontouchend = canvas.onmouseup = function(e) {
						if(!hasMoved)
						{
							ctx.fillRect(x, y, (settings.lineWidth<2?2:settings.lineWidth), (settings.lineWidth<2?2:settings.lineWidth));
						}
						x = null;
						y = null;
						ctx.closePath();
					}

					canvas.onmousemove = canvas.ontouchmove = function(e) {
						if (x == null || y == null) {
							return;
						}
						hasMoved=true;
						if(e.changedTouches&&e.changedTouches.length>0) {
							var first = e.changedTouches[0];
							x = first.pageX;
							y = first.pageY;
						}
						else {
							x = e.clientX;
							y = e.clientY;
						}
						x -= $(this).offset().left - $(window).scrollLeft();
						y -= $(this).offset().top - $(window).scrollTop();
						ctx.lineTo(x, y);
						ctx.stroke();
						ctx.moveTo(x, y);
					}
					
				}
			});
		},
		clear : function( ) {
			var canvas=$(this).children("canvas");
			var ctx=canvas[0].getContext("2d");
			var color=ctx.strokeStyle;
			var lineWidth=ctx.lineWidth;
			var w = $(canvas).attr("width");
			canvas.attr("width",0).attr("width",w);
			ctx.strokeStyle=color;
			ctx.lineWidth=lineWidth;
			ctx.beginPath();
			return $(this);
		},
		getData : function( ) { 
			var canvas=$(this).children("canvas");
			if(canvas.length) return canvas[0].toDataURL();
			else return;
		},
		importData : function( dataurl ) {
			var img=new Image();
			var cv=$(this).children("canvas")[0];
			img.src=dataurl;
			img.onload=function() {
				var dw=(img.width<cv.width)?img.width:cv.width;
				var dh=(img.height<cv.height)?img.height:cv.height;
				cv.getContext("2d").drawImage(img,0,0,dw,dh);
			}
		}
	};
	
	$.fn.jSignature = function(method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.jSignature' );
		}    
	};
})(jQuery);
