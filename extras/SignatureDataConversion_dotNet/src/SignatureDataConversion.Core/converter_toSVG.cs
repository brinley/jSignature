using System;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;

namespace jSignature.Tools
{

    class Vector
    {
        public float x;
        public float y;

        public Vector(int x, int y){
            this.x = x;
            this.y = y;
        }
        public Vector(float x, float y){
            this.x = x;
            this.y = y;
        }

        /// <summary>
        /// Returns NEW Vector object with reversed (multiplied by -1) coords.
        /// </summary>
        /// <returns></returns>
        public Vector Reversed
        {
            get {
                return new Vector(
                    this.x * -1
                    , this.y * -1
                );            
            }
		}

        private float? _length;
        /// <summary>
        /// Applies Pithagoras theorem to find the length of the vector.
        /// </summary>
        /// <returns></returns>
		public float Length
        {
            get 
            {
			    if (this._length == null){
				    this._length = (float)Math.Sqrt( Math.Pow(this.x, 2) + Math.Pow(this.y, 2) );
			    }
			    return (float)this._length;
            }
		}
		
        /// <summary>
        /// Returns either +1 or -1 indicating the polarity of the input number
        /// </summary>
        /// <param name="value">some number</param>
        /// <returns></returns>
		private int polarity(float value){
			return (int)Math.Round(value / Math.Abs(value));
		}

        /// <summary>
        /// Returns NEW Vector object that has same directionality as this one, but with length of the vector scaled to stated size.
        /// </summary>
        /// <param name="length"></param>
        /// <returns></returns>
		public Vector GetResizedTo(float length){
			// proportionally changes x,y such that the hypotenuse (vector length) is = new length
			if (this.x == 0 && this.y == 0){
				return new Vector(0, 0);
			} else if (this.x == 0){
                return new Vector(0, length * polarity(this.y));
			} else if(this.y == 0){
                return new Vector(length * polarity(this.x), 0);
			} else {
				var proportion = Math.Abs(this.y / this.x);
                var _x = Math.Sqrt(Math.Pow(length, 2) / (1 + Math.Pow(proportion, 2)));
                var _y = proportion * _x;
				return new Vector((float)(_x * polarity(this.x)), (float)(_y * polarity(this.y)));
			}
		}
		
		/**
		 * Calculates the angle between 'this' vector and another.
		 * @public
		 * @function
		 * @returns {Number} The angle between the two vectors as measured in PI. 
		 */
		public float AngleTo(Vector vectorB) {
			var divisor = this.Length * vectorB.Length;
			if (divisor == 0) {
				return 0;
			} else {
				// JavaScript floating point math is screwed up.
				// because of it, the core of the formula can, on occasion, have values
				// over 1.0 and below -1.0.
				return (float)( Math.Acos(
					Math.Min( 
						Math.Max( 
							( this.x * vectorB.x + this.y * vectorB.y ) / divisor
							, -1.0
						)
						, 1.0
					)
				) / Math.PI );
			}
		}
	}
	
    public class SVGConverter
    {
        protected static string segmentToCurve(int[][] stroke, int positionInStroke, float lineCurveThreshold)
        {
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
		    positionInStroke += 1;
		    // Let's hope the code that calls us knows we do that and does not call us with positionInStroke = index of last point.

            var CDvector = new Vector(stroke[positionInStroke][0], stroke[positionInStroke][1]);
		    // Again, we have a chance here to draw only PREVIOUS line segment - BC
    		
		    // So, let's start with BC curve.
		    // if there is only 2 points in stroke array (C, D), we don't have "history" long enough to have point B, let alone point A.
		    // so positionInStroke should start with 2, ie
		    // we are here when there are at least 3 points in stroke array.
            var BCvector = new Vector(stroke[positionInStroke - 1][0], stroke[positionInStroke - 1][1]);
		    Vector ABvector;
		    var rounding = 2;

            string curvetemplate = "c {0} {1} {2} {3} {4} {5}";
            string linetemplate = "l {0} {1}";


		    if ( BCvector.Length > lineCurveThreshold ){
			    // Yey! Pretty curves, here we come!
			    if(positionInStroke > 2) {
                    ABvector = new Vector(stroke[positionInStroke - 2][0], stroke[positionInStroke - 2][1]);
			    } else {
				    ABvector = new Vector(0,0);
			    }
			    var minlenfraction = 0.05f;
			    var maxlen = BCvector.Length * 0.35;

			    var ABCangle = BCvector.AngleTo(ABvector.Reversed);
			    var BCDangle = CDvector.AngleTo(BCvector.Reversed);
			    var BtoCP1vector = new Vector(
                        ABvector.x + BCvector.x
                        , ABvector.y + BCvector.y
                    ).GetResizedTo(
				        (float)(Math.Max(minlenfraction, ABCangle) * maxlen)
			        );
			    var CtoCP2vector = new Vector(
                        BCvector.x + CDvector.x
                        , BCvector.y + CDvector.y
                    ).Reversed.GetResizedTo(
				        (float)(Math.Max(minlenfraction, BCDangle) * maxlen)
			        );
			    var BtoCP2vector = new Vector(BCvector.x + CtoCP2vector.x, BCvector.y + CtoCP2vector.y);
    			
			    // returing curve for BC segment
			    // all coords are vectors against Bpoint
			    return String.Format(
                    curvetemplate
				    , Math.Round( BtoCP1vector.x, rounding )
				    , Math.Round( BtoCP1vector.y, rounding )
				    , Math.Round( BtoCP2vector.x, rounding )
				    , Math.Round( BtoCP2vector.y, rounding )
				    , Math.Round( BCvector.x, rounding )
				    , Math.Round( BCvector.y, rounding )
			    );
		    } else {
			    return String.Format(
                    linetemplate
				    , Math.Round( BCvector.x, rounding )
				    , Math.Round( BCvector.y, rounding )
			    );
		    }
	    }

