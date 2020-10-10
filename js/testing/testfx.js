import { ParticleSystem } from "../system/particles.js";
import { GameFxView } from "../game-effects.js";
import { initialize as graphicsInit, TileGrid, set_loaded_assets} from "../system/graphics.js";
import { load_all_assets } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";
import { Grid } from "../system/grid.js";
import { initialize as tileSelectInit, shape_defs, SeamSelector, genFloorOverlay, genSeamOverlay } from "../view/tile-select.js";
import { Vector2 } from "../system/spatial.js";

let last_update_time = Date.now();

class Env {

    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
        this.fxInterval = 2000;
        this.fxTTL = 0;
    }

    genGrid() {
        const width = 20;
        const height = 10;
        const grid = new Grid(width, height);
        // set test level
        for (let lvl=0; lvl<4; lvl++) {
            for (let j=0; j<height/2; j++) {
                for (let i=0; i<width/4; i++) {
                    let lvlida = "LVL" + (lvl+1) + "A";
                    let lvlidb = "LVL" + (lvl+1) + "B";
                    let lvli = lvl*(width*.25)+i;
                    let lvlj_a = j;
                    let lvlj_b = j+height*.5;
                    grid.set_at(tiledefs.ID[lvlida],lvli,lvlj_a);
                    grid.set_at(tiledefs.ID[lvlidb],lvli,lvlj_b);
                }
            }
        }
        return grid;
    }

    genSubGrid(grid) {
        const tileGridSize = new Vector2({x: grid.width*2, y: grid.height*2});
        // translate given grids to display grids
        const floor_grid = new Grid(tileGridSize.x, tileGridSize.y);
        const seam_grid = new Grid(tileGridSize.x, tileGridSize.y);
        const position = new Vector2();
        let selectors = [];
        for (const [id, def] of Object.entries(tiledefs.defs)) {
            if (!def.shape_template) continue;
            selectors.push(new SeamSelector(id, def.tile_match_predicate, def.tile_same_predicate));
        }
        // generate floor
        genFloorOverlay(grid, floor_grid, selectors);
        genSeamOverlay(floor_grid, seam_grid);
        this.floor_tile_grid = new TileGrid(position, tileGridSize, 32, shape_defs, floor_grid.elements);
        this.seam_tile_grid = new TileGrid(position, tileGridSize, 32, shape_defs, seam_grid.elements);
    }

    runFx() {
        for (let gidx=0; gidx<8; gidx++) {
            this.runFxForGrid(gidx);
        }
        // only run in one grid at a time;
        this.runFxForGrid(this.gidx);
        this.gidx++;
        if (this.gidx >= 8) this.gidx = 0;
    }

    runFxForGrid(idx) {
        let fxidx = 0;
        let gsize = 64*5;
        let tilesize = 64;
        let x, y;
        let target = {x:(idx%4)*gsize+32, y:Math.floor((idx)/4)*gsize+32+64*4};
        let posFcn = () => {
            // base x,y from grid index
            x = (idx%4)*gsize;
            y = Math.floor((idx)/4)*gsize;
            // offset for given fxidx
            x += (fxidx%5)*tilesize;
            y += Math.floor((fxidx)/5)*tilesize;
            // middle
            x += 32;
            y += 32;
            // advance fx idx
            fxidx++;
            return {x:x, y:y};
        }
        let p;
        for (const fx of [
            /*
            this.gfx.lightningJump(posFcn(), target),
            this.gfx.jump_up(posFcn()),
            this.gfx.jump_down(posFcn()),
            this.gfx.destruction(posFcn()),
            this.gfx.damage(posFcn()),
            this.gfx.missile(posFcn()),
            this.gfx.deleteBall(posFcn()),
            this.gfx.unstable(posFcn(), this.ctx),
            this.gfx.corrupt(posFcn(), this.ctx),
            this.gfx.repair(posFcn()),
            this.gfx.drop(posFcn()),
            this.gfx.take(posFcn()),
            this.gfx.pushed(p=posFcn(), {x:p.x+64, y:p.y}),
            this.gfx.move(p=posFcn()),
            this.gfx.wait(p=posFcn(), 2000),
            this.gfx.unlockCircle(p=posFcn(), 2),
            this.gfx.scan(p=posFcn()),
            this.gfx.spawn(p=posFcn()),
            */
            this.gfx.portalOut(posFcn()),
        ]) {
            setTimeout(() => {fx.done = true;}, this.fxInterval);
        }
    }

    loop() {
        const now = Date.now();
        const delta_time = Math.min(100,now - last_update_time);
        last_update_time = now;
        // fx run
        this.fxTTL -= delta_time;
        if (this.fxTTL <= 0) {
            this.runFx();
            this.fxTTL = this.fxInterval;
        }
        // draw/updates
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.floor_tile_grid.draw(this.ctx, () => true);
        // run particle system update
        this.particles.update(delta_time);
        this.particles.draw(this.ctx);
        this.gfx.update(delta_time);
        this.gfx.draw(this.ctx);

    }

    setup() {
        const grid = this.genGrid();
        this.genSubGrid(grid);
        this.particles = new ParticleSystem();
        this.particles.alwaysActive = true;
        this.gfx = new GameFxView();
        this.gfx.particleSystem.alwaysActive = true;
        this.gidx = 0;
        return new Promise((resolve) => {
            resolve();
        });
    }

    start() {
        console.log("env: starting loop...");
        setInterval(() => { this.loop(); }, this.INTERVAL);
    }

}

window.onload = async function() {
    const assets = await load_all_assets();
    set_loaded_assets(assets);
    tileSelectInit(tiledefs.defs);
    let env = new Env();
    await env.setup();
    env.start();
}