// This file contains the code that decides how to display the tiles, background, anything that isn't an item or a character.

export {
    TileGridView,
};

import { Grid } from "../system/grid.js";
import * as tiledefs from "../definitions-tiles.js";
import { SeamSelector, genFloorOverlay, genFgOverlay } from "./tile-select.js";

import * as graphics from "../system/graphics.js";
import { Vector2 } from "../system/spatial.js";
import { PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE } from "./entity-view.js";
import { ParticleGroup, ParticleSystem, ParticleEmitter, FadeLineParticle, BlipParticle, FadeParticle, Color } from "../system/particles.js";
import { random_float, position_from_index } from "../system/utility.js";

let canvas = document.getElementById('gameCanvas');
let canvasContext = canvas.getContext('2d');

// Display tiles.
class TileGridView {
    enable_grid_lines = false;
    enable_overlay = true;
    enable_tile_sprites = true;

    constructor(position, size, ground_tile_grid, surface_tile_grid){
        this.reset(position, size, ground_tile_grid, surface_tile_grid);
    }

    addExitParticles(ctx, x, y) {

        let g = new ParticleGroup();
        this.particles.add(g);
        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25);
            let velocity = random_float(30,60);
            let ttl = random_float(.3, 1.5);
            return new BlipParticle(ctx, x+xoff, y+yoff, g, 0, -velocity, ttl, 10);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25);
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(ctx, x+xoff, y+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25));

    }

    voidSeams = {
        t:      [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
        ttls:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
        rtte:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
        ttl:    [new Vector2({x:22,y:9}), new Vector2({x:31,y:9}), new Vector2({x:9,y:22}), new Vector2({x:22,y:9}), new Vector2({x:9,y:31}), new Vector2({x:9,y:22}), ],
        ttlc:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:22}), ],
        ttle:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
        l:      [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
        ltts:   [new Vector2({x:0,y:31}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:9,y:0}), ],
        ltte:   [new Vector2({x:0,y:9}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:31,y:0}), ],
        ltbs:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
        ltb:    [new Vector2({x:31,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:0}), ],
        ltbc:   [new Vector2({x:0,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:31}), ],
        ltbe:   [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
        b:      [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
        btls:   [new Vector2({x:31,y:31}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:0,y:22}), ],
        btle:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:0,y:0}), ],
        btrs:   [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
        btr:    [new Vector2({x:22,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:22}), ],
        btrc:   [new Vector2({x:22,y:9}), new Vector2({x:31,y:9}), new Vector2({x:9,y:22}), new Vector2({x:22,y:9}), new Vector2({x:9,y:31}), new Vector2({x:9,y:22}), ],
        btre:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
        r:      [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
        rtbs:   [new Vector2({x:31,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:22,y:31}), ],
        rtbe:   [new Vector2({x:31,y:22}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:31}), ],
        rtts:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
        rtt:    [new Vector2({x:0,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:31}), ],
        rttc:   [new Vector2({x:31,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:0}), ],
        rtte:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
        ttrs:   [new Vector2({x:0,y:0}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:31,y:9}), ],
        ttre:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:31,y:31}), ],
    };

    addVoidParticles(ctx, size, idx, floor_grid) {
        let coords = position_from_index(size.x, size.y, idx);
        // compute i,j indices from idx
        let i = coords.x;
        let j = coords.y;
        for (let si=i*2; si<=(i*2+1); si++) {
            for (let sj=j*2; sj<=(j*2+1); sj++) {
                // position is upper-left corner of subtile in world coords
                let pos = new Vector2({x: PIXELS_PER_HALF_SIDE*si, y: PIXELS_PER_HALF_SIDE * sj});
                // tile offset
                let toff = new Vector2({x: PIXELS_PER_HALF_SIDE*(si-i*2), y: PIXELS_PER_HALF_SIDE*(sj-j*2)});
                // center relative to 0,0
                let center = new Vector2({x: PIXELS_PER_HALF_SIDE, y: PIXELS_PER_HALF_SIDE});
                // lookup floor subtile
                let floor = floor_grid.get_at(si, sj);
                if (!floor || floor.length < 8) continue;
                // lookup void seams for specific void tile
                floor = floor.slice(9);
                let seams = this.voidSeams[floor];
                if (!seams || !seams.length) continue;
                // iterate through each void seam
                let seamsFactor = seams.length/2;
                for (let seamIdx=0; seamIdx<seams.length-1; seamIdx+=2) {
                    // seam endpoints
                    let pt1 = seams[seamIdx];
                    let pt2 = seams[seamIdx+1];
                    // directional vector from pt1 to pt2
                    let dir12 = pt2.substract(pt1);
                    let l12 = dir12.length;
                    // direction vector towards center
                    let dirc = new Vector2({x: dir12.y, y: -dir12.x});
                    this.particles.add(new ParticleEmitter(this.particles, () => {
                        // compute startpoint
                        let off = new Vector2(dir12);
                        off.length = random_float(0,l12);
                        let sx = pos.x + pt1.x + off.x;
                        let sy = pos.y + pt1.y + off.y;
                        // compute directional vector from startpoint to center
                        let velocity = new Vector2(dirc);
                        velocity.length = random_float(30,45);
                        let size = random_float(.5,1.5);
                        let ttl = random_float(.3,1);
                        return new FadeParticle(ctx, sx, sy, -velocity.x, -velocity.y, size, new Color(0,222,0), ttl);
                    }, .3*seamsFactor, 25));
                }
            }
        }
    }

    reset(position, size, ground_tile_grid, surface_tile_grid){
        // initialize particle system
        this.particles = new ParticleSystem();
        console.assert(position instanceof Vector2);
        console.assert(size instanceof Vector2 && size.x > 2 && size.y > 2);
        this.position = position;
        this.size = size;

        // translate given grids to display grids
        const bg_grid = new Grid(size.x*2, size.y*2);
        const fg_grid = new Grid(size.x*2, size.y*2);
        let selectors = [
            new SeamSelector("w2h", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("w2v", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg == tiledefs.ID.VOID)),
            new SeamSelector("w2g", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("h2w", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("h2v", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg == tiledefs.ID.VOID)),
            new SeamSelector("h2g", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("v2h", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("v2w", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("v2g", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg != tiledefs.ID.VOID)),
            new SeamSelector("g2w", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("g2h", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("g2v", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.VOID)),
            new SeamSelector("g2o", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];

        // handle floor transitions
        genFloorOverlay("lvl1", ground_tile_grid, bg_grid, selectors);
        // handle surface transitions
        genFgOverlay("lvl1", "fg", ground_tile_grid, fg_grid, (v) => (v == tiledefs.ID.WALL) ? 1 : 0);
        genFgOverlay("lvl1", "laser", ground_tile_grid, fg_grid, (v) => (v == tiledefs.ID.HOLE) ? 1 : 0);
        // filter out all wall/ground tiles from fg
        const midData = new Array(size.x * size.y);
        for (let i=0; i<midData.length; i++) {
            const surface_element = ground_tile_grid.elements[i];
            if (surface_element == tiledefs.ID.WALL) continue;
            if (surface_element == tiledefs.ID.GROUND) continue;
            if (surface_element == tiledefs.ID.VOID) continue;
            midData[i] = surface_element;
        }
        for (let i=0; i<surface_tile_grid.elements.length; i++) {
            if (surface_tile_grid.elements[i] == tiledefs.ID.EXIT) {
                let pos = position_from_index(size.x, size.y, i);
                this.addExitParticles(canvasContext, pos.x*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE, pos.y*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE);
            } 
            if (ground_tile_grid.elements[i] == tiledefs.ID.VOID) {
                this.addVoidParticles(canvasContext, size, i, bg_grid);
            }
        }

        const dsize = new Vector2({x: size.x*2, y: size.y*2});
        // TODO: replace this by just tiles we use, not all tiles in the world
        // FIXME: for now, enable_overlay is the switch between the old tile display and the new tile display
        if (this.enable_overlay) {
            this.ground_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, bg_grid.elements);
            this.mid_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, midData);
            this.surface_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, fg_grid.elements);
            this.floor_top_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, surface_tile_grid.elements);
        } else {
            this.ground_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid.elements);
            this.surface_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid.elements);
        }
        this.ground_tile_grid.enable_draw_background = true; // display the background
    }

    get width() { return this.size.x; }
    get height() { return this.size.y; }

    update(delta_time){
        this.ground_tile_grid.update(delta_time);
        if (this.enable_overlay) {
            this.mid_tile_grid.update(delta_time);
        }
        this.surface_tile_grid.update(delta_time);
        this.floor_top_tile_grid.update(delta_time);
        // particles
        this.particles.update(delta_time);
    }

    draw_floor(){
        if(this.enable_tile_sprites)
            this.ground_tile_grid.draw();

        if(this.enable_grid_lines){
            graphics.draw_grid_lines(this.size.x, this.size.y, PIXELS_PER_TILES_SIDE, this.position);
        }
        this.floor_top_tile_grid.draw();
    }

    draw_surface(){

        if(this.enable_tile_sprites){
            if (this.enable_overlay) {
                this.mid_tile_grid.draw();
            }

            this.surface_tile_grid.draw();
            // particles
            this.particles.draw();
        }

    }

};


