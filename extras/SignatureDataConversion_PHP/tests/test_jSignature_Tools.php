<?php
/** @license
jSignature v2 SVG export plugin.
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
require_once '../core/jSignature_Tools_Base30.php';
require_once '../core/jSignature_Tools_SVG.php';

class jSignature_Tools_Tests extends PHPUnit_Framework_TestCase
{
    // // method uncompress_stroke_leg is private now. Cannot test without
    // // bending over backwards.
    // public function testBase30_to_Native_Leg() {

    //     $converter = new jSignature_Tools_Base30();

    //     $expected = array(236, 233, 231, 229, 226, 224, 222, 216, 213, 210, 205, 202, 200, 198, 195, 193, 191, 189, 186, 183, 180, 178, 174, 172);

    //     $leg = '7UZ32232263353223222333242';
    //     $actual = $converter->uncompress_stroke_leg($leg);

    //     $this->assertEquals(
    //         $expected
    //         , $actual
    //     );
    // }

    public function testBase30_to_Native_Full() {

        $converter = new jSignature_Tools_Base30();

        $signature = "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4";
        $expected = array(
            array(
                'x'=>array(100,101,104,99,104)
                ,'y'=>array(50,52,56,50,44)
            )
            ,array(
                'x'=>array(50,51,48)
                ,'y'=>array(100,102,98)
            )
        );

        $actual = $converter->Base64ToNative($signature);

        $this->assertEquals(
            $expected
            , $actual
        );
    }

    public function testNative_to_SVG() {

        $converter = new jSignature_Tools_SVG();

        // $base30 = "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4";
        $native = array(
            array(
                'x'=>array(100,101,104,99,104)
                ,'y'=>array(50,52,56,50,44)
            )
            ,array(
                'x'=>array(50,51,48)
                ,'y'=>array(100,102,98)
            )
        );

        $expected = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="58" height="60"><path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 53 7 l 1 2 3 4 -5 -6 5 -6"/><path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 3 57 l 1 2 -3 -4"/></svg>';
        $actual = $converter->NativeToSVG($native);

        $this->assertEquals(
            $expected
            , $actual
        );

    }

    public function testSVG_to_PNG() {

        // this just calls GraphicsMagic / ImageMagic executable directly.
        // it's fricken difficult to get gmagick or imagick DLL on Windows,
        // and I don't intend to bend over backwards to get there.

        // If you want to add imagick, or gmagick based semi-pure-PHP test, you go ahead.

        $input = 'test.svg';
        $expected = 'test.png';
        $actual = 'tmp.png';

        if (file_exists($actual)) {
            unlink($actual); // boy, what a strange way to call "delete file" function.
        }

        $renderer_executable = '\bin\gm\gm.exe'; // GraphicsMagic, Windows.
        $maxsize = 200;

        $command = $renderer_executable.' convert '.$input.' -scale '.$maxsize.'x'.$maxsize.' -render '.$actual ;
        
        exec($command);

        $this->assertFileEquals(
            $expected
            , $actual
        );

    }

}
?>