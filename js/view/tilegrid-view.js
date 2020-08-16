// This file contains the code that decides how to display the tiles, background, anything that isn't an item or a character.

export {
    TileGridView,
};

import { config } from "../game-config.js";

import { Grid } from "../system/grid.js";
import * as tiledefs from "../definitions-tiles.js";
import { SeamSelector, genFloorOverlay, genSeamOverlay } from "./tile-select.js";

import * as graphics from "../system/graphics.js";
import { Vector2 } from "../system/spatial.js";
import { PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, graphic_position } from "./entity-view.js";
import { TileGraphBuilder } from "./particle-graph.js";
import { GameFxView } from "../game-effects.js";
import { position_from_index, ofmt } from "../system/utility.js";
import { parse_tile_id } from "../game-assets.js";
import { procWallGenSelector, ProcWallSystem } from "./proc-wall.js";

// Display tiles.
class TileGridView {
    _enable_grid_lines = false;
    _enable_overlay = true;
    _enable_tile_sprites = true;

    constructor(position, size, ground_tile_grid, surface_tile_grid){
        this.reset(position, size, ground_tile_grid, surface_tile_grid);
        this._offscreen_floor_canvas_context = this._create_offscreen_canvas_context();
        this._offscreen_surface_canvas_context = this._create_offscreen_canvas_context();
        this._offscreen_canvas_context = this._create_offscreen_canvas_context();
    }

    get enable_grid_lines() { return this._enable_grid_lines; }
    set enable_grid_lines(enabled) {
        console.assert(typeof enabled === "boolean");
        if(this._enable_grid_lines !== enabled){
            this._redraw_floor_requested = true;
            this._enable_grid_lines = enabled;
        }
    }

    get enable_overlay() { return this._enable_overlay; }
    set enable_overlay(enabled) {
        console.assert(typeof enabled === "boolean");
        if(this._enable_overlay !== enabled){
            this._redraw_floor_requested = true;
            this._redraw_surface_requested = true;
            this._enable_overlay = enabled;
        }
    }

    get enable_tile_sprites() { return this._enable_tile_sprites; }
    set enable_tile_sprites(enabled) {
        console.assert(typeof enabled === "boolean");
        if(this._enable_tile_sprites !== enabled){
            this._redraw_floor_requested = true;
            this._redraw_surface_requested = true;
            this._enable_tile_sprites = enabled;
        }
    }

