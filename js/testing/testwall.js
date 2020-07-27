import { SeamSelector, genFloorOverlay, genFgOverlay } from "../view/tile-select.js";
import { Grid } from "../system/grid.js";
import { tile_defs } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";
import { Color } from "../system/color.js";
import { procWallGenSelector } from "../view/proc-wall.js";

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
    grid.set_at(tiledefs.ID.WALL,1,3);
    grid.set_at(tiledefs.ID.WALL,2,4);
    grid.set_at(tiledefs.ID.WALL,3,4);
    grid.set_at(tiledefs.ID.WALL,4,4);
    grid.set_at(tiledefs.ID.WALL,5,4);
    grid.set_at(tiledefs.ID.WALL,6,4);
    grid.set_at(tiledefs.ID.WALL,7,4);
    grid.set_at(tiledefs.ID.WALL,8,3);
    grid.set_at(tiledefs.ID.WALL,4,2);
    grid.set_at(tiledefs.ID.WALL,5,2);
    grid.set_at(tiledefs.ID.WALL,4,3);
    grid.set_at(tiledefs.ID.WALL,5,3);
    grid.set_at(tiledefs.ID.WALL,4,5);
    grid.set_at(tiledefs.ID.WALL,5,5);
    grid.set_at(tiledefs.ID.WALL,4,6);
    grid.set_at(tiledefs.ID.WALL,5,6);

    // carve out test hole
    grid.set_at(tiledefs.ID.HOLE,6,9);
    grid.set_at(tiledefs.ID.HOLE,7,7);
    grid.set_at(tiledefs.ID.HOLE,7,8);
    grid.set_at(tiledefs.ID.HOLE,8,7);
    grid.set_at(tiledefs.ID.HOLE,8,8);
    grid.set_at(tiledefs.ID.HOLE,9,5);
    grid.set_at(tiledefs.ID.HOLE,9,6);
    grid.set_at(tiledefs.ID.HOLE,9,7);
    grid.set_at(tiledefs.ID.HOLE,9,8);
    grid.set_at(tiledefs.ID.HOLE,9,9);
    grid.set_at(tiledefs.ID.WALL,11,4);
    grid.set_at(tiledefs.ID.HOLE,10,5);
    grid.set_at(tiledefs.ID.HOLE,10,6);
    grid.set_at(tiledefs.ID.HOLE,10,7);
    grid.set_at(tiledefs.ID.HOLE,10,8);
    grid.set_at(tiledefs.ID.HOLE,10,9);
    grid.set_at(tiledefs.ID.HOLE,11,7);
    grid.set_at(tiledefs.ID.HOLE,11,8);
    grid.set_at(tiledefs.ID.HOLE,12,7);
    grid.set_at(tiledefs.ID.HOLE,12,8);
    grid.set_at(tiledefs.ID.HOLE,13,9);
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
        let pwallgen = new procWallGenSelector("wall");
        let pholegen = new procWallGenSelector("hole");
        for (let j=0; j<bg_grid.height; j++) {
            for (let i=0; i<bg_grid.width; i++) {
                let v = bg_grid.get_at(i,j);
                let tiles = {};
                let tileid = "";
                if (!v) continue;
                v = v.slice(5);
                let iswall = false;
                let ishole = false;
                if (v.startsWith("w2g")) {
                    tileid = v.slice(4);
                    tiles = w2gTiles;
                    iswall = true;
                } else if (v.startsWith("g2w")) {
                    tileid = v.slice(4);
                    tiles = g2wTiles;
                } else if (v.startsWith("h2g")) {
                    ishole = true;
                    tileid = v.slice(4);
                    tiles = h2gTiles;
                } else if (v.startsWith("g2h")) {
                    tileid = v.slice(4);
                    tiles = g2hTiles;
                } else if (v.startsWith("g2v")) {
                    tileid = v.slice(4);
                    tiles = g2vTiles;
                } else if (v.startsWith("h2w")) {
                    ishole = true;
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
                    let pwall = pwallgen.create(pos, tileid, 32);
                    if (pwall) pwalls.push(pwall);
                } else if (ishole) {
                    let pos = {x:32*i, y:32*j};
                    let pwall = pholegen.create(pos, tileid, 20);
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