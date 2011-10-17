#! /usr/bin/env python

import shutil
import os.path
import time

out = 'build'

def options(opt):
    pass

def configure(conf):
    pass

def build(bld):

    served_folder_prefix = "./release/"
    todeploy = [
        ["js/libs/jquery-1.6.2.min.js", "js/libs/jquery.js"]
        #, ["js/libs/excanvas.min.js", "js/libs/excanvas.js"]
        , ["js/libs/flashcanvas.js", "js/libs/flashcanvas.js"]
        , ["js/libs/flashcanvas.swf", "js/libs/flashcanvas.swf"]
        , ["js/business_logic.js", "js/business_logic.js", 'cache busting']
        , ["jSignature.js", "js/libs/jquery.jSignature.js", 'cache busting']
        , ["index.html", "index.html"] # item immediately following cache busting item(s) gets edited for all the busted names.
        ]

    cache_busting_string = ".%s" % int(time.time())
    cache_busting_list = []
    cache_busting_setup_ready = False

    # moving files in place
    if os.path.exists(served_folder_prefix):
        for node in os.listdir(served_folder_prefix):
            shutil.rmtree(served_folder_prefix + node, True)
    for item in todeploy:
        src = item[0]
        trg = item[1]
        trg_full = served_folder_prefix + trg 
        trg_folder, trg_file = os.path.split(trg_full)
        if not os.path.exists(trg_folder):
            os.makedirs(trg_folder)
        shutil.copy(src, trg_full)
        
        # this is cache_busting
        if len(item)>2 and item[2] == 'cache busting':
            trgstart, trgend = os.path.splitext(trg_full)
            trg_busted = trgstart + cache_busting_string + trgend
            shutil.move(trg_full, trg_busted)
            cache_busting_list.append( trg )
            cache_busting_setup_ready = True
        elif cache_busting_setup_ready:
            content = open(trg_full).read()
            for filename in cache_busting_list:
                trgstart, trgend = os.path.splitext(filename)
                trg_busted = trgstart + cache_busting_string + trgend
                content = content.replace(filename, trgstart + cache_busting_string + trgend)
            open(trg_full, 'w').write(content + '<!-- autoedited for cache busting -->')
            cache_busting_list = []

if __name__ == '__main__':
    print("This is a Wak build automation tool script. Please, get Wak on GitHub and run it against the folder containing this automation script.")