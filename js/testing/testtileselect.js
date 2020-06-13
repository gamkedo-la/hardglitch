import { SeamSelector, genFloorOverlay } from "../tile-select.js";
import { Grid } from "../system/grid.js";

// hard-coded bg tiles
const wall = new Image();
wall.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADRJREFUWIXtzjEBADAIxMCnKiqlK/5FFRksFwO5uq9/FjubcwAAAAAAAAAAAAAAAAAAgCQZQm4B0KN9/LwAAAAASUVORK5CYII=";
const floor = new Image();
floor.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADVJREFUWIXtzkEBADAIxLBjSuZf1gRgYcjgkxpoqt/9WexszgEAAAAAAAAAAAAAAAAAAJJkAF3RAy8pxiovAAAAAElFTkSuQmCC";
const hole = new Image();
hole.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAGJJREFUWIXt1rENwDAIRNFL5CHSUFK4ZxrPnA08TLIDRCLFpz/xJAruWNd6lBwP1753Ni4P15lOfzQAAAAAAABAO2B4eDps00rLbZpG5Z9LKvUB6QcnAAAAAAAAANoB7X3gBR0LDRuz+iG/AAAAAElFTkSuQmCC";

/**
 * template map defines the position of named tiles within the tileset template where each coordinate is given as a grid index {i,j}
 */
let templateMap = {
    t:      {i:7,   j:1},
    ot:     {i:7,   j:0},
    m:      {i:7,   j:2},
    om:     {i:3,   j:3},
    ttls:   {i:6,   j:1},
    ttl:    {i:5,   j:1},
    ttlc:   {i:7,   j:3},
    ttle:   {i:5,   j:2},
    ottls:  {i:5,   j:0},
    ottl:   {i:4,   j:0},
    ottle:  {i:4,   j:1},
    l:      {i:1,   j:7},
    ol:     {i:0,   j:7},
    ltts:   {i:5,   j:4},
    ltt:    {i:5,   j:5},
    ltte:   {i:4,   j:5},
    ltti:   {i:5,   j:3},
    oltts:  {i:4,   j:3},
    oltt:   {i:4,   j:4},
    oltte:  {i:3,   j:4},
    olttc:  {i:1,   j:1},
    ltbs:   {i:1,   j:9},
    ltb:    {i:1,   j:10},
    ltbc:   {i:7,   j:4},
    ltbe:   {i:2,   j:10},
    ltbi:   {i:2,   j:9},
    oltbs:  {i:0,   j:10},
    oltb:   {i:0,   j:11},
    oltbe:  {i:1,   j:11},
    b:      {i:3,   j:10},
    ob:     {i:2,   j:11},
    bi:     {i:3,   j:9},
    btls:   {i:4,   j:10},
    btlsi:  {i:4,   j:9},
    btl:    {i:5,   j:10},
    btle:   {i:5,   j:11},
    btli:   {i:5,   j:9},
    obtls:  {i:3,   j:11},
    obtl:   {i:4,   j:11},
    obtle:  {i:4,   j:12},
    obtlc:  {i:1,   j:2},
    btrs:   {i:9,   j:14},
    btr:    {i:10,  j:14},
    btrc:   {i:8,   j:4},
    btre:   {i:10,  j:13},
    btri:   {i:9,   j:13},
    obtrs:  {i:10,  j:15},
    obtr:   {i:11,  j:15},
    obtre:  {i:11,  j:14},
    r:      {i:10,  j:12},
    or:     {i:15,  j:6},
    rtbs:   {i:10,  j:11},
    rtb:    {i:10,  j:10},
    rtbei:  {i:11,  j:9},
    rtbe:   {i:11,  j:10},
    rtbi:   {i:10,  j:9},
    ortbs:  {i:11,  j:12},
    ortb:   {i:11,  j:11},
    ortbe:  {i:12,  j:11},
    ortbc:  {i:2,   j:2},
    rtts:   {i:10,  j:2},
    rtt:    {i:10,  j:1},
    rttc:   {i:8,   j:3},
    rtte:   {i:9,   j:1},
    ortts:  {i:11,  j:1},
    ortt:   {i:11,  j:0},
    ortte:  {i:10,  j:0},
    ttrs:   {i:11,  j:5},
    ttr:    {i:10,  j:5},
    ttre:   {i:10,  j:4},
    ttri:   {i:10,  j:3},
    ottrs:  {i:12,  j:4},
    ottr:   {i:11,  j:4},
    ottre:  {i:11,  j:3},
    ottrc:  {i:2,   j:1},
};

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
 * random generator for a grid, uses 0 for empty, 1 for wall
 * @param {*} grid - the grid to populate
 * @param {*} wallPct - percentage of walls
 * @param {*} holePct - percentage of holes
 */
