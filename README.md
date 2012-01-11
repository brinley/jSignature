# jSignature

jSignature is a plugin for jQuery which simplifies the creation of a signature field in the browser window that allows a user to draw a signature using mouse, pen, or finger. 

*   All *major* desktop, tablet and phone browsers are supported. (see List of supported / tested browsers, devices)
*   Default stroke entry capture technology used is HTML5 Canvas element. Plugin falls back on Canvas tag emulator in Flash when actual Canvas is not supported by the browser. 
*   All signature data is captured and stored internally as vectors, not pixels. Same signature can be rerendered using variety of postproduction filters to improve presentation on printed media, small screens etc.
*   What is rendered in the browser is NOT was is captured. Rendering of strokes differ per browser's featureset, capture device quality, screen size. Capture of data is always same - we capture as much data as possible. We render much less than what we capture. This is done on purpose. Real use of the captured signature will be in high-resolution (likely print) environment, rendered using hight-quality, computationally-intensive smoothing logic that can see the entire captured sig and fit perfect curves between the dots. The image customer sees real-time on the screen is a 'balance' of what the device used for capture can render without sacrificing the responsiveness of capture. Rendering on Canvas within browser can, surprizingly, be extremely slow even on decent equipment and that slowness depends on too many diverse variables for us to control. The plugin tries to make some guesses about efficiency of the device and degrades (only) the renderer appropriately.


See demos here.

## Adding jSignature to your page

jSignature is really two distinct pieces of code:

1.  Code that prepares a Canvas element.
    It includes detection of browser features, maximizing a canvas within the confines of a div, setting up emulated Canvas using Flashcanvas, when needed.
2.  Code that handles actual signature capture + data import / export API.
    It attaches and listens to movement event handlers, stores stroke data inside data structure, handles API calls.

If you are certain that your audience will be limited to a specific browser engine (you deploy through an embedded browser widget, using something like PhoneGap) you can roll up your sleeves and yank out the part #1.

### through SCRIPT tag

For the "generic" deployment scenario (which includes support of old IE) do this:

    <!-- you load jquery somewhere here ... -->
    <!--[if lt IE 9]>
    <script type="text/javascript" src="libs/flashcanvas.js"></script>
    <![endif]-->
    <script src="libs/jquery.jSignature.js"></script>
    <div id="signature"></div>
    <script>
        $(document).ready(function() {
            $("#signature").jSignature({color:"#145394"})
        })
    </script>


Explained:
    
*   The `[if lt IE 9]` part loads Flashcanvas library for IE less than 9. (To the best of my knowledge Flashcanvas is supported ONLY ON IE. No point doing feature detection.)
*   Then we load jSignature plugin.
*   Next we have the `div` inside which the canvas element will be created (You cannot reuse a canvas element at this time. Plugin creates its own Canvas elem inside the DIV.)
*   Lastly, the script invokes the signature widget within the specificed DIV.
    
    
### as AMD-loader module

Because jSignature is also an AMD-loader compatible module, if you want to load it AFTER you set up your loader within the page, you pretty much MUST load it using require(, not SCRIPT tag. This is a limitation of AMD-loaders, not of the plugin. Some (many?) of the loaders tried blew up when anonymous module is loaded outside of the loader. (A patch for that was pushed to Curl.js AMD-loader project. As of 2012-01-10, we, unequivocally and without reservations, recommend use of Curl.js over RequireJS. Following numerous blow ups (in basics  like nested named requires, loading order, etc) RequireJS was deemed by us a "magical minefield," "alpha" code compared to Curl,js.)
jSignature, when loaded as AMD module returns Instantializer. It does not augment global jQuery, since it does not know which one it needs to augment. You need to initialize jSignature against the jQuery instance you desire to use.

    require(['jquery','path/to/jquery.jSignature'], function($, jSigInitializer){
        $ = jSigInitializer($) // initializer augments jQuery instance with itself and retuns augmented jQuery
        $(document).ready(function() {
            $("#signature").jSignature({color:"#145394"})
        })
        // ...
        // your business logic continues here.
    })


## API

The following method becomes exposed on top of jQuery: `.jSignature(String command, *args)`

*   `command` when provided, is expected to be a string with a command for jSignature. Commands supported at this time: 'init', 'clear', 'getData', 'setData'
    *   `init` is the default, assumed action. `init` takes one argument - a settings Object. You can omit the command and just pass the settings object in upon init. Returns jQuery ref to the element onto which the plugin was applied.
    *   `clear`just clears the signatre pad, data store (and puts back signature line and other decor). Returns jQuery ref to the element onto which the plugin was applied.
    *   `getData` takes an argument - the name of the data format ('strokes' is only **production quality** format supported at this time. Image extraction from Canvas is broken on too many mobile browsers and, obviously, on emulated Canvas in IE) Returns a data object appropriate for the data format.
    *   'setData' takes two arguments - data object, data format name. Returns jQuery ref to the element onto which the plugin was applied.

    Usage examples:

        $.jSignature({color:"#145394"}) // inits the widget.
        $.jSignature('clear') // clears the canvas and rerenders the decor on it.
        var hopefully_imagedata = $.jSignature('getData') // no arg = default of "image" - returns image data scraped from Canvas. No worky on many browsers.
        var data = $.jSignature('getData', 'strokes') // returns array of arrays containing the signature strokes.
        $.jSignature('setData', data, 'strokes') 


See tests for more examples.

## License, Copyright

[MIT License](http:www.opensource.org/licenses/mit-license.php)

See source header for full and most current Copyright attributions.
