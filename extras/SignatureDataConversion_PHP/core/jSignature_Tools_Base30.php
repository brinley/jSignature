<?php
/** @license
jSignature v2 SVG export plugin.
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
class jSignature_Tools_Base30 {

    // private $acceptedformat = 'image/jsignature;base30';

    private $chunkSeparator = '';
    private $charmap = array(); // {'1':'g','2':'h','3':'i','4':'j','5':'k','6':'l','7':'m','8':'n','9':'o','a':'p','b':'q','c':'r','d':'s','e':'t','f':'u','0':'v'}
    private $charmap_reverse = array(); // will be filled by 'uncompress*" function
    private $allchars = array();
    private $bitness = 0;
    private $minus = '';
    private $plus = '';

    function __construct() {
        global $bitness, $allchars, $charmap, $charmap_reverse, $minus, $plus, $chunkSeparator;

        $allchars = str_split('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX');
        $bitness = sizeof($allchars) / 2;
        $minus = 'Z';
        $plus = 'Y';
        $chunkSeparator = '_';

        for($i = $bitness-1; $i > -1; $i--){
            $charmap[$allchars[$i]] = $allchars[$i+$bitness];
            $charmap_reverse[$allchars[$i+$bitness]] = $allchars[$i];
        }

    }

    /*
    Decompresses half of a stroke in a base30-encoded jSignature image.

    $c = new jSignature_base30();

    $t = array(236, 233, 231, 229, 226, 224, 222, 216, 213, 210, 205, 202, 200, 198, 195, 193, 191, 189, 186, 183, 180, 178, 174, 172);

    $leg = '7UZ32232263353223222333242';

    $a = $c->uncompress_stroke_leg($leg);

    $t == $a
    */
    private function uncompress_stroke_leg($datastring){
        global $charmap, $charmap_reverse, $bitness, $minus, $plus;

        // we convert half-stroke (only 'x' series or only 'y' series of numbers)
        // datastring like this:
        // "5agm12100p1235584210m53"
        // is converted into this:
        // [517,516,514,513,513,513,514,516,519,524,529,537,541,543,544,544,539,536]
        // each number in the chain is converted such:
        // - digit char = start of new whole number. Alpha chars except "p","m" are numbers in hiding.
        //   These consecutive digist expressed as alphas mapped back to digit char.
        //   resurrected number is the diff between this point and prior coord.
        // - running polaritiy is attached to the number.
        // - we undiff (signed number + prior coord) the number.
        // - if char 'm','p', flip running polarity 
        $answer = array();
        $chars = str_split( $datastring );
        $l = sizeof( $chars );
        $ch = '';
        $polarity = 1;
        $partial = array();
        $preprewhole = 0;
        $prewhole = 0;

        for($i = 0; $i < $l; $i++){
            // echo "adding $i of $l to answer\n";
            $ch = $chars[$i];
            if (array_key_exists($ch, $charmap) || $ch == $minus || $ch == $plus){
                
                // this is new number - start of a new whole number.
                // before we can deal with it, we need to flush out what we already 
                // parsed out from string, but keep in limbo, waiting for this sign
                // that prior number is done.
                // we deal with 3 numbers here:
                // 1. start of this number - a diff from previous number to 
                //    whole, new number, which we cannot do anything with cause
                //    we don't know its ending yet.
                // 2. number that we now realize have just finished parsing = prewhole
                // 3. number we keep around that came before prewhole = preprewhole

                if (sizeof($partial) != 0) {
                    // yep, we have some number parts in there.
                    $prewhole = intval( implode('', $partial), $bitness) * $polarity + $preprewhole;
                    array_push( $answer, $prewhole );
                    $preprewhole = $prewhole;
                }

                if ($ch == $minus){
                    $polarity = -1;
                    $partial = array();
                } else if ($ch == $plus){
                    $polarity = 1;
                    $partial = array();
                } else {
                    // now, let's start collecting parts for the new number:
                    $partial = array($ch);
                }
            } else /* alphas replacing digits */ {
                // more parts for the new number
                array_push( $partial, $charmap_reverse[$ch]);
            }
        }
        // we always will have something stuck in partial
        // because we don't have closing delimiter
        array_push( $answer, intval( implode('',$partial), $bitness ) * $polarity + $preprewhole );
        
        return $answer;
    }

    /*
    $c = new jSignature_base30();

    $signature = "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4";
    
    // This is exactly the same as "native" format within jSignature.
    $t = array(
        array(
            'x'=>array(100,101,104,99,104)
            ,'y'=>array(50,52,56,50,44)
        )
        ,array(
            'x'=>array(50,51,48)
            ,'y'=>array(100,102,98)
        )
    );

    $a = $c->Base64ToNative($signature);

    $t == $a
    */
    public function Base64ToNative($datastring){
        global $chunkSeparator;

        $data = array();
        $chunks = explode( $chunkSeparator, $datastring );
        $l = sizeof($chunks) / 2;
        for ($i = 0; $i < $l; $i++){
            array_push( $data, array(
                'x' => $this->uncompress_stroke_leg($chunks[$i*2])
                , 'y' => $this->uncompress_stroke_leg($chunks[$i*2+1])
            ));
        }
        return $data;
    }

}


?>