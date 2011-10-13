#! /usr/bin/env python

import shutil
import os.path

out = 'build'

def options(opt):
    pass

def configure(conf):
    pass

def build(bld):
    
    served_folder_prefix = "/bin/nginx/html/jsig/"
    
    todeploy = [
        ["js/libs/jquery-1.6.2.min.js", "js/libs/jquery.js"]
        , ["js/business_logic.js", "js/business_logic.js"]
        , ["index.html", "index.html"]
        , ["jSignature.js", "js/libs/jquery.jSignature.js"]
        
        ]
    
    for item in todeploy:
        src = item[0]
        trg = served_folder_prefix + item[1]
        trg_folder, trg_file = os.path.split(trg)
        if not os.path.exists(trg_folder):
            os.makedirs(trg_folder)
        shutil.copy(src, trg)
