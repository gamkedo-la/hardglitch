import { SeamSelector, genFloorOverlay, genFgOverlay } from "../view/tile-select.js";
import { Grid } from "../system/grid.js";
import { tile_defs } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";
import { Color } from "../system/color.js";

// hard-coded bg tiles
const wall = new Image();
wall.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADRJREFUWIXtzjEBADAIxMCnKiqlK/5FFRksFwO5uq9/FjubcwAAAAAAAAAAAAAAAAAAgCQZQm4B0KN9/LwAAAAASUVORK5CYII=";
const floor = new Image();
floor.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADVJREFUWIXtzkEBADAIxLBjSuZf1gRgYcjgkxpoqt/9WexszgEAAAAAAAAAAAAAAAAAAJJkAF3RAy8pxiovAAAAAElFTkSuQmCC";
const hole = new Image();
hole.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAGJJREFUWIXt1rENwDAIRNFL5CHSUFK4ZxrPnA08TLIDRCLFpz/xJAruWNd6lBwP1753Ni4P15lOfzQAAAAAAABAO2B4eDps00rLbZpG5Z9LKvUB6QcnAAAAAAAAANoB7X3gBR0LDRuz+iG/AAAAAElFTkSuQmCC";
const voidimg = new Image();
voidimg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAANhJREFUeJzt2LEJwzAYBWE5eACXmSDgVC6M969DimyU7CAVn8j/rn/oOFAhLfdt/7ZOzuto79endz7F/ta9/hMSQAtoEkALaBJAC2gSQAtoEkALaBJAC2jKB1jP6+ge78/H0OEz7NeR93Rrbeg9PsO+/BVIAC2gSQAtoEkALaBJAC2gSQAtoEkALaApHyD/Afo9rvflr0ACaAFNAmgBTQJoAU0CaAFNAmgBTQJoAU35APkP0O9xvS9/BRJAC2gSQAtoEkALaBJAC2gSQAtoEkALaMoHKP8f8ANv0DI4YK9hqAAAAABJRU5ErkJggg==";

const allPaths = [
    "srcref/groundToWall.png",
    "srcref/groundToHole.png",
    "srcref/groundToVoid.png",
    "srcref/groundToOther.png",
    "srcref/holeToWall.png",
    "srcref/holeToGround.png",
    "srcref/wallToHole.png",
    "srcref/wallToGround.png",
    "srcref/tiletemplate.png",
    "srcref/voidToGround.png",
];

var g2wTiles;
var g2hTiles;
var g2vTiles;
var g2oTiles;
var h2wTiles;
var h2gTiles;
var w2hTiles;
var w2gTiles;
var fgTiles;
var v2gTiles;

function loadTemplateSheet(sheet, map, tilesize) {
    return new Promise((resolve) => {
        let tileset = {};
        // create tilebuffer to be used to extract images from tilesheet
        let tileBuffer = document.createElement('canvas');
        tileBuffer.width = tilesize;
        tileBuffer.height = tilesize;
        let ctx = tileBuffer.getContext('2d');
        //let count = Object.keys(map).length;
        let promises = [];
        for (const k of Object.keys(map)) {
            ctx.clearRect(0, 0, tileBuffer.width, tileBuffer.height);
            let p = map[k];
            // draw the image to the tile buffer
            ctx.drawImage(sheet, p.i*tilesize, p.j*tilesize, tilesize, tilesize, 0, 0, tilesize, tilesize);
            // create a new image element, copying data from tile buffer
            let promise = loadImage(tileBuffer.toDataURL());
            promise.then(img => tileset[k] = img);
            promises.push(promise);
        }
        // wait for all images to be loaded... then resolve tileset
        Promise.all(promises).then(() => {
            resolve(tileset);
        });
    });
}

/**
 * test lvl generator
 */
