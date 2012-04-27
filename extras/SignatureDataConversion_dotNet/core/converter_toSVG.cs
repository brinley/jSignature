using System;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;

namespace jSignature.Tools
{
    public static class SVGConverter
    {
        public static string GetPathsSVGFragment(int[][][] data)
            {return GetPathsSVGFragment(data, 0, 0);}
        public static string GetPathsSVGFragment(int[][][] data, int shiftx, int shifty)
        {

            // I was contemplating going the <style> tag + class attr way, but GraphicsMagic and .Net SVG renderer do not support that.
            // hence, reiterating the style with every line
            string pathtemplate = @"
<path style='fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round' d='M {0} l {1}'/>".Replace('\'', '"');
            string coordinatetemplate = "{0} {1}";

            List<string> paths = new List<string>();
            List<string> points;

            foreach (int[][] stroke in data)
            {
                points = new List<string>();
                int len = stroke.Length;
                for (int i = 1; i < len; i++)
		        {
    			    points.Add(String.Format(coordinatetemplate, stroke[i][0], stroke[i][1]));
		        }
                paths.Add(String.Format(
                    pathtemplate
                    , String.Format(coordinatetemplate, stroke[0][0] + shiftx, stroke[0][1] + shifty) // moveto point
                    , String.Join(" ", points.ToArray()) // relative coords for line
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
        { return ToSVG(data, false); }
        public static string ToSVG(int[][][] data, bool smoothing)
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
                , GetPathsSVGFragment(data, limits[0] * -1 + 1, limits[1] * -1 + 1) // multiple path tags
            );
        }
    }
}