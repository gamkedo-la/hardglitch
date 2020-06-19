// This file contains the code that decides how to display the tiles, background, anything that isn't an item or a character.

export {
    TileGridView,
};

import { Grid } from "../system/grid.js";
import * as tiledefs from "../definitions-tiles.js";
import { SeamSelector, genFloorOverlay, genFgOverlay } from "./tile-select.js";

import * as graphics from "../system/graphics.js";
import { Vector2 } from "../system/spatial.js";
import { PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE } from "./common-view.js";
import { ParticleSystem, ParticleEmitter, FadeLineParticle, FadeParticle, Color } from "../system/particles.js";
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

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25);
            let velocity = random_float(1,3);
            let ticks = random_float(10,60);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(ctx, x+xoff, y+yoff, 0, -velocity, new Color(0,255,0), ticks, len, width, 0, 1);
        }, 10));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(1,3);
            let size = random_float(1,4);
            let ticks = random_float(10,50);
            return new FadeParticle(ctx, x+xoff, y+yoff, 0, -velocity, size, new Color(0,255,255), ticks);
        }, 10));

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
            new SeamSelector("h2w", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("g2w", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.WALL)),
            new SeamSelector("g2h", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg == tiledefs.ID.HOLE)),
            new SeamSelector("w2g", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("h2g", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("g2o", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];
        // handle floor transitions
        genFloorOverlay("lvl1", ground_tile_grid, bg_grid, selectors);
        // handle surface transitions
        genFgOverlay("lvl1", "fg", ground_tile_grid, fg_grid);
        // filter out all wall/ground tiles from fg
        const midData = new Array(size.x * size.y);
        for (let i=0; i<midData.length; i++) {
            const surface_element = ground_tile_grid.elements[i];
            if (surface_element == tiledefs.ID.WALL) continue;
            if (surface_element == tiledefs.ID.GROUND) continue;
            midData[i] = surface_element;
        }
        for (let i=0; i<surface_tile_grid.elements.length; i++) {
            if (surface_tile_grid.elements[i] == tiledefs.ID.EXIT) {
                let pos = position_from_index(size.x, size.y, i);
                this.addExitParticles(canvasContext, pos.x*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE, pos.y*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE);
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
            this.particles.update();
        }

    }

};


