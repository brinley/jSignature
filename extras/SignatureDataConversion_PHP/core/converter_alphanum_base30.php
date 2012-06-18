<?php
class Base30Converter
{
    /// <summary>
    /// These chars' place numbers correspond to the number they represent.
    /// </summary>
    $ALLCHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX";
    $bitness;
    $MINUS = 'Z';
    $PLUS = 'Y';

    $charmap = array(); // php dictionary?
    $charmap_tail array();

    function Base30Converter(){
        $bitness = count($ALLCHARS) / 2; // will equal 30

        $charmap = array();
        $charmap_tail = array();
        for ($i = 0; $i < $bitness; $i++)
        {
            array_push($charmap,$ALLCHARS[$i]);
            array_push($charmap_tail,$ALLCHARS[$i+$bitness]);
        }
    }

    function FromBase30($data)
    {
        $len = count($data);
        if ($len == 1)
        {
            return $data[0];
        }
        else
        {
            $data = array_reverse($data);
            // now we know that we have at least 2 elems.
            $answer = $data[0] + $data[1] * $bitness;
            for ($i = 2; $i < $len; $i++)
            {
                $answer = $answer + $data[i] * pow($bitness, $i);
            }
            return $answer;
        }
    }

    function DecompressStrokeLeg($data)
    {
        $leg = array();
        $cell = array();

        $polarity = 1;

        foreach ($data as $c)
        {
            if (array_key_exists($c,$charmap_tail)
            {
                // this is a char that indicates continuation of a number that started a earlier number.
                array_push($cell,$charmap_tail[$c]);
            }
            else
            {
                // This is a start of new number (or, in case of + or - an end of previous number)
                // We can now convert the parts we piled up in cell array into an int.
                if (count($cell) != 0) {
				    // yep, we have some number parts in there.
                    array_push($leg,$this->FromBase30($cell) * $polarity);
			    }

                // When i say "we start a new number" I mean it!
                $cell = array_fill(0, count($cell), 0);
                if ($c == $MINUS){
				    $polarity = -1;
			    } else if ($c == $PLUS){
				    $polarity = 1;
			    } else {
				    // now, let's start collecting parts for the new number:
                    array_push($cell,$charmap[$c]);
			    }
            }
        }
        // we will alway have one number stuck in cell array because no "new number starts" follows it.
        array_push($leg,$this->FromBase30($cell) * $polarity);

        return $leg;
    }

    function GetStroke($legX, $legY)
    {
        // Examples of legX, legY: "7UZ32232263353223222333242", "3w546647c9b96646475765444"
        $X = $this->DecompressStrokeLeg($legX);
        $Y = $this->DecompressStrokeLeg($legY);

        $len = count($X);
        if ($len != count($Y)
        {
            echo "Coordinate length for Y side of the stroke does not match the coordinate length of X side of the stroke";
        }

        $l = array();
        for ($i = 0; $i < $len; $i++)
        {
            array_push($l, array(X[i], Y[i]));
        }
        return $l;
    }

    /// <summary>
    /// Returns a .net-specific array of arrays structure representing a single signature stroke
    /// A compressed string like this one: 
    ///  "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"
    /// representing this raw signature data: 
    ///  [{'x':[100,101,104,99,104],'y':[50,52,56,50,44]},{'x':[50,51,48],'y':[100,102,98]}]
    /// turns into this .Net-specific structure (of array or arrays of arrays)
    ///  [[[100,50],[1,2],[3,4],[-5,-6],[5,-6]], [[50,100],[1,2],[-3,-4]]]
    /// </summary>
    /// <param name="data">string of data encoded in base30 format. Ex: "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"</param>
    /// <returns></returns>
    function GetData($data){
        $ss = array();

        $parts = explode("_",$data);
        $len = count($parts) / 2;

        for ($i = 0; $i < $len; $i++)
        {
            array_push($ss,$this->GetStroke(
                $parts[$i * 2]
                , $parts[$i * 2 + 1]
            ));
        }
        return $ss;
    }
}
?>