function gen(grid) {
    // set ground for all
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            grid.set_at(tiledefs.ID.GROUND,i,j);
        }
    }
    // carve out test wall
    grid.set_at(tiledefs.ID.WALL,1,1);
    grid.set_at(tiledefs.ID.WALL,2,4);
    grid.set_at(tiledefs.ID.WALL,3,4);
    grid.set_at(tiledefs.ID.WALL,4,4);
    grid.set_at(tiledefs.ID.WALL,5,4);
    grid.set_at(tiledefs.ID.WALL,6,4);
    grid.set_at(tiledefs.ID.WALL,7,4);
    grid.set_at(tiledefs.ID.WALL,4,2);
    grid.set_at(tiledefs.ID.WALL,5,2);
    grid.set_at(tiledefs.ID.WALL,4,3);
    grid.set_at(tiledefs.ID.WALL,5,3);
    grid.set_at(tiledefs.ID.WALL,4,5);
    grid.set_at(tiledefs.ID.WALL,5,5);
    grid.set_at(tiledefs.ID.WALL,4,6);
    grid.set_at(tiledefs.ID.WALL,5,6);
}

class PathShape {
    constructor(path, fill, style, width=1) {
        this.path = path;
        this.fill = fill;
        this.style = style;
        this.path.lineWidth = width;
    }

    draw(ctx) {
        if (this.fill) {
            ctx.fillStyle = this.style;
            ctx.fill(this.path);
        } else {
            ctx.lineWidth = this.width;
            ctx.strokeStyle = this.style;
            ctx.stroke(this.path);
        }
    }
}

const faceMap = {

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
        "backedges": [
        ],
        "hl": {
            "back": [1],
            "front": [],
            "top": [0,1],
        },
        "frontedges": [
        ],
    },

    "btle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:15},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,4],
        },
        "frontedges": [
        ],
    },

    "l": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
    },

    "ttle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
    },

    "ltbs": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
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

    "rtbs": {
        "verts": [
            {x:16,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:31, y:16}, {x:31, y:32}, {x:16, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [3,4, 5,0],
        },
        "frontedges": [
        ],
    },

    "rtb": {
        "verts": [
            {x:16,  y:32}, {x:32, y:16}, {x:32, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            //"back": [0,1],
            "back": [1],
            "front": [],
            "top": [0,1],
        },
        "frontedges": [
        ],
    },

    "rtbe": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:16, y:31}, {x:0, y:47},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "back": [],
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
            "front": [],
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
            "front": [],
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
        "backedges": [
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
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 5,0],
        },
        "frontedges": [
        ],
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

    "ltts": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:16},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 4,0],
        },
        "frontedges": [
        ],
    },

    "ltt": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:0, y:15},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
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
            "back": [],
            "front": [],
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
            "back": [],
            "front": [],
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
            "back": [],
            "front": [],
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
            "back": [],
            "front": [],
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
            "back": [],
            "front": [],
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
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
    },

    "rtts": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
    },

    "btre": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "backedges": [
        ],
        "hl": {
            "back": [],
            "front": [],
            "top": [1,2, 3,0],
        },
        "frontedges": [
        ],
    },

}

const colorMap = {
    "top": new Color(98,129,189,.85),
    "frontlight": new Color(70,85,175,.85),
    "front": new Color(49,60,123,.85),
    "frontdark": new Color(36,45,91,.85),
    "backlight": new Color(70,85,175,.5),
    "back": new Color(49,60,123,.5),
    "backdark": new Color(36,45,91,.5),
    "hl": new Color(0,222,164,.75),
}

function makeWallPath(pos, height, faceInfo, edge) {
    let path = new Path2D();
    path.moveTo(pos.x+faceInfo.verts[edge.v1].x, pos.y+faceInfo.verts[edge.v1].y);
    path.lineTo(pos.x+faceInfo.verts[edge.v1].x, pos.y+faceInfo.verts[edge.v1].y-height);
    path.lineTo(pos.x+faceInfo.verts[edge.v2].x, pos.y+faceInfo.verts[edge.v2].y-height);
    path.lineTo(pos.x+faceInfo.verts[edge.v2].x, pos.y+faceInfo.verts[edge.v2].y);
    path.closePath();
    return path;
}