    reset(position, size, ground_tile_grid, surface_tile_grid){
        // initialize game fx view
        this.fx_view = new GameFxView();
        console.assert(position instanceof Vector2);
        console.assert(size instanceof Vector2 && size.x > 2 && size.y > 2);
        this.position = position;
        this.size = size;
        // FIXME: figure out better way of allocating wall model
        let wallgen = procWallGenSelector("wall");
        this.gb = new TileGraphBuilder(size.x*PIXELS_PER_TILES_SIDE, wallgen.model);
        this.procWallSys = new ProcWallSystem();

        // translate given grids to display grids
        const floor_grid = new Grid(size.x*2, size.y*2);
        const seam_grid = new Grid(size.x*2, size.y*2);
        let selectors = [
            new SeamSelector("wall", (fg) => (fg==tiledefs.ID.WALL), (bg) => (bg != tiledefs.ID.WALL)),
            new SeamSelector("void", (fg) => (fg==tiledefs.ID.VOID), (bg) => (bg != tiledefs.ID.VOID)),
            new SeamSelector("hole", (fg) => (fg==tiledefs.ID.HOLE), (bg) => (bg != tiledefs.ID.HOLE)),
            new SeamSelector("ground2", (fg) => (fg==tiledefs.ID.GROUND2), (bg) => (bg != tiledefs.ID.GROUND2)),
            new SeamSelector("ground", (fg) => (fg==tiledefs.ID.GROUND), (bg) => (bg != tiledefs.ID.GROUND)),
        ];

        // generate floor
        genFloorOverlay("lvl1", ground_tile_grid, floor_grid, selectors);
        genSeamOverlay("lvl1", floor_grid, seam_grid);

        // generate tile-specific effects
        for (let i=0; i<surface_tile_grid.elements.length; i++) {
            if (surface_tile_grid.elements[i] === tiledefs.ID.EXIT) {
                let pos = position_from_index(size.x, size.y, i);
                this.fx_view.exitPortal({x: pos.x*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE, y: pos.y*PIXELS_PER_TILES_SIDE + PIXELS_PER_HALF_SIDE});
            }
            if (ground_tile_grid.elements[i] === tiledefs.ID.VOID) {
                let coords = position_from_index(size.x, size.y, i);
                for (let si=coords.x*2; si<=(coords.x*2+1); si++) {
                    for (let sj=coords.y*2; sj<=(coords.y*2+1); sj++) {
                        let pos = new Vector2({x: PIXELS_PER_HALF_SIDE*si, y: PIXELS_PER_HALF_SIDE * sj});
                        let id = parse_tile_id(floor_grid.get_at(si, sj));
                        if (!id.name) continue;
                        this.fx_view.voidEdge(pos, id.name);
                    }
                }
            }
        }

        // generate walls
        let pwallgen = procWallGenSelector("wall");
        let pholegen = procWallGenSelector("hole");
        for (let i=0; i<floor_grid.elements.length; i++) {
            let coords = position_from_index(size.x*2, size.y*2, i);
            let pos = {x: coords.x*PIXELS_PER_HALF_SIDE, y:coords.y*PIXELS_PER_HALF_SIDE};
            let id = parse_tile_id(floor_grid.elements[i]);
            if (id) {
                if (id.layer === "wall") {
                    let pwall = pwallgen.create(pos, id.name, 32);
                    if (pwall) this.procWallSys.add(pwall);
                } else if (id.layer === "hole") {
                    let pwall = pholegen.create(pos, id.name, 16);
                    if (pwall) this.procWallSys.add(pwall);
                }
            }
            id = parse_tile_id(seam_grid.elements[i]);
            if (id) {
                if (id.layer === "wall") {
                    let pwall = pwallgen.create(pos, id.name, 32);
                    if (pwall) this.procWallSys.add(pwall);
                } else if (id.layer === "hole") {
                    let pwall = pholegen.create(pos, id.name, 16);
                    if (pwall) this.procWallSys.add(pwall);
                }
            }
        }

        // add blip effects to walls
        let addblip = true;
        if (addblip) {
            for (let i=0; i<floor_grid.elements.length; i++) {
                let pos = position_from_index(size.x*2, size.y*2, i);
                let id = parse_tile_id(floor_grid.elements[i]);
                if (!id || id.layer != "wall") continue;
                this.fx_view.edgeBlip({x: pos.x*PIXELS_PER_HALF_SIDE, y:pos.y*PIXELS_PER_HALF_SIDE}, this.gb, id.name);
            }
        }

        const dsize = new Vector2({x: size.x*2, y: size.y*2});
        // TODO: replace this by just tiles we use, not all tiles in the world
        this.floor_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, floor_grid.elements);
        this.seam_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, seam_grid.elements);
        this.floor_top_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, surface_tile_grid.elements);

        this._redraw_floor_requested = true;
        this._redraw_surface_requested = true;
    }

    _create_offscreen_canvas_context(){
        return graphics.create_canvas_context(this.size.x * PIXELS_PER_TILES_SIDE, this.size.y * PIXELS_PER_TILES_SIDE);
    }

    get canvas_context() { return this._offscreen_canvas_context; }

    get width() { return this.size.x; }
    get height() { return this.size.y; }

    update(delta_time){
        this.floor_tile_grid.update(delta_time);
        this.seam_tile_grid.update(delta_time);
        if (this._enable_overlay) {
            this.procWallSys.update(delta_time);
        }
        this.floor_top_tile_grid.update(delta_time);

        this._redraw_floor_requested = this._redraw_floor_requested
                              || this.floor_tile_grid.redraw_requested
                              || this.seam_tile_grid.redraw_requested
                              || this.floor_top_tile_grid.redraw_requested
                              ;
        this._redraw_surface_requested = this._redraw_surface_requested
                              ;

        // fx
        this.fx_view.update(delta_time);

    }

    draw_floor(canvas_context, position_predicate){
        if(this._redraw_floor_requested || position_predicate)
            this._render_floor(this._offscreen_floor_canvas_context, position_predicate);
        this._draw_offscreen_canvas(canvas_context, this._offscreen_floor_canvas_context, position_predicate);
    }

    draw_surface(canvas_context, position_predicate){
        if(this._redraw_surface_requested || position_predicate)
            this._render_surface(this._offscreen_surface_canvas_context, position_predicate);
        this._draw_offscreen_canvas(canvas_context, this._offscreen_surface_canvas_context, position_predicate);
    }

    draw_effects(canvas_context, position_predicate){
        // particles
        if(config.enable_particles) {
            this.fx_view.draw(canvas_context, position_predicate);
        }
    }

    _draw_offscreen_canvas(canvas_context, offscreen_canvas_context, position_predicate){
        canvas_context.drawImage(offscreen_canvas_context.canvas, 0, 0);

        if(!position_predicate)
            return;

        for(let y = 0; y < this.height; ++y){
            for(let x = 0; x < this.width; ++x){
                const position = {x, y};
                if(!position_predicate(position))
                    continue;

                const gfx_position = graphic_position(position);
                this._offscreen_canvas_context.drawImage(offscreen_canvas_context.canvas,
                    gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE,
                    gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE,
                );
            }
        }
    }


    _half_tile_predicate(position_predicate){
        // The predicate assumes a tile grid normal but here we have tiles smaller by half, so we need to translate the position of the tile to the position it have in the real grid.
        if(!position_predicate)
            return undefined;
        return (position)=> position_predicate({ x: Math.floor(position.x/2), y: Math.floor(position.y/2) });
    }

    _wall_visibility_predicate(position_predicate){
        if(!position_predicate)
            return undefined;
        return (gfx_position)=>{
            // translate gfx position to grid position
            const grid_pos = graphics.from_graphic_to_grid_position(gfx_position, PIXELS_PER_TILES_SIDE);
            return position_predicate(grid_pos);
        };
    }

    _render_floor(canvas_context, position_predicate){
        graphics.clear(canvas_context);

        if(this._enable_tile_sprites) {
            canvas_context =this.floor_tile_grid.draw(canvas_context, this._half_tile_predicate(position_predicate));
            canvas_context =this.seam_tile_grid.draw(canvas_context, this._half_tile_predicate(position_predicate));
        }

        if(this.enable_grid_lines){
            graphics.draw_grid_lines(this.size.x, this.size.y, PIXELS_PER_TILES_SIDE, this.position, canvas_context);
        }
        canvas_context = this.floor_top_tile_grid.draw(canvas_context, position_predicate);

        this._redraw_floor_requested = false;
    }

    _render_surface(canvas_context, position_predicate){
        graphics.clear(canvas_context);
        if(this._enable_tile_sprites){
            if (this._enable_overlay) {
                this.procWallSys.draw(canvas_context, this._wall_visibility_predicate(position_predicate));
            }
        }

        this._redraw_surface_requested = false;
    }

};


