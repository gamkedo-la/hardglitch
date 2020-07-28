import { SeamSelector, genFloorOverlay, genSeamOverlay } from "../view/tile-select.js";
import { Grid } from "../system/grid.js";
import { tile_defs, parse_tile_id } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";
import { ofmt } from "../system/utility.js";

function loadTemplateSheet(tag, sheet, map, tilesize) {
    return new Promise((resolve) => {
        let tileset = {};
        // create tilebuffer to be used to extract images from tilesheet
        let tileBuffer = document.createElement('canvas');
        tileBuffer.width = tilesize;
        tileBuffer.height = tilesize;
        let ctx = tileBuffer.getContext('2d');
        let promises = [];
        for (const k of Object.keys(map)) {
            ctx.clearRect(0, 0, tileBuffer.width, tileBuffer.height);
            let p = map[k];
            // draw the image to the tile buffer
            ctx.drawImage(sheet, p.i*tilesize, p.j*tilesize, tilesize, tilesize, 0, 0, tilesize, tilesize);
            // create a new image element, copying data from tile buffer
            let promise = loadImage(tileBuffer.toDataURL());
            promise.then(rec => tileset[k] = rec.img);
            promises.push(promise);
        }
        // wait for all images to be loaded... then resolve tileset
        Promise.all(promises).then(() => {
            resolve({tag: tag, template: tileset});
        });
    });
}

function gentest(grid) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            grid.set_at(tiledefs.ID.GROUND,i,j);
        }
    }
    grid.set_at(tiledefs.ID.WALL,0,0);
    grid.set_at(tiledefs.ID.WALL,1,0);
    grid.set_at(tiledefs.ID.WALL,0,1);
    grid.set_at(tiledefs.ID.HOLE,2,2);
    grid.set_at(tiledefs.ID.HOLE,2,3);
    grid.set_at(tiledefs.ID.WALL,3,3);
    grid.set_at(tiledefs.ID.HOLE,2,4);

    grid.set_at(tiledefs.ID.HOLE,5,5);
    grid.set_at(tiledefs.ID.HOLE,6,5);
    grid.set_at(tiledefs.ID.HOLE,7,5);
    grid.set_at(tiledefs.ID.VOID,5,6);
    grid.set_at(tiledefs.ID.VOID,6,6);
    grid.set_at(tiledefs.ID.HOLE,7,6);
    grid.set_at(tiledefs.ID.HOLE,5,7);
    grid.set_at(tiledefs.ID.HOLE,6,7);
    grid.set_at(tiledefs.ID.HOLE,7,7);
}

/**
 * random generator for a grid, uses 0 for empty, 1 for wall
 * @param {*} grid - the grid to populate
 * @param {*} wallPct - percentage of walls
 * @param {*} holePct - percentage of holes
 */
function genrand(grid, wallPct, holePct, voidPct) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let r = Math.random();
            let v = tiledefs.ID.GROUND;              // ground
            if (r <= wallPct) {
                v = tiledefs.ID.WALL;              // wall
            } else if (r <= wallPct+holePct) {
                v = tiledefs.ID.HOLE;              // hole
            } else if (r <= wallPct+holePct+voidPct) {
                v = tiledefs.ID.VOID;              // hole
            }
            grid.set_at(v,i,j);
        }
    }
}


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
        //let width = 16;
        //let height = 12;
        let width = 8;
        let height = 8;
        // generate the test grid and level data
        let grid = new Grid(width, height);
        genrand(grid, .35, .1, .05);
        //gentest(grid);

        // generate the bg overlay based on level data
        let bg_grid = new Grid(width*2, height*2);
        let selectors = [
            new SeamSelector("wall", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("hole", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("void", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg != tiledefs.ID.VOID)),
            new SeamSelector("ground", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];
        genFloorOverlay("lvl1", grid, bg_grid, selectors);

        // draw background overlay
        for (let j=0; j<bg_grid.height; j++) {
            for (let i=0; i<bg_grid.width; i++) {
                let id = parse_tile_id(bg_grid.get_at(i,j));
                if (!id) continue;
                let template = templates[id.layer];
                if (!template) continue;
                let img = template[id.name];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

        // create seams
        let seam_grid = new Grid(width*2, height*2);
        genSeamOverlay("lvl1", bg_grid, seam_grid, selectors);

        // draw seam overlay
        for (let j=0; j<seam_grid.height; j++) {
            for (let i=0; i<seam_grid.width; i++) {
                let v = seam_grid.get_at(i,j);
                let id = parse_tile_id(v);
                if (!id.layer) continue;
                let template = templates[id.layer];
                if (!template) continue;
                let img = template[id.name];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

        // draw perspective overlay
        /*
        for (let j=0; j<fg_grid.height; j++) {
            for (let i=0; i<fg_grid.width; i++) {
                let v = fg_grid.get_at(i,j);
                if (!v) continue;
                v = v.slice(8);
                let img = fgTiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }
        */

    }
}

function loadImage(src, tag) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve({img: img, tag: tag}));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
}

function start() {
    let game = new Game();
    game.play();
}

const templatesToLoad = [
    {path: "srcref/groundtemplate.png", tag: "ground"},
    {path: "srcref/holetemplate.png", tag: "hole"},
    {path: "srcref/walltemplate.png", tag: "wall"},
    {path: "srcref/voidtemplate.png", tag: "void"},
];

const templates = {};

function setup() {
    return new Promise((resolve) => {
        // load tileset images
        let promises = [];
        for (const item of templatesToLoad) {
            promises.push(loadImage(item.path, item.tag));
        }
        Promise.all(promises).then((imgRecs) => {
            let promises = [];
            for (const rec of imgRecs) {
                promises.push(loadTemplateSheet(rec.tag, rec.img, tile_defs, 32));
            }
            Promise.all(promises).then((tmpRecs) => {
                for (const rec of tmpRecs) {
                    templates[rec.tag] = rec.template;
                }
                resolve();
            });
        });
    });
}

window.onload = function() {
    let promise = setup();
    promise.then( () => start());
}