function gen(grid, wallPct, holePct) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let r = Math.random();
            let v = 0;              // ground
            if (r <= wallPct) {
                v = 1;              // wall
            } else if (r <= wallPct+holePct) {
                v = 2;              // hole
            }
            grid.set_at(v,i,j);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genPerspectiveOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            // compute neighbors
            let p = {i:i, j:j};
            let neighbors = grid.right(p) + (grid.up(p) << 1) + (grid.left(p) << 2) + (grid.down(p)<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            switch (neighbors) {
                case 0: // none
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 1: // right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = (grid.dr(p)) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    }
                    break;
                case 2: // top
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 3: // top|right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = (grid.dr(p)) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    } else { // empty
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 4: // left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = "btrs";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    }
                    break;
                case 5: // left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "bi";
                        tr = (grid.dr(p)) ? "btlsi" : "bi";
                        bl = (grid.dl(p)) ? "rtbe": "b";
                        br = (grid.dr(p)) ? "btls": "b";
                    }
                    break;
                case 6: // top|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                    }
                    break;
                case 7: // top|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "bi";
                        tr = (grid.dl(p)) ? "btlsi" : "bi";
                        bl = (grid.dl(p)) ? "rtbe": "b";
                        br = (grid.dr(p)) ? "btls": "b";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 8: // down
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "ttl";
                        tr = (grid.dr(p)) ? "ttri" : "rtt";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 9: // down|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "ttl";
                        tr = (grid.dr(p)) ? "ttls" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "m" : "rtb";
                    } else { // empty
                        tr = (grid.dr(p)) ? "oltts" : "";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
                case 10: // top|down
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "l";
                        tr = (grid.dr(p)) ? "ttri" : "r";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else {
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 11: // top|down|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "l";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between oltts and obtl
                        tr = (grid.dr(p)) ? "oltts" : (grid.ur(p)) ? "obtl" : "";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                    }
                    break;
                case 12: // down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtte" : "btli";
                        tr = (grid.dr(p)) ? "ttri" : "rtt";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottre" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 13: // down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "t" : "btli";
                        tr = (grid.dr(p)) ? "t" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottre" : "";
                        tr = (grid.dr(p)) ? "oltts" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
                case 14: // top|down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = (grid.dr(p)) ? "ttri" : "r";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        tl = (grid.dl(p)) ? "ottre" : (grid.ul(p)) ? "ortb" : "";
                        //tl = (grid.ul(p)) ? "ortb" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 15: // top|down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        // FIXME: conflict between oltts and obtl
                        tl = (grid.dl(p)) ? "ottre" : (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.dr(p)) ? "oltts" : (grid.ur(p)) ? "obtl" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set_at(tl, i*2, j*2);
            if (tr) overlay.set_at(tr, i*2+1, j*2);
            if (bl) overlay.set_at(bl, i*2, j*2+1);
            if (br) overlay.set_at(br, i*2+1, j*2+1);
        }
    }
}

/**
 * a grid of data
 */
/*
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Array(width*height);
    }

    idx(p, j) {
        if (typeof p === 'number') {
            return (p) % this.width + this.width*j;
        }
        return (p.i) % this.width + this.width*p.j;
    }

    set(v, p, j) {
        let idx = this.idx(p, j);
        this.data[idx] = v;
    }

    get(p,j) {
        let idx = this.idx(p, j);
        return this.data[idx];
    }

    left(p, dflt=0) {
        if (p.i>0) {
            let idx = this.idx(p.i-1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    right(p, dflt=0) {
        if (p.i<this.width-1) {
            let idx = this.idx(p.i+1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    up(p, dflt=0) {
        if (p.j>0) {
            let idx = this.idx(p.i, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    down(p, dflt=0) {
        if (p.j<this.height-1) {
            let idx = this.idx(p.i, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    ul(p, dflt=0) {
        if (p.i>0 && p.j>0) {
            let idx = this.idx(p.i-1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    ur(p, dflt=0) {
        if (p.i<this.width-1 && p.j>0) {
            let idx = this.idx(p.i+1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    dl(p, dflt=0) {
        if (p.i>0 && p.j<this.height-1) {
            let idx = this.idx(p.i-1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    dr(p, dflt=0) {
        if (p.i<this.width-1 && p.j<this.height-1) {
            let idx = this.idx(p.i+1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }
}
*/


/**
 * the test game/environment
 */
