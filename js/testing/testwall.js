import { SeamSelector, genFloorOverlay, genSeamOverlay } from "../view/tile-select.js";
import { Grid } from "../system/grid.js";
import { tile_defs } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";
import { procWallGenSelector } from "../view/proc-wall.js";
import { parse_tile_id } from "../game-assets.js";
import { WallModel } from "../view/wall-model.js";
import { Color } from "../system/color.js";

const templatesToLoad = [
    {path: "srcref/ground_template.png", tag: "ground"},
    {path: "srcref/hole_template.png", tag: "hole"},
    {path: "srcref/wall_template.png", tag: "wall"},
    {path: "srcref/void_template.png", tag: "void"},
];

const templates = {};

function drawGrid(ctx, x, y, dimx, dimy, stepx, stepy, style) {
    for (let i=0; i<dimy; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y+stepy*i);
        ctx.lineTo(x+dimx*stepx, y+stepy*i);
        ctx.closePath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = style;
        ctx.stroke();
    }
    for (let i=0; i<dimx; i++) {
        ctx.beginPath();
        ctx.moveTo(x+stepx*i, y);
        ctx.lineTo(x+stepx*i, y+dimy*stepy);
        ctx.closePath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = style;
        ctx.stroke();
    }
}

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
            new SeamSelector("wall", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("hole", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("void", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg != tiledefs.ID.VOID)),
            new SeamSelector("ground", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];
        genFloorOverlay("lvl1", grid, bg_grid, selectors);

        // generate the perspective overlay based on level data
        let seam_grid = new Grid(width*2, height*2);
        genSeamOverlay("lvl1", bg_grid, seam_grid);

        // draw background overlay
        let pwalls = [];
        let pwallgen = new procWallGenSelector("wall");
        let pholegen = new procWallGenSelector("hole");
        for (let j=0; j<bg_grid.height; j++) {
            for (let i=0; i<bg_grid.width; i++) {
                let id = parse_tile_id(bg_grid.get_at(i,j));
                if (!id) continue;
                let template = templates[id.layer];
                if (!template) continue;
                let img = template[id.name];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);

                // walls
                if (id.layer === "wall") {
                    let pos = {x:32*i, y:32*j};
                    let pwall = pwallgen.create(pos, id.name, 32);
                    if (pwall) pwalls.push(pwall);
                } else if (id.layer === "hole") {
                    let pos = {x:32*i, y:32*j};
                    let pwall = pholegen.create(pos, id.name, 20);
                    if (pwall) pwalls.push(pwall);
                }
            }
        }

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

        for (const pwall of pwalls) {
            pwall.draw(this.ctx);
        }

        // test wall model
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(32*8,0, 32*24,32*8);
        drawGrid(this.ctx, 32*8, 0, 24, 8, 32, 32, "gray");
        let models = [ 
            new WallModel(4, 16, 0),
            new WallModel(8, 16, 0),
            new WallModel(16, 16, 0),
            new WallModel(8, 16, 4),
            new WallModel(16, 16, 4),
            new WallModel(4, 16, 2),
        ];
        let shapes = ["ttl", "t", "l", "ltts", "ltt", "oltt", "ltte", "ltb", "b", "btls", "btl", "obtl", "btle", "btr", "r", "rtbs", "rtb", "ortb", "rtbe", "rtt", "ttrs", "ttr", "ottr", "ttre"];
        for (let j=0; j<models.length; j++) {
            for (let i=0; i<shapes.length; i++) {
                let pos = {x:32*(8+i), y:32*j};
                let walls = models[j].getBottomFaces(pos, shapes[i]);
                for (const wall of walls) {
                    this.ctx.fillStyle = "red";
                    this.ctx.fill(wall);
                }
            }
        }
        drawGrid(this.ctx, 32*8, 0, 48, 16, 16, 16, new Color(127,127,127,.25));

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

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}