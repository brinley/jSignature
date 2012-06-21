<?php
/** @license
jSignature v2 SVG export plugin.
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
class jSignature_Tools_SVG {

	/**
	 * This is a simple, points-to-lines (not curves) renderer. 
	 * Keeping it around so we can activate it from time to time and see
	 * if smoothing logic is off much.
	 * @public
	 * @function
	 * @param $stroke {Array} Hash representing a single stroke, with two properties 
	 * 		('x' => array(), 'y' => array()) where 'array()' is an array of 
	 *		coordinates for that axis.
	 * @returns {String} Like so 'M 53 7 l 1 2 3 4 -5 -6 5 -6' which is in format of SVG's Path.d argument.
	 */
	private function addstroke($stroke, $shiftx, $shifty){
		$lastx = $stroke['x'][0];
		$lasty = $stroke['y'][0];
		$i;
		$l = sizeof( $stroke['x'] );
		$answer = array('M', round( $lastx - $shiftx, 2) , round( $lasty - $shifty, 2), 'l');
		
		if ($l == 1){
			// meaning this was just a DOT, not a stroke.
			// instead of creating a circle, we just create a short line "up and to the right" :)
			array_push($answer, 1);
			array_push($answer, -1);
		} else {
			for($i = 1; $i < $l; $i++){
				array_push( $answer, $stroke['x'][$i] - $lastx);
				array_push( $answer, $stroke['y'][$i] - $lasty);
				$lastx = $stroke['x'][$i];
				$lasty = $stroke['y'][$i];
			}
		}
		return implode(' ', $answer);
	} 
	
	public function NativeToSVG($data){
		$answer = array(
			'<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
			, '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
        );
		$i;
		$l = sizeof( $data );
		$stroke;
		$xlimits = array();
		$ylimits = array();
		$sizex = 0;
		$sizey = 0;
		$shiftx = 0;
		$shifty = 0;
		$minx;
		$maxx;
		$miny;
		$maxy;
		$padding = 1;
		
		if($l !== 0){
			for($i = 0; $i < $l; $i++){
				$stroke = $data[$i];
				$xlimits = array_merge($xlimits, $stroke['x']);
				$ylimits = array_merge($ylimits, $stroke['y']);
			}

			$minx = min($xlimits) - $padding;
			$maxx = max($xlimits) + $padding;
			$miny = min($ylimits) - $padding;
			$maxy = max($ylimits) + $padding;
			$shiftx = $minx < 0 ? 0 : $minx;
			$shifty = $miny < 0 ? 0 : $miny;
			$sizex = $maxx - $minx;
			$sizey = $maxy - $miny;
		}
		
		array_push( $answer, 
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'.
			$sizex.
			'" height="'.
			$sizey.
			'">'
		);
		
//		// This is a nice idea: use style declaration on top, and mark the lines with 'class="f"'
//		// thus saving space in svg... 
//		// alas, many SVG renderers don't understand "class" and render the $strokes in default "fill = black, no $stroke" style. Ugh!!!
//		// TODO: Rewrite ImageMagic / GraphicsMagic, InkScape, http://svg.codeplex.com/ to support style + class. until then
//		// , we hardcode the stroke style within the path. 
//		$answer.push(
//			'<style type="text/css"><![C$data[.f {fill:none;$stroke:#000000;$stroke-width:2;$stroke-linecap:round;$stroke-linejoin:round}]]></style>'
//		)

		for($i = 0; $i < $l; $i++){
			array_push( 
				$answer
				, '<path fill="none" stroke="#000000" stroke-width="2"'.
				  ' stroke-linecap="round" stroke-linejoin="round" d="'.
				  $this->addstroke($data[$i], $shiftx, $shifty) . '"/>'
			);
		}

		array_push($answer, '</svg>');
		return implode('', $answer);
	}
}
?>