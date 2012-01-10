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
        ['jq', "libs/jquery.js", "js/libs/jquery.js"]
        , ['fcj', "libs/flashcanvas.js", "js/libs/flashcanvas.js"]
        , ['fcswf', "libs/flashcanvas.swf", "js/libs/flashcanvas.swf"]
        , ['jsig', "jSignature.js", "js/libs/jquery.jSignature.${CACHEBUST}.js"]
        , ['index', "index.html", "index.html", ['jq','fcj','jsig']] # item immediately following cache busting item(s) gets edited for all the busted names.
    ]
    todeploy_map = {} # used for string replacement in HTML files. See list above next to index.html
  
    #destination folder
    if os.path.exists(served_folder_prefix):
        for node in os.listdir(served_folder_prefix):
            shutil.rmtree(served_folder_prefix + node, True)

    # deploying files
    cache_busting_string = "%s" % int(time.time())
    for item in todeploy:
        name = item[0]
        src = item[1]
        trg = item[2].replace("${CACHEBUST}", cache_busting_string)
        todeploy_map[name] = {'src':src, 'trg':trg}

        trg_full = served_folder_prefix + trg 
        trg_folder, trg_file = os.path.split(trg_full)
        if not os.path.exists(trg_folder):
            os.makedirs(trg_folder)
        shutil.copy(src, trg_full)

        # editing text file for changes to file names.
        # inly when we explicitely give nicknames of the filenames we need to replace.
        if len(item) > 3:
            content = open(trg_full).read()
            # for each file nickname
            for nick in item[3]:
                content = content.replace(todeploy_map[nick]['src'], todeploy_map[nick]['trg'])
            open(trg_full, 'w').write(content + '<!-- autoedited for deployment -->')

if __name__ == '__main__':
    print("This is a Wak build automation tool script. Please, get Wak on GitHub and run it against the folder containing this automation script.")