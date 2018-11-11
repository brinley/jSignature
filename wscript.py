#! /usr/bin/env python
import subprocess

def default(context):
    minifyfiles(context)

def minifyfiles(context):
    src = context.Node('src/jSignature.js')

    distfolder = context.Node('libs/')
    pluginsfolder = context.Node('src/plugins/')

    # Compressing jSignature + some plugins into one mini
    minified = distfolder + src.name - '.js' + '.min.js'
    print("=== Compressing " + src.name + " into " + minified.fullpath)
    minified.text = compress_with_closure_compiler(
        src.text.replace(
            "${buildDate}", timeUTC()
        ).replace(
            "${commitID}", getCommitIDstring()
        ) + \
        (pluginsfolder + 'jSignature.UndoButton.js').text + \
        # context.Node('plugins/signhere/jSignature.SignHere.js').text + \
        (pluginsfolder + 'jSignature.CompressorBase30.js').text + \
        (pluginsfolder + 'jSignature.CompressorSVG.js').text
    )

    # wrapping that mini into "jQuery.NoConflict" prefix + suffix
    # and hosting it as separate mini
    (minified - '.js' + '.noconflict.js').text = ";(function($){\n" + minified.text + "\n})(jQuery);"

def timeUTC():
    import datetime
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M")

def getCommitIDstring():
    import subprocess

    if not subprocess.check_output:
        # let's not bother emulating it. Not important
        return ""
    else:
        return "commit ID " + subprocess.check_output(
            [
                'git'
                , 'rev-parse'
                , 'HEAD'
            ]
        ).strip()

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
    conn = httplib.HTTPSConnection('closure-compiler.appspot.com')
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