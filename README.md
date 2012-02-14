# jSignature

jSignature is a jQuery plugin which simplifies creation of a signature fields in the browser window allowing a user to draw a signature using mouse, pen, or finger. 

Although simple bitmap (PNG) export of signature image is supported, jSignature is targeting usecases providing reliable extraction of highly scalable stroke movement coordinates (aka vector image). A resonable effort is made to make the strokes look pretty on the screen while these are drawn by the signor. However because "image" (even the one that looks pretty on the screen) is a substandard medium for use in print, the focus here is on extraction of core vector data that can be (enhanced again and) rendered on a whim, server-side.

*   All *major* desktop, tablet and phone browsers are supported. (List of supported / tested browsers, devices is coming) Default stroke entry capture technology is HTML5 Canvas element. jSignature falls back on Flash-based Canvas element emulator (FlashCanvas) when actual Canvas is not supported by the browser (IE 8 and less). 
*   All signature data is captured and stored internally as vectors. Same signature can be rerendered using variety of postproduction filters to improve presentation on printed media, small screens etc.
*   What was rendered in the browser during capture is not always what was captured. Rendering of strokes differ per browser's featureset, capture device quality, screen size. Capture of data is always same - we capture as many movement coordinates as possible. Real-time jSignature renders only the device-appropriate "prettiest" approximation of what we capture. 
    This arbitrary degrading and enhancing of screen representation of the captured signature is done on purpose. Real-life use of the captured signature could be in high-resolution (likely print) environment, rendered using high-quality, computationally-intensive smoothing logic that can analyze the entire captured sig, drop some and fit perfect curves between the remaining dots. **The image customer sees real-time on the screen is a 'balance' of what the device used for capture can render without sacrificing the responsiveness of capture.** Rendering on Canvas within browser can, surprisingly, be extremely slow even on decent equipment and that slowness depends on too many diverse variables for us to control. The plugin tries to make some guesses about efficiency of the device and degrades or enhances the renderer appropriately.
*   jSignature makes it easy to pluck itself into an existing carefully-styled site. jSignature automatically detects the colors (even if they are inherited) used on the wrapping (div) element (text color = pen color, background = background) and auto-picks a pleasing middle-shade for 'decor' (signature line). jSignature automatically detects the zoom and size of the parent element and uses 100% of its (zoomed) width and height (which becomes a life-saver for Flash-based Canvas emulator use). This adapts well to fixed and variable width web page designs, and various size screens (phones, tablets, computer screens). You don't have to lift a finger for jSignature to follow the styles you prescribe in your CSS files for the page at-large.

