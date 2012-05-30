#! /usr/bin/env python

def default(context):
    minifyfiles(context)
    localsitedeploy(context)

def minifyfiles(context):
    src = context.Node('jSignature.js')
    src_p1 = src - '.js' + '.CompressorBase30.js'
    src_p2 = src - '.js' + '.CompressorSVG.js'

    minified = src - '.js' + '.min.js'
    print("=== Compressing " + src.name + " into " + minified.name)
    minified.text = compress_with_closure_compiler( 
        src.text + src_p1.text + src_p2.text
    )

def localsitedeploy(context):

    todeploy = [
        ['jq', "libs/jquery.js", "js/libs/jquery.js"]
        , ['fcj', "libs/flashcanvas.js", "js/libs/flashcanvas.js"]
        , ['fcswf', "libs/flashcanvas.swf", "js/libs/flashcanvas.swf"]
        , ['mzr', "libs/modernizr.js", "js/libs/modernizr.js"]
        , ['jsig', "jSignature.min.js", "js/libs/jquery.jSignature.${CACHEBUST}.js"]
        , ['index', "index.html", "index.html", ['jq','fcj','jsig','mzr']]
    ]
    todeploy_map = {} # used for string replacement in HTML files. See list above next to index.html

    import time
    cache_busting_string = "%s" % int(time.time())

    served_folder = context.Node("release/")
    served_folder.delete()

    for item in todeploy:
        name = item[0]
        src = context.Node( item[1] )
        trg = served_folder + item[2].replace("${CACHEBUST}", cache_busting_string) # + turns it into Node

        todeploy_map[name] = {'src':src.path, 'trg':trg.path}

        src.copy(trg)

        # editing text file for changes to file names.
        # only when we explicitely give list of nicknames of the filenames we need to replace.
        if len(item) > 3:
            content = trg.text
            # for each file nickname
            for nick in item[3]:
                content = content.replace(todeploy_map[nick]['src'], todeploy_map[nick]['trg'])
            trg.text = content + '<!-- autoedited for deployment -->'

def compress_with_closure_compiler(code, compression_level = None):
    '''Sends text of JavaScript code to Google's Closure Compiler API
    Returns text of compressed code.
    '''
    # script (with some modifications) from 
    # https://developers.google.com/closure/compiler/docs/api-tutorial1

    import httplib, urllib, sys

    compression_levels = [
        'WHITESPACE_ONLY'
        , 'SIMPLE_OPTIMIZATIONS'
        , 'ADVANCED_OPTIMIZATIONS'
    ]

    if compression_level not in compression_levels:
        compression_level = compression_levels[1] # simple optimizations

    # Define the parameters for the POST request and encode them in
    # a URL-safe format.
    params = urllib.urlencode([
        ('js_code', code)
        , ('compilation_level', compression_level)
        , ('output_format', 'json')
        , ('output_info', 'compiled_code')
        , ('output_info', 'warnings')
        , ('output_info', 'errors')
        , ('output_info', 'statistics')
        # , ('output_file_name', 'default.js')
        # , ('js_externs', 'javascript with externs') # only used on Advanced. 
      ])

    # Always use the following value for the Content-type header.
    headers = { "Content-type": "application/x-www-form-urlencoded" }
    conn = httplib.HTTPConnection('closure-compiler.appspot.com')
    conn.request('POST', '/compile', params, headers)
    response = conn.getresponse()

    if response.status != 200:
        raise Exception("Compilation server responded with non-OK status of " + str(response.status))

    compressedcode = response.read()
    conn.close()

    import json # needs python 2.6+ or simplejson module for earlier
    parts = json.loads(compressedcode)

    if 'errors' in parts:
        prettyerrors = ['\nCompilation Error:']
        for error in parts['errors']:
            prettyerrors.append(
                "\nln %s, ch %s, '%s' - %s" % (
                    error['lineno']
                    , error['charno']
                    , error['line']
                    , error['error']
                )
            )
        raise Exception(''.join(prettyerrors))

    return parts['compiledCode']

if __name__ == '__main__':
    print("This is a Wak build automation tool script. Please, get Wak on GitHub and run it against the folder containing this automation script.")