function makeTopPath(pos, height, faceInfo) {
    let path = new Path2D();
    path.moveTo(pos.x+faceInfo.verts[0].x, pos.y+faceInfo.verts[0].y-height);
    for (let i=1; i<faceInfo.verts.length; i++) {
        path.lineTo(pos.x+faceInfo.verts[i].x, pos.y+faceInfo.verts[i].y-height);
    }
    path.closePath();
    return path;
}

function makeVertHL(pos, height, faceInfo, verts) {
    let path = new Path2D();
    for (let i=0; i<verts.length; i++) {
        path.moveTo(pos.x+faceInfo.verts[verts[i]].x, pos.y+faceInfo.verts[verts[i]].y);
        path.lineTo(pos.x+faceInfo.verts[verts[i]].x, pos.y+faceInfo.verts[verts[i]].y-height);
    }
    path.closePath();
    return path
}

function makeTopHL(pos, height, faceInfo) {
    let path = new Path2D();
    for (let i=0; i<faceInfo.hl.top.length-1; i+=2) {
        let v1 = faceInfo.verts[faceInfo.hl.top[i]];
        let v2 = faceInfo.verts[faceInfo.hl.top[i+1]];
        path.moveTo(pos.x+v1.x, pos.y+v1.y-height);
        path.lineTo(pos.x+v2.x, pos.y+v2.y-height);
    }
    path.closePath();
    return path
}

class ProcWall {
    constructor(pos, id, height) {
        this.shapes = [];
        let faceInfo = faceMap[id];
        if (!faceInfo) {
            //console.log("skipping: " + id);
            return undefined;
        }
        console.log("creating for: " + id);
        let path;
        // add back edges
        for (const edge of faceInfo.backedges) {
            path = makeWallPath(pos, height, faceInfo, edge);
            this.shapes.push(new PathShape(path, true, colorMap[edge.style]));
        }
        // back hl
        path = makeVertHL(pos, height, faceInfo, faceInfo.hl.back);
        this.shapes.push(new PathShape(path, false, colorMap["hl"]));
        //this.shapes.push(new PathShape(path, false, colorMap["hl"].asRGB(.1), 3));
        // bottom highlights
        path = makeTopHL(pos, 0, faceInfo);
        this.shapes.push(new PathShape(path, false, colorMap["hl"], 1));
        //this.shapes.push(new PathShape(path, false, colorMap["hl"].asRGB(.1), 3));
        // add top
        path = makeTopPath(pos, height, faceInfo);
        this.shapes.push(new PathShape(path, true, colorMap["top"]));
        // add top hl
        path = makeTopHL(pos, height, faceInfo);
        this.shapes.push(new PathShape(path, false, colorMap["hl"]));
        //this.shapes.push(new PathShape(path, false, colorMap["hl"].asRGB(.1), 3));
        // add front edges
        for (const edge of faceInfo.frontedges) {
            path = makeWallPath(pos, height, faceInfo, edge);
            this.shapes.push(new PathShape(path, true, colorMap[edge.style]));
        }
        // front hl
        path = makeVertHL(pos, height, faceInfo, faceInfo.hl.front);
        this.shapes.push(new PathShape(path, false, colorMap["hl"]));
        //this.shapes.push(new PathShape(path, false, colorMap["hl"].asRGB(.1), 3));
    }

    update(deltaTime) {
    }

    draw(ctx) {
        for (let i=0; i<this.shapes.length; i++) {
            this.shapes[i].draw(ctx);
        }
    }

}

/**
 * the test environment
 */