        protected static string lastSegmentToCurve(int[][] stroke, float lineCurveThreshold)
        {
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
		    var positionInStroke = stroke.Length - 1;
    		
		    // there must be at least 2 points in the stroke.for us to work. Hope calling code checks for that.
            var BCvector = new Vector(stroke[positionInStroke][0], stroke[positionInStroke][1]);
		    var rounding = 2;

            string curvetemplate = "c {0} {1} {2} {3} {4} {5}";
            string linetemplate = "l {0} {1}";

		    if (positionInStroke > 1 && BCvector.Length > lineCurveThreshold){
			    // we have at least 3 elems in stroke
                var ABvector = new Vector(stroke[positionInStroke - 1][0], stroke[positionInStroke - 1][1]);
			    var ABCangle = BCvector.AngleTo(ABvector.Reversed);
			    var minlenfraction = 0.05;
			    var maxlen = BCvector.Length * 0.35;
			    var BtoCP1vector = new Vector(
                    ABvector.x + BCvector.x
                    , ABvector.y + BCvector.y
                ).GetResizedTo(
				    (float)(Math.Max(minlenfraction, ABCangle) * maxlen)
			    );
    			
			    return String.Format(
                    curvetemplate
				    , Math.Round( BtoCP1vector.x, rounding )
				    , Math.Round( BtoCP1vector.y, rounding )
				    , Math.Round( BCvector.x, rounding ) // CP2 is same as Cpoint
				    , Math.Round( BCvector.y, rounding ) // CP2 is same as Cpoint
				    , Math.Round( BCvector.x, rounding )
				    , Math.Round( BCvector.y, rounding )
			    );
		    } else {
			    // Since there is no AB leg, there is no curve to draw. This is just line
			    return String.Format(
                    linetemplate
				    , Math.Round( BCvector.x, rounding )
				    , Math.Round( BCvector.y, rounding )
			    );
		    }
	    }
    	
        public static string GetPathsSVGFragment(int[][][] data, int shiftx, int shifty)
        {

            // I was contemplating going the <style> tag + class attr way, but GraphicsMagic and .Net SVG renderer do not support that.
            // hence, reiterating the style with every line
            // {0} {1} {2}:
            // 0 = Move X
            // 1 = Move Y
            // 2 = thereafter movement coordinates, join of curve and line fragments.
            string pathtemplate = @"
<path style='fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round' d='M {0} {1} {2}'/>".Replace('\'', '"');

            float lineCurveThreshold = 0.5f;

            List<string> paths = new List<string>();
            List<string> pathfragments;

            foreach (int[][] stroke in data)
            {
                pathfragments = new List<string>();
                int len = stroke.Length - 1; // we are leaving last point for separate processing
                int i = 1;
                for (; i < len; i++)
                {
                    pathfragments.Add(segmentToCurve(stroke, i, lineCurveThreshold));
                }
                if (len > 0 /* effectively more than 1, since we "-1" above */)
                {
                    pathfragments.Add(lastSegmentToCurve(stroke, lineCurveThreshold));
                }
                paths.Add(String.Format(
                    pathtemplate
                    , stroke[0][0] + shiftx // moveto x, starting point
                    , stroke[0][1] + shifty // moveto y, starting point
                    , String.Join(" ", pathfragments.ToArray()) // pathfragments
                ));
            }
            return String.Join("", paths.ToArray());
        }

        /// <summary>
        /// Produces a string with properly-formatted SVG document, containing all the signature strokes
        /// as simple lines.
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public static string ToSVG(int[][][] data)
        {
            var stats = new jSignature.Tools.Stats(data);
            var contentsize = stats.ContentSize;
            var limits = stats.ContentLimits;

            string outersvgtemplate = @"<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='{0}' height='{1}'>{2}
</svg>".Replace('\'', '"');

            return String.Format(
                outersvgtemplate
                , contentsize[0] // width
                , contentsize[1] // height
                , GetPathsSVGFragment(
                    data
                    , limits[0] * -1 + 1
                    , limits[1] * -1 + 1
                ) 
            );
        }
    }
}