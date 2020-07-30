export { WallModel };

function buildVertexMap(width, offset=0) {
    let vmap = {};
    vmap["t"] = [ 
        {x:0, y:offset, side:"back"}, 
        {x:32, y:offset, side:"back"}, 
        {x:32, y:offset+width, side:"front"}, 
        {x:0, y:offset+width, side:"front"},
    ];
    vmap["ttls"] = vmap.t;
    vmap["ttl"] = [ 
        {x:offset, y:15+offset, side:"back", corner:true}, 
        {x:15+offset, y:offset, side:"back", corner:true}, 
        {x:32, y:offset, side:"back"}, 
    ];
    if (offset+width >= 16) {
        vmap["ttl"].push(...[
            {x:32, y:offset+width, side:"front", corner:true}, 
            {x:offset+width, y:32, side:"front", corner:true}, 
            {x:offset, y:32, side:"front"},
        ])
    } else {
        vmap["ttl"].push(...[
            {x:32, y:offset+width, side:"front"}, 
            {x:16+width+offset, y:offset+width, side:"front", corner:true},
            {x:offset+width, y:16+width+offset, side:"front", corner:true},
            {x:offset+width, y:32, side:"front"},
            {x:offset, y:32, side:"front"},
        ])
    }
    vmap["l"] = [ 
        {x:offset, y:0}, 
        {x:offset+width, y:0}, 
        {x:offset+width, y:32}, 
        {x:offset, y:32}, 
    ];
    vmap["ttle"] = vmap.l;
    vmap["ltbs"] = vmap.l;
    // --- LTTS ---
    vmap["ltts"] = [
        {x:offset,  y:0}, 
        {x:offset+width, y:0}, 
    ];
    // lower right corner or intersection of right edge w/ bottom
    if (offset+width > 16) {
        vmap["ltts"].push({x:offset+width, y:32});
    } else {
        vmap["ltts"].push({x:offset+width, y:16+width+offset, side:"front", corner:true})
    }
    // intersection of front angled edge w/ bottom
    if ((offset+width)>=8 && offset+width < 16) {
        vmap["ltts"].push({x:offset*2, y:32, side:"front"});
    }
    // interior lower-left grid corner
    if (offset<8 && offset+width>8) {
        vmap["ltts"].push({x:0, y:32});
    }
    // intersection of back angled edge w/ left
    if (offset>0) {
        vmap["ltts"].push({x:0, y:16+offset*2, side:"back"});
    }
    // corner of back angled edge to left
    vmap["ltts"].push({x:offset, y:16+offset, side:"back", corner:true});
    // --- LTT ---
    if (offset + width > 16) {
        vmap["ltt"] = [
            {x:0,  y:0}, 
            {x:offset+width, y:0}, 
            {x:offset+width, y:(offset+width)-16, side:"front", corner:true},
            {x:(offset+width)-16, y:offset+width, side:"front", corner:true},
            {x:0, y:offset+width}, 
        ];
    } else if (offset+width > 8) {
        vmap["ltt"] = [
            {x:0,  y:0}, 
            {x:(offset+width)*2-16, y:0, side:"front", corner:(offset+width===16)}, 
            {x:0, y:(offset+width)*2-16, side:"front", corner:(offset+width===16)}, 
        ];
    }
    return vmap;
}

class WallModel {

    constructor(width, height, offset=0) {
        this.vertexMap = buildVertexMap(width, offset);
    }

    getTopFaces(id) {
    }

    getBottomFaces(pos, id) {
        let verts = this.vertexMap[id];
        if (!verts) return [];
        let path = new Path2D();
        path.moveTo(pos.x+verts[0].x, pos.y+verts[0].y);
        for (let i=1; i<verts.length; i++) {
            path.lineTo(pos.x+verts[i].x, pos.y+verts[i].y);
        }
        path.closePath();
        return [path];
    }

    getFrontFaces(id) {
    }

    getBackFaces(id) {
    }
}

const wallFaceMap = {

    "ltb": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:16}, {x:32, y:31}, {x:15, y:31}, {x:0,  y:16},
        ],
        "backedges": [
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "front": [4,5],
            "top": [1,2, 3,4, 4,5, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "rttc": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:16}, {x:32, y:31}, {x:15, y:31}, {x:0,  y:16},
        ],
        "backedges": [
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "front": [4,5],
            "top": [1,2, 3,4, 4,5, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "btls": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:47}, {x:16, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "back": [1],
            "front": [2,3],
            "top": [0,1, 2,3, 3,4],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "frontlight"},
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "btl": {
        "verts": [
            {x:0,  y:16}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "back": [1],
            "top": [0,1],
        },
    },

    "btle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:15},
        ],
        "hl": {
            "top": [1,2, 3,4],
        },
    },

    "l": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "ttle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "ltbs": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "btr": {
        "verts": [
            {x:0,  y:16}, {x:15, y:0}, {x:31, y:0}, {x:31, y:16}, {x:16, y:31}, {x:0,  y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3,4],
            "top": [0,1, 2,3, 3,4, 4,5],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
            {v1: 4, v2: 5, style: "front"},
        ],
    },

    "ttlc": {
        "verts": [
            {x:0,  y:16}, {x:15, y:0}, {x:31, y:0}, {x:31, y:16}, {x:16, y:31}, {x:0,  y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3,4],
            "top": [0,1, 2,3, 3,4, 4,5],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
            {v1: 4, v2: 5, style: "front"},
        ],
    },

    "rtbs": {
        "verts": [
            {x:16,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:31, y:16}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [3,4, 5,0],
        },
    },

    "rtb": {
        "verts": [
            {x:16,  y:32}, {x:32, y:16}, {x:32, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "top": [0,1],
        },
    },

    "rtbe": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:16, y:31}, {x:0, y:47},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "front": [3],
            "top": [0,1, 2,3, 3,4],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "rtt": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:31, y:15}, {x:31, y:32}, {x:16, y:32}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "top": [0,1, 1,2, 2,3, 4,5],
        },
        "frontedges": [
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "ltbc": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:31, y:15}, {x:31, y:32}, {x:16, y:32}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "top": [0,1, 1,2, 2,3, 4,5],
        },
        "frontedges": [
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "ttrs": {
        "verts": [
            {x:0,  y:-15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backdark"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [1],
            "top": [0,1, 1,2, 3,4],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "ttr": {
        "verts": [
            {x:16,  y:0}, {x:32, y:0}, {x:32, y:15},
        ],
        "hl": {
            "back": [],
            "front": [0,2],
            "top": [2,0],
        },
        "frontedges": [
            {v1: 2, v2: 0, style: "frontlight"},
        ],
    },

    "ttre": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:16}, {x:32, y:17}, {x:32, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 5,0],
        },
    },

    "ttl": {
        "verts": [
            {x:0,  y:15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [0,1],
            "front": [3],
            "top": [0,1, 1,2, 3,4, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "btrc": {
        "verts": [
            {x:0,  y:15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [0,1],
            "front": [3],
            "top": [0,1, 1,2, 3,4, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "ltts": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:16},
        ],
        "hl": {
            "top": [1,2, 4,0],
        },
    },

    "ltt": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:0, y:15},
        ],
        "hl": {
            "front": [1,2],
            "top": [1,2],
        },
        "frontedges": [
            {v1: 1, v2: 2, style: "frontdark"},
        ],
    },

    "ltte": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:-15}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3],
            "top": [0,1, 1,2, 3,4],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "ttls": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "t": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "rtte": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "b": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "ltbe": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "btrs": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "back": [1],
            "front": [],
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "r": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "rtts": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "btre": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

}