class Env {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
    }

    setup() {
        return new Promise((resolve) => {
            // load tileset images
            let promises = [];
            for (const path of allPaths) {
                promises.push(loadImage(path));
            }
            Promise.all(promises).then((imgs) => {
                let promises = [];
                for (const img of imgs) {
                    promises.push(loadTemplateSheet(img, tile_defs, 32));
                }
                Promise.all(promises).then((tilesets) => {
                    g2wTiles = tilesets[0];
                    g2hTiles = tilesets[1];
                    g2vTiles = tilesets[2];
                    g2oTiles = tilesets[3];
                    h2wTiles = tilesets[4];
                    h2gTiles = tilesets[5];
                    w2hTiles = tilesets[6];
                    w2gTiles = tilesets[7];
                    fgTiles  = tilesets[8];
                    v2gTiles  = tilesets[9];
                    resolve();
                });
            });
        });
    }

    start() {
        let tsize = 32;
        let width = 16;
        let height = 12;
        //let width = 8;
        //let height = 8;
        // generate the test grid and level data
        let grid = new Grid(width, height);
        gen(grid);

        // generate the bg overlay based on level data
        let bg_grid = new Grid(width*2, height*2);
        let selectors = [
            new SeamSelector("w2h", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("h2w", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("w2g", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("h2g", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("v2g", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg != tiledefs.ID.VOID)),
            new SeamSelector("g2w", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("g2h", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("g2v", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.VOID)),
            new SeamSelector("g2o", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];
        genFloorOverlay("lvl1", grid, bg_grid, selectors);

        // generate the perspective overlay based on level data
        let fg_grid = new Grid(width*2, height*2);
        genFgOverlay("lvl1", "fg", grid, fg_grid, (v) => (v == tiledefs.ID.WALL) ? 1 : 0);

        // draw grid
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                let v = grid.get_at(i,j);
                let img = floor;
                if (v == tiledefs.ID.WALL) img = wall;
                if (v == tiledefs.ID.HOLE) img = hole;
                if (v == tiledefs.ID.VOID) img = voidimg;
                this.ctx.drawImage(img, tsize*i*2, tsize*j*2, 64, 64);
            }
        }

        // draw background overlay
        let pwalls = [];
        for (let j=0; j<bg_grid.height; j++) {
            for (let i=0; i<bg_grid.width; i++) {
                let v = bg_grid.get_at(i,j);
                let tiles = {};
                let tileid = "";
                if (!v) continue;
                v = v.slice(5);
                let iswall = false;
                if (v.startsWith("w2g")) {
                    tileid = v.slice(4);
                    tiles = w2gTiles;
                    iswall = true;
                } else if (v.startsWith("g2w")) {
                    tileid = v.slice(4);
                    tiles = g2wTiles;
                } else if (v.startsWith("h2g")) {
                    tileid = v.slice(4);
                    tiles = h2gTiles;
                } else if (v.startsWith("g2h")) {
                    tileid = v.slice(4);
                    tiles = g2hTiles;
                } else if (v.startsWith("g2v")) {
                    tileid = v.slice(4);
                    tiles = g2vTiles;
                } else if (v.startsWith("h2w")) {
                    tileid = v.slice(4);
                    tiles = h2wTiles;
                } else if (v.startsWith("w2h")) {
                    tileid = v.slice(4);
                    tiles = w2hTiles;
                    iswall = true;
                } else if (v.startsWith("g2o")) {
                    tileid = v.slice(4);
                    tiles = g2oTiles;
                } else if (v.startsWith("v2g")) {
                    tileid = v.slice(4);
                    tiles = v2gTiles;
                }
                let img = tiles[tileid];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
                // walls
                if (iswall) {
                    let pos = {x:32*i, y:32*j};
                    let pwall = new ProcWall(pos, tileid, 32);
                    if (pwall) pwalls.push(pwall);
                }
            }
        }

        for (const pwall of pwalls) {
            pwall.draw(this.ctx);
        }

    }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
}

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}