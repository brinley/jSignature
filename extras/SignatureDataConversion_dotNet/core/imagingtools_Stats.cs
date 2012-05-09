using System;
using System.Collections.Generic;
using System.Text;

namespace jSignature.Tools
{
    public class Stats
    {
        private int[][][] data;

        private int[] _content_dimensions;
        private void _calc_content_dimensions()
        {
            int x;
            int y;

            int minx = System.Int32.MaxValue;
            int miny = System.Int32.MaxValue;
            int maxx = System.Int32.MinValue;
            int maxy = System.Int32.MinValue;

            foreach (int[][] stroke in this.data)
            {
                int lastx = 0;
                int lasty = 0;

                foreach (int[] coordinate in stroke)
                {
                    x = lastx + coordinate[0];
                    y = lasty + coordinate[1];

                    if (x < minx) minx = x;
                    if (x > maxx) maxx = x;
                    if (y < miny) miny = y;
                    if (y > maxy) maxy = y;

                    lastx = x;
                    lasty = y;
                }
            }
            this._content_dimensions = new int[] { minx, miny, maxx, maxy };
        }

        public Stats(int[][][] data)
        {
            this.data = data;
            _calc_content_dimensions();
        }

        /// <summary>
        /// Returns total image's size, including whitespace around content
        /// </summary>
        /// <returns></returns>
        public int[] Size
        {
            get { return new int[] { this._content_dimensions[2], this._content_dimensions[3] }; }
        }

        /// <summary>
        /// Returns the size of the content only, excluding the whitespace around content
        /// This is useful for cropping.
        /// </summary>
        /// <returns></returns>
        public int[] ContentSize
        {
            get
            {
                return new int[] { 
                    this._content_dimensions[2] - this._content_dimensions[0] + 1
                    , this._content_dimensions[3] - this._content_dimensions[1] + 1
                };
            }
        }

        /// <summary>
        /// Returns min upper left coordinate and max lower right coordinate of the content
        /// </summary>
        /// <returns>int[] of form [minx, miny, maxx, maxy], where "min" is upper left point and "max" is lower right point.
        /// </returns>
        public int[] ContentLimits
        {
            get
            {
                return this._content_dimensions;
            }
        }
    }
}