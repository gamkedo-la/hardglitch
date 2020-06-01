#!/usr/bin/env python3

import base64
import os.path

# relative path from script directory to image directory
imgpath = os.path.join('.')

styles = [
    't',
    'ot',
    'm',
    'ttls',
    'ttl',
    'ttle',
    'ottls',
    'ottl',
    'l',
    'ltts',
    'ltt',
    'ltte',
    'oltt',
    'oltte',
    'ltbs',
    'ltb',
    'ltbe',
    'ltbi',
    'b',
    'bi',
    'btls',
    'btl',
    'btle',
    'btli',
    'obtl',
    'btrs',
    'btr',
    'btre',
    'btri',
    'r',
    'rtbs',
    'rtb',
    'rtbe',
    'rtbi',
    'ortb',
    'rtts',
    'rtt',
    'rtte',
    'ortt',
    'ortte',
    'ttrs',
    'ttr',
    'ttre',
    'ottr',
    'ottrs',
]

def genjs(path, prefix, styles):
    str = 'let tiles = {\n'
    for style in styles:
        tilepath = os.path.join(path, prefix + style + '.png')
        data = base64.b64encode(open(tilepath, 'rb').read()).decode('utf-8')
        str += '    ' + style + ': tile("' + data + '"),\n'
    str += '};\n'
    return str

if __name__ == '__main__':
    # lookup script path
    scriptpath = os.path.dirname(os.path.realpath(__file__))

    path = os.path.join(scriptpath, imgpath)
    print('path: ' + path)

    js = genjs(path, 'tt_', styles)
    print(js)

    '''
    # img file
    prefix = 'tt_'
    tilepath = os.path.join(path, prefix + styles[0] + '.png')
    print('tilepath: ' + tilepath)

    data = base64.b64encode(open(tilepath, 'rb').read())
    print('data: ' + data.decode('utf-8'))
    '''