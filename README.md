# jSignature

jSignature is a jQuery plugin which simplifies creation of a signature fields in the browser window allowing a user to draw a signature using mouse, pen, or finger. 

*   All *major* desktop, tablet and phone browsers are supported. (List of supported / tested browsers, devices is coming)
*   Default stroke entry capture technology used is HTML5 Canvas element. Plugin falls back on Canvas tag emulator in Flash when actual Canvas is not supported by the browser. 
*   All signature data is captured and stored internally as vectors, not pixels. Same signature can be rerendered using variety of postproduction filters to improve presentation on printed media, small screens etc.
*   What is rendered in the browser is NOT was is captured. Rendering of strokes differ per browser's featureset, capture device quality, screen size. Capture of data is always same - we capture as much data as possible. We render an approximation of what we capture. This is done on purpose. Real use of the captured signature will be in high-resolution (likely print) environment, rendered using hight-quality, computationally-intensive smoothing logic that can see the entire captured sig and fit perfect curves between the dots. The image customer sees real-time on the screen is a 'balance' of what the device used for capture can render without sacrificing the responsiveness of capture. Rendering on Canvas within browser can, surprizingly, be extremely slow even on decent equipment and that slowness depends on too many diverse variables for us to control. The plugin tries to make some guesses about efficiency of the device and degrades the renderer appropriately.
*   jSignature automatically detects the colors (even if they are inherited) used on the wrapping (div) element (text color = pen color, background = background) and auto-picks a pleasing middle-shade for 'decor' (signature line and X). This means no extra work is needed to make jSignature widget fit into your carefully-styled page. 
*   jSignature automatically detects the size of the parent element and uses 100% of its width and height. This adapts well to fixed and variable width web page designs, and various size screens (phones, tablets, computer screens).

See [demos here](http://walnutcomputing.com/demo/signature/ "Signature Capture Demos").

## Adding jSignature to your page

jSignature is really three distinct pieces of code:

1.  Code that prepares a Canvas element.
    It includes detection of browser features, maximizing a canvas within the confines of a div, setting up emulated Canvas using Flashcanvas, when needed.
2.  Code that handles actual signature capture + data import / export API.
    It attaches and listens to movement event handlers, stores stroke data inside data structure, handles API calls.
3.  Plugins that help you get the signature data in convenient for you format, like raw data coordinates, image, compressed url-compatible string, SVG.

If you are certain that your audience will be limited to a specific browser engine (you deploy through an embedded browser widget, using something like PhoneGap) you can roll up your sleeves and yank out the part #1.

Data export plugins are provided (and can be loaded) separately, but these can, certainly, be minified together with jSignature core into one js file. *Minified file ('jSignature.min.js') you see in the repository already includes (minified, concatenated) all available export, import plugins.*

For the "generic" deployment scenario (which includes support of old IE) do this:

    <!-- you load jquery somewhere here ... -->
    <!--[if lt IE 9]>
    <script type="text/javascript" src="libs/flashcanvas.js"></script>
    <![endif]-->
    <script src="libs/jSignature.min.js"></script>
    <div id="signature"></div>
    <script>
        $(document).ready(function() {
            $("#signature").jSignature()
        })
    </script>


Explained:
    
*   The `[if lt IE 9]` part loads Flashcanvas library for IE less than 9. (To the best of my knowledge Flashcanvas is supported ONLY ON IE. No point doing feature detection.)
*   Then we load jSignature plugin.
*   Next we have the `div` inside which the canvas element will be created (You cannot reuse a canvas element at this time. Plugin creates its own Canvas elem inside the DIV.)
*   Lastly, the script invokes the signature widget within the specificed DIV.


## API

The following method becomes exposed on top of jQuery: `.jSignature(String command, *args)`

*   `command` when provided, is expected to be a string with a command for jSignature. Commands supported at this time: 'init', 'reset', 'getData', 'setData'
    *   `init` is the default, assumed action. `init` takes one argument - a settings Object. You can omit the command and just pass the settings object in upon init. Returns jQuery ref to the element onto which the plugin was applied.
    *   `reset` just clears the signatre pad, data store (and puts back signature line and other decor). Returns jQuery ref to the element onto which the plugin was applied.
    *   `getData` takes an argument - the name of the data format. Returns a data object appropriate for the data format.
    *   `setData` takes two arguments - data object, data format name. Returns jQuery ref to the element onto which the plugin was applied.
    *   `listPlugins` takes an argument - a string denoting the category ('export', 'import') of plugins (data formats) to list. Returns an array of strings. 

    Usage examples:

        $.jSignature({color:"#145394"}) // inits the widget.
        $.jSignature('reset') // clears the canvas and rerenders the decor on it.
        var datapair = $.jSignature('getData', 'svg') // array of mimetype + (unencoded) string of SVG of the signature strokes.
        var i = new Image()
        i.src = 'data:' + datapair[0] + ';base64,' + btoa( datapair[1] ) // base64 encode data + make it src for Image element.
        $(i).appendTo($('#someelement') // append the image (SVG) to DOM.
        
        datapair = $.jSignature('getData','base30') // array of mimetype + string in custom Base30-compressed format.
        $.jSignature('setData', datapair.join(",")) // import plugins understand 'data url' formatted strings like "mime;encoding,data"


See tests for more examples.

## Data Import / Export (and Plugins)

The following plugins are part of mainline jSignature distribution:

*   "native" data format is (at this time) an array of objects with props .x, .y, each of which is an array.
    Although you could JSONify that and pass it around, it may not be the most efficient way to store data, as internal format may change in other major versions of jSignature. Both, Import and Export is supported in this format.
*   "base30" is a Base64-spirited compression format. This one is tuned to be simple to do fast in the browsers, to create very short, URL-compatible strings. One of possible ways of communicating the data to the server is JSONP, which has a practical URL length limit (imposed by IE, of course) or no more than 2000+ characters. This compression format is natively URL-compatible without a need for reencoding, yet will fit into 2000 for most non-complex data. Both, Import and Export is supported in this format.
*   "svg" export filter allows you to get the signature as an SVG image (all of SVG XML in a long string). All strokes are exported as lines, not curves. Doing proper line smoothing computations requires a bit of juice and that is usually done on the server. This SVG export filter does not do any smoothing at all. It's designed for only one purpose - quick readily-viewable representation of the drawing.
*   "image" base64-encoded (lilely a PNG) image of the sig as scraped pixel-by-pixel from the canvas. Does not work on some mobil Androids, possibly breaks elsewhere. Image extraction picks up 'decor' like signature line (and background on FlashCanvas). Because the export filter depends on browser support and picks up needless data, recommend using this only for demonstration and during development. 

jSignature is targeting usecases providing reliable extraction of highly scalable stroke movement coordinates. A resonable effort is made to make the strokes look pretty on the screen while these are drawn by the signor. However because "image" (even the one that looks pretty on the screen) is a substandard medium for use in print, the focus here is on extraction of core vector data that can be rendered on a whim, per desired use. 
I know you are tempted to want "images" from jSignature, but, please, contemplate capturing "base30" or "svg" data and enhance + render that in postproduction.
The creation of *very pretty* images (dropping of noise pixels, fitting curves within remaining points, applying stroke thickness, preasure-simulation) based on those strokes is largely delegated to the server code and is not part of this project. However, decompression and sample, rudimentary rendering code (.Net, Python as of Feb 2012) can be found in "extras" folder. You would use these as core that provides data for your own rendering logic.

## License, Copyright

[MIT License](http:www.opensource.org/licenses/mit-license.php)

See source header for full and most current Copyright attributions.
