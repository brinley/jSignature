<?php
require_once '../core/jSignature_Tools_Base30.php';

class jSignature_Tools_Tests extends PHPUnit_Framework_TestCase
{
    public function testBase30_to_Native_Leg() {

        $converter = new jSignature_Tools_Base30();

        $expected = array(236, 233, 231, 229, 226, 224, 222, 216, 213, 210, 205, 202, 200, 198, 195, 193, 191, 189, 186, 183, 180, 178, 174, 172);

        $leg = '7UZ32232263353223222333242';
        $actual = $converter->uncompressstrokeleg($leg);

        $this->assertEquals(
            $expected
            , $actual
        );
    }

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

        $actual = $converter->uncompressstrokes($signature);

        $this->assertEquals(
            $expected
            , $actual
        );
    }

}
?>