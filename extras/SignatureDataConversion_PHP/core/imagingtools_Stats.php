<?php

	class Stats
    {
    	$data = array();
    	$_content_dimensions = 0;
    	
    	$minx = 0;
    	$miny = 0;
    	$maxx = 0;
    	$maxy = 0;
    	
        function _calc_content_dimensions()
        {
            foreach ($this->data as $stroke)
            {
                $lastx = 0;
                $lasty = 0;

                foreach ($stroke as $coordinate)
                {
                    $x = $lastx + $coordinate[0];
                    $y = $lasty + $coordinate[1];

                    if ($x < $minx) $minx = $x;
                    if ($x > $maxx) $maxx = $x;
                    if ($y < $miny) $miny = $y;
                    if ($y > $maxy) $maxy = $y;

                    $lastx = $x;
                    $lasty = $y;
                }
            }
            $this->_content_dimensions = array($minx, $miny, $maxx, $maxy);
        }

        function Stats($data)
        {
            $this->data = $data;
            $this->_calc_content_dimensions();
        }

        /// <summary>
        /// Returns total image's size, including whitespace around content
        /// </summary>
        /// <returns></returns>
        /* function Size
        {
            get { return new int[] { this._content_dimensions[2], this._content_dimensions[3] }; }
        } */

        /// <summary>
        /// Returns the size of the content only, excluding the whitespace around content
        /// This is useful for cropping.
        /// </summary>
        /// <returns></returns>
        /* public int[] ContentSize
        {
            get
            {
                return new int[] { 
                    this._content_dimensions[2] - this._content_dimensions[0] + 1
                    , this._content_dimensions[3] - this._content_dimensions[1] + 1
                };
            }
        } */

        /// <summary>
        /// Returns min upper left coordinate and max lower right coordinate of the content
        /// </summary>
        /// <returns>int[] of form [minx, miny, maxx, maxy], where "min" is upper left point and "max" is lower right point.
        /// </returns>
        /* public int[] ContentLimits
        {
            get
            {
                return this._content_dimensions;
            }
        } *?
    }

?>