See [demos here](http://walnutcomputing.com/demo/signature/ "Signature Capture Demos").

## Adding jSignature to your page

jSignature is really three distinct pieces of code:

1.  Code that prepares a Canvas element.
    It includes detection of browser features, maximizing a canvas within the confines of a div, setting up emulated Canvas using Flashcanvas, when needed.
2.  Code that handles actual signature capture + data import / export API.
    It attaches and listens to movement event handlers, stores stroke data inside data structure, handles API calls.
3.  Plugins that help you get the signature data in convenient for you format, like raw data coordinates, image, compressed url-compatible string, SVG.

If you are certain that your audience will be limited to a specific browser engine (you deploy through an embedded browser widget, using something like PhoneGap) you can roll up your sleeves and yank out the part #1.

Data export plugins are provided (and can be loaded) separately, but these can, certainly, be minified together with jSignature core into one js file. **Minified file ('jSignature.min.js') you see in the repository already includes all available export, import plugins.**

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
*   Lastly, the script invokes the signature widget within the specified DIV.


## API

The following method becomes exposed on top of jQuery: `.jSignature(String command, *args)`

*   `command` when provided, is expected to be a string with a command for jSignature. Commands supported at this time: 'init', 'reset', 'getData', 'setData'
    *   `init` is the default, assumed action. `init` takes one argument - a settings Object. You can omit the command and just pass the settings object in upon init. Returns jQuery ref to the element onto which the plugin was applied.
    *   `reset` just clears the signature pad, data store (and puts back signature line and other decor). Returns jQuery ref to the element onto which the plugin was applied.
    *   `getData` takes an argument - the name of the data format. Returns a data object appropriate for the data format.
    *   `setData` takes two arguments - data object, data format name. Returns jQuery ref to the element onto which the plugin was applied.
    *   `listPlugins` takes an argument - a string denoting the category ('export', 'import') of plugins (data formats) to list. Returns an array of strings. 

    Usage examples:

        $.jSignature({color:"#145394"}) // inits the widget.
        $.jSignature('reset') // clears the canvas and rerenders the decor on it.
        
        // Getting signature as SVG and rendering the SVG within the browser.
        var datapair = $.jSignature('getData', 'svg') // array of mimetype + (unencoded) string of SVG of the signature strokes.
        var i = new Image()
        i.src = 'data:' + datapair[0] + ';base64,' + btoa( datapair[1] ) // base64 encode data + make it src for Image element.
        $(i).appendTo($('#someelement') // append the image (SVG) to DOM.
        
        // Getting signature as 'base30' data pair
        datapair = $.jSignature('getData','base30') // array of mimetype + string in custom Base30-compressed format.
        // reimporting the data into jSignature.
        $.jSignature('setData', datapair.join(",")) // import plugins understand 'data url' formatted strings like "mime;encoding,data"


See tests for more examples.

## Data Import / Export (and Plugins)

The following plugins (data formats) are part of mainline jSignature distribution:

*   "default" (EXPORT ONLY) (BITMAP) data format is compatible with output format jSignature produced in earlier versions when 'getData' was called without arguments. "Default" is now invoked (obviously) by default whenever you `$obj.jSignature('getData')` The data format is that produced natively by Canvas - 'data url' formatted, base64 encoded (likely PNG) bitmap data that looks like this: `data:image/png;base64,i1234lkj123;k4;l1j34l1kj3j...` 
    This export call returns a single 'data url' formatted string.
*   "native" (EXPORT AND IMPORT) (VECTOR) data format is custom representation of drawing strokes as an array of objects with props .x, .y, each of which is an array. This JavaScript objects structure is the actual data structure where each of the drawing strokes is stored in jSignature. The structure is designed specifically for speed and efficiency of **collecting** strokes data points. (Although it is a bit counter-intuitive, octopus-looking structure, it (a) allows to pile up two-axis coordinates fast without a need to create 'point' objects for each data point and (b) provides for very easy loop-based processing of data.)
    Although you could JSONify that, pass it around, parse, render from this, it may not be the most efficient way to store data, as internal format may change in other major versions of jSignature. I recommend looking at 'base30' format as a direct, but compact equivalent to "native"-as-JSON. 
    What this data is good for is running stats (size, position of signature on the canvas) and editing strokes (allowing for "undo last stroke," for example).
*   "base30" (EXPORT AND IMPORT) (VECTOR) data format is a Base64-spirited compression format tuned for absurd compactness and native url-compatibility. It is "native" data structure compressed into a single-string, compact representation of all vectors. 
    Code examples (.Net, Python) detailing decompression of this format into render-able form (SVG, language-native coordinate arrays) are provided in the 'extras' folder.
    One of possible ways of communicating the data to the server is JSONP, which has a practical URL length limit (imposed by IE, of course) of no more than 2000+ characters. This compression format is natively URL-compatible without a need for re-encoding, yet will fit into 2000 characters for most non-complex signatures.
*   "svg" (EXPORT ONLY) (VECTOR)  data format produces the signature as an SVG image (SVG XML text). All stroke vectors are exported as linear paths. (No artificial curve fitting is done. Doing proper line smoothing computations requires a bit of juice and that is usually done on the server.) 
    This format is a good medium between "easy to view" and "hightly scalable." Viewing SVGs is natively supported in majority of today's browsers and, yet, this format can be infinitely scaled and enhanced for print. Data is testual, allowing for easy storage and transfer.
    The call to `jSIgnature('getData','svg')` returns an array of form `['mimetype;encoding','svg xml as long string']` Example (shortened): `['image/svg+xml','<?xml...><svg ...>...</svg>']` This two-member array is rather easy to turn into 'data url' formatted string or turn into args and pass to server as form values.
*   "image" (EXPORT ONLY) (BITMAP) data format is essentially same as "default" above, but parsed apart so that mimetype and data are separate objects in an array structure similar to that produced by "svg" export. Example (shortened) `['image/png;base64','i123i412i341jijalsdfjijl234123i...']`. Because image export filter depends on (somewhat flaky) browser support and picks up needless data, recommend using this only for demonstration and during development. 

## Choosing the export / storage format.

I know you are tempted to want "images" from jSignature, but, please, control yourself, and stay away. Instead, contemplate capturing "base30" or "svg" data and enhance + render that in postproduction, server-side.

If you export "bitmap", the image will retain actual drawing colors, size, defects, and, to top it off, may not work on all browsers. 

*   The decor (signature line) will be on the image. if jSignature was styled with dark background + light pen color that's exactly what you will get on the image - dark background, light drawings covering grey signature line. This image becomes virtually useless for print. The matter is worse if your background is same intensity as pen (red on blue, for example) in which case when printed black-and-white the image becomes just a dark grey rectangle. If you ever change page colors, captured image now starts to wear those colors. 
*   Androids 1.6 -2.2 (2.3?) dont support canvas.getDataURL method well - the cornerstone of 'bitmap' export functionality. 
*   Small screens (mobiles) produce tiny, ugly bitmaps.
*   Bitmap exported by canvas is GARGANTUAN in size compared to vector because it retains all the mid-shaded and background pixels.

If you want to force yourself to use only Black on top of White signature capture web page style forever, DO use bitmap export. If you want to have your database admin scream at you because backup of database with all that bitmap data takes more than a day, DO use bitmap export. If you want your sales / business dept to scream at you because your signature capture format cannot be easily integrated into their new carefully-styled, wizbang product / service, DO use bitmap export. If you want to explain why siganture format export you chose does not work on all target platforms, DO use bitmap export. If you want to take the easy route now, and make the the IT person that will come in after you are fired do the difficult task of applying ImageMagic wisardry upon a mess of colored pixels you decided to collect, DO use bitmap export format.

If the use of the captured signature has anything to do with "business" or "printing" or "multiple presentation venues" use the Vector formats like "base30" or "svg" data and enhance + render that in postproduction. Decompression and sample, rudimentary rendering code (.Net, Python as of Feb 2012) can be found in "extras" folder. You would use these as core that provides loop-able coordinate data arrays for your own rendering logic.

## License, Copyright

[MIT License](http:www.opensource.org/licenses/mit-license.php)

See source header for full and most current Copyright attributions.
