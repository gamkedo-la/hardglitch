import { 
    ParticleSystem, 
    ParticleEmitter, 
    ParticleSequence, 
    FadeLineParticle, 
    ColorGlitchParticle, 
    OffsetGlitchParticle, 
    FadeParticle, 
    BlipParticle, 
    ParticleGroup, 
    SwirlPrefab, 
    RingParticle, 
    ShootUpParticle, 
    FlashParticle,
    ThrobParticle,
    LightningParticle,
    ColorOffsetGlitchParticle,
    TraceParticle,
    TraceArcParticle,
    ComboLockParticle,
    ScanLineParticle,
} from "../system/particles.js";
import { GameFxView } from "../game-effects.js";
import { random_int, random_float } from "../system/utility.js";
import { Color } from "../system/color.js";
import { initialize as graphicsInit, TileGrid} from "../system/graphics.js";
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
        /*
        this.bgimg;
        // setup environment
        this.particles = new ParticleSystem();
        this.particles.alwaysActive = true;
        this.tests = new Tests(this.particles);
        this.gfx = new GameFxView();
        this.gfx.particleSystem.alwaysActive = true;

        //this.tests.blipfade(100,300);
        this.tests.fade(200,300);
        this.tests.linefade(300,300);
        this.tests.offsetglitch(400,300);
        this.tests.colorglitch(400,300);
        this.tests.swirl(500,300);
        this.tests.rings(600,300);
        this.tests.shootup(700,300);
        this.tests.flash(800,300);
        this.tests.combo(900,300);
        this.tests.missile(1000,300);
        this.tests.lightningorb(200,400);
        this.tests.lightningstrike(200,500);
        this.tests.colorshift(400, 400);
        this.tests.trace(500, 400);
        this.tests.traceArc(500, 500);
        this.tests.combolock(600, 400);
        this.tests.scan(900, 500, 1);
        this.tests.scan(900, 500, 2);
        this.tests.scan(900, 500, 3);
        this.tests.scan(900, 500, 4);

        for (const fx of [
            this.gfx.destruction({x:500,y:400}),
            this.gfx.damage({x:600,y:400}),
            this.gfx.lightningJump({x:500,y:500}, {x:600,y:600}),
            //this.gfx.unstable({x:400+32,y:400-64}),
            this.gfx.repair({x:700,y:400}),
            this.gfx.drop({x:800,y:400}),
            this.gfx.jump_up({x:900,y:400}),
            this.gfx.wait({x:200,y:500}, 700),
            this.gfx.action({x:300,y:500}),
            //this.gfx.corrupt({x:400+32,y:400-64}),
            //this.gfx.corrupt({x:368+32+64*1,y:336+32}),
            //this.gfx.unstable({x:368+32,y:336+32}),
            this.gfx.unlockTriangle({x:700,y:400}, 3),
            this.gfx.unlockPlus({x:800,y:400}, 3),
            this.gfx.unlockEqual({x:900,y:400}, 3),
            this.gfx.unlockCircle({x:700,y:500}, 3),
            this.gfx.scan({x:800,y:500}, 3),
            this.gfx.spawn({x:800,y:600}, 3),
        ]) {
            setTimeout(() => {fx.done = true;}, 5000);
        }
        */

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

    loop() {
        const now = Date.now();
        const delta_time = Math.min(100,now - last_update_time);
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.floor_tile_grid.draw(this.ctx, () => true);
        /*
        this.ctx.drawImage(this.bgimg, 368, 236);
        this.ctx.drawImage(this.groundimg, 368, 336);
        this.ctx.drawImage(this.groundimg, 368-64, 336);
        this.ctx.drawImage(this.groundimg, 368+64, 336);
        // run particle system update
        this.particles.update(delta_time);
        this.particles.draw(this.ctx);
        this.gfx.update(delta_time);
        this.gfx.draw(this.ctx);
        */

    }

    setup() {
        const grid = this.genGrid();
        this.genSubGrid(grid);
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
    graphicsInit(assets);
    tileSelectInit(tiledefs.defs);
    let env = new Env();
    await env.setup();
    env.start();
}