class Game {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
    }


    play() {
        let tsize = 32;
        let width = 16;
        let height = 12;
        //let width = 8;
        //let height = 8;
        // generate the test grid and level data
        let grid = new Grid(width, height);
        gen(grid, .35, .1);

        // generate the bg overlay based on level data
        let bg2 = new Grid(width*2, height*2);
        let selectors = [
            new SeamSelector("w2h", (fg) => (fg==1), (bg) => (bg == 2)),
            new SeamSelector("h2w", (fg) => (fg==2), (bg) => (bg == 1)),
            new SeamSelector("g2w", (fg) => (fg==0), (bg) => (bg == 1)),
            new SeamSelector("g2h", (fg) => (fg==0), (bg) => (bg == 2)),
            new SeamSelector("w2g", (fg) => (fg==1), (bg) => (bg != 1)),
            new SeamSelector("h2g", (fg) => (fg==2), (bg) => (bg != 2)),
            new SeamSelector("g2o", (fg) => (fg==0), (bg) => (bg != 0)),
        ];
        genFloorOverlay("lvl1", grid, bg2, selectors);

        // generate the perspective overlay based on level data
        let poverlay = new Grid(width*2, height*2);
        genPerspectiveOverlay(grid, poverlay);

        // draw grid
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                let v = grid.get_at(i,j);
                let img = floor;
                if (v == 1) img = wall;
                if (v == 2) img = hole;
                this.ctx.drawImage(img, tsize*i*2, tsize*j*2, 64, 64);
            }
        }

        // draw background overlay
        /*
        for (let j=0; j<bgoverlay.height; j++) {
            for (let i=0; i<bgoverlay.width; i++) {
                let v = bgoverlay.get_at(i,j);
                if (!v) continue;
                let img = bgtiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }
        */
        for (let j=0; j<bg2.height; j++) {
            for (let i=0; i<bg2.width; i++) {
                let v = bg2.get_at(i,j);
                let tiles = {};
                if (!v) continue;
                v = v.slice(5);
                //console.log("v: " + v);
                if (v.startsWith("w2g")) {
                    v = v.slice(4);
                    tiles = w2gTiles;
                } else if (v.startsWith("g2w")) {
                    v = v.slice(4);
                    tiles = g2wTiles;
                } else if (v.startsWith("h2g")) {
                    v = v.slice(4);
                    tiles = h2gTiles;
                } else if (v.startsWith("g2h")) {
                    v = v.slice(4);
                    tiles = g2hTiles;
                } else if (v.startsWith("h2w")) {
                    v = v.slice(4);
                    tiles = h2wTiles;
                } else if (v.startsWith("w2h")) {
                    v = v.slice(4);
                    tiles = w2hTiles;
                } else if (v.startsWith("g2o")) {
                    v = v.slice(4);
                    tiles = g2oTiles;
                }
                let img = tiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

        // draw perspective overlay
        /*
        for (let j=0; j<poverlay.height; j++) {
            for (let i=0; i<poverlay.width; i++) {
                let v = poverlay.get_at(i,j);
                if (!v) continue;
                let img = walltiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }
        */

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

function start() {
    let game = new Game();
    game.play();
}

const groundToWallPath = "srcref/groundToWall.png";
const groundToHolePath = "srcref/groundToHole.png";
const groundToOtherPath = "srcref/groundToOther.png";
const holeToWallPath = "srcref/holeToWall.png";
const holeToGroundPath = "srcref/holeToGround.png";
const wallToHolePath = "srcref/wallToHole.png";
const wallToGroundPath = "srcref/wallToGround.png";
const allPaths = [groundToWallPath, groundToHolePath, groundToOtherPath, holeToWallPath, holeToGroundPath, wallToHolePath, wallToGroundPath];

//const bgTemplatePath = "srcref/wallToGround.png";
//const tileTemplatePath = "srcref/tiletemplate.png";
//const bgTemplatePath = "srcref/colortest1_bg.png";
//const tileTemplatePath = "srcref/colortest1.png";
//const bgTemplatePath = "srcref/colortest2_bg.png";
//const tileTemplatePath = "srcref/colortest2.png";
//const bgTemplatePath = "srcref/colortest3_bg.png";
//const tileTemplatePath = "srcref/colortest3.png";
//const bgTemplatePath = "srcref/colortest4_bg.png";
//const tileTemplatePath = "srcref/colortest4.png";

let g2wTiles;
let g2hTiles;
let g2oTiles;
let h2wTiles;
let h2gTiles;
let w2hTiles;
let w2gTiles;

function setup() {
    return new Promise((resolve) => {
        // load tileset images
        let promises = [];
        for (const path of allPaths) {
            promises.push(loadImage(path));
        }
        Promise.all(promises).then((imgs) => {
            let promises = [];
            for (const img of imgs) {
                promises.push(loadTemplateSheet(img, templateMap, 32));
            }
            Promise.all(promises).then((tilesets) => {
                g2wTiles = tilesets[0];
                g2hTiles = tilesets[1];
                g2oTiles = tilesets[2];
                h2wTiles = tilesets[3];
                h2gTiles = tilesets[4];
                w2hTiles = tilesets[5];
                w2gTiles = tilesets[6];
                resolve();
            });
        });
    });
}

window.onload = function() {
    let promise = setup();
    promise.then( () => start());
}