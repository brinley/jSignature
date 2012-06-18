<?php
function id002_ToSVG_Internal(){

	$stroke = array(
        53 => 7,
        1 => 2,
        3 => 4,
        5 => -6,
        -5 => -6
    );

    $smoothedcurves = "this will not be looked at"
        . "c 0.02 0.04 0.59 1.39 1 2"
        . "c 0.92 1.37 2.28 4.18 3 4"
        . "c 1.13 -0.28 5 -4.48 5 -6"
        . "c 0 -1.52 -5 -6 -5 -6";

    // NON-smoothed (by way of cranking line-curve-threshold way up.)
    for ($i = 1; $i < count($stroke) -1; $i++)
    {
        //System.Diagnostics.Debug.WriteLine("This is elem " + i.ToString());
        /* Assert.AreEqual(
            String.Format("l {0} {1}", stroke[i][0], stroke[i][1])
            , PrivateMethodsAccessorForSVGConverter.TestSegmentToCurve(stroke, i, 1000)
        ); */
    }
    /*Assert.AreEqual(
        String.Format("l {0} {1}", stroke[stroke.Length - 1][0], stroke[stroke.Length - 1][1])
        , PrivateMethodsAccessorForSVGConverter.TestLastSegmentToCurve(stroke, 1000)
    );*/

    // smoothed (by way of lowering line-curve-threshold to 1 pixel).
    for ($i = 1; $i < count($stroke) - 1; $i++)
    {
        /* Assert.AreEqual(
            smoothedcurves[i]
            , PrivateMethodsAccessorForSVGConverter.TestSegmentToCurve(stroke, i, 1)
        ); */
    }
    /* Assert.AreEqual(
        smoothedcurves[stroke.Length - 1]
        , PrivateMethodsAccessorForSVGConverter.TestLastSegmentToCurve(stroke, 1)
    ); */
}

function id003_ToSVG_External()
{
    $data = new Base30Converter()->GetData("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4");

    $actual = new SVGConverter()->ToSVG($data);

    // System.IO.File.WriteAllText(Common.SOURCE_PATH + "\\samples\\reference_svg_smoothed.svg", actual);

    $shouldbe = file_get_contents("samples/reference_svg_smoothed.svg");
    /* Assert.AreEqual(
        shouldbe
        , actual
    ); */
}
?>