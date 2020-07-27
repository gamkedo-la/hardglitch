// This file contains the code that decides how to display the tiles, background, anything that isn't an item or a character.

export {
    TileGridView,
};

import { config } from "../game-config.js";

import { Grid } from "../system/grid.js";
import * as tiledefs from "../definitions-tiles.js";
import { SeamSelector, genFloorOverlay, genFgOverlay } from "./tile-select.js";

import * as graphics from "../system/graphics.js";
import { Vector2 } from "../system/spatial.js";
import { PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE } from "./entity-view.js";
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
        this.gb = new TileGraphBuilder(size.x*PIXELS_PER_TILES_SIDE);
        this.procWallSys = new ProcWallSystem();

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
        // generate walls
        // handle surface transitions
        //genFgOverlay("lvl1", "fg", ground_tile_grid, fg_grid, (v) => (v == tiledefs.ID.WALL) ? 1 : 0);
        //genFgOverlay("lvl1", "laser", ground_tile_grid, fg_grid, (v) => (v == tiledefs.ID.HOLE) ? 1 : 0);
        // filter out all wall/ground tiles from fg
        const midData = new Array(size.x * size.y);
        for (let i=0; i<midData.length; i++) {
            const surface_element = ground_tile_grid.elements[i];
            if (surface_element === tiledefs.ID.WALL) continue;
            if (surface_element === tiledefs.ID.GROUND) continue;
            if (surface_element === tiledefs.ID.VOID) continue;
            if (surface_element === tiledefs.ID.HOLE) continue;
            midData[i] = surface_element;
        }
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
                        let floor = bg_grid.get_at(si, sj);
                        if (!floor || floor.length < 8) continue;
                        let tileid = floor.slice(9);  // lvlx_bg_<id>
                        this.fx_view.voidEdge(pos, tileid);
                    }
                }
            }
        }
        // iterate through bg grid
        let pwallgen = procWallGenSelector("wall");
        let pholegen = procWallGenSelector("hole");
        for (let i=0; i<bg_grid.elements.length; i++) {
            let id = bg_grid.elements[i];
            if (!id) continue;
            let coords = position_from_index(size.x*2, size.y*2, i);
            let pos = {x: coords.x*PIXELS_PER_HALF_SIDE, y:coords.y*PIXELS_PER_HALF_SIDE};
            let sid = parse_tile_id(id);
            if (sid.layer && sid.layer.startsWith("w2")) {
                let pwall = pwallgen.create(pos, sid.name, 32);
                if (pwall) this.procWallSys.add(pwall);
            } else if (sid.layer && sid.layer.startsWith("h2")) {
                let pwall = pholegen.create(pos, sid.name, 16);
                if (pwall) this.procWallSys.add(pwall);
            }
        }
        // iterate through fg grid
        let addblip = true;
        if (addblip) {
            for (let i=0; i<fg_grid.elements.length; i++) {
                let pos = position_from_index(size.x*2, size.y*2, i);
                let id = fg_grid.elements[i];
                if (!id) continue;
                id = id.slice(8);
                this.fx_view.edgeBlip({x: pos.x*PIXELS_PER_HALF_SIDE, y:pos.y*PIXELS_PER_HALF_SIDE}, this.gb, id);
            }
        }

        const dsize = new Vector2({x: size.x*2, y: size.y*2});
        // TODO: replace this by just tiles we use, not all tiles in the world
        // FIXME: for now, enable_overlay is the switch between the old tile display and the new tile display
        if (this._enable_overlay) {
            this.ground_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, bg_grid.elements);
            this.mid_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, midData);
            this.surface_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, fg_grid.elements);
            this.floor_top_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, surface_tile_grid.elements);
        } else {
            this.ground_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid.elements);
            this.surface_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid.elements);
        }

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
        this.ground_tile_grid.update(delta_time);
        if (this._enable_overlay) {
            this.mid_tile_grid.update(delta_time);
        }
        this.surface_tile_grid.update(delta_time);
        this.floor_top_tile_grid.update(delta_time);

        this._redraw_floor_requested = this._redraw_floor_requested
                              || this.ground_tile_grid.redraw_requested
                              || this.floor_top_tile_grid.redraw_requested
                              ;
        this._redraw_surface_requested = this._redraw_surface_requested
                              || this.mid_tile_grid.redraw_requested
                              || this.surface_tile_grid.redraw_requested
                              ;

        // fx
        this.fx_view.update(delta_time);

    }

    draw_floor(canvas_context, position_predicate){
        if(this._redraw_floor_requested || position_predicate)
            this._render_floor(this._offscreen_floor_canvas_context, position_predicate);
        this._draw_offscreen_canvas(canvas_context, this._offscreen_floor_canvas_context);
    }

    draw_surface(canvas_context, position_predicate){
        if(this._redraw_surface_requested || position_predicate)
            this._render_surface(this._offscreen_surface_canvas_context, position_predicate);
        this._draw_offscreen_canvas(canvas_context, this._offscreen_surface_canvas_context);
    }

    draw_effects(canvas_context, position_predicate){
        // particles
        if(config.enable_particles) {
            this.fx_view.draw(canvas_context, position_predicate);
        }
    }

    _draw_offscreen_canvas(canvas_context, offscreen_canvas_context){
        canvas_context.drawImage(offscreen_canvas_context.canvas, 0, 0);
        this._offscreen_canvas_context.drawImage(offscreen_canvas_context.canvas, 0, 0);
    }

    _clear_canvas(canvas_context){
        canvas_context.clearRect(0, 0, canvas_context.width, canvas_context.height);
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

    // _top_half_tile_predicate(position_predicate){
    //     // Here we try to display walls completely if their base is visible.
    //     if(!position_predicate)
    //         return undefined;
    //     else return (position)=> {
    //         const current_square = { x: Math.floor(position.x/2), y: Math.floor(position.y/2) };
    //         const lower_square = { x: current_square.x, y: current_square.y + 1 };
    //         return position_predicate(current_square)
    //             || ( lower_square.y < this.height && position_predicate(lower_square) );
    //     };
    // }

    _render_floor(canvas_context, position_predicate){
        this._clear_canvas(canvas_context);

        if(this._enable_tile_sprites)
            canvas_context =this.ground_tile_grid.draw(canvas_context, this._half_tile_predicate(position_predicate));

        if(this.enable_grid_lines){
            graphics.draw_grid_lines(this.size.x, this.size.y, PIXELS_PER_TILES_SIDE, this.position, canvas_context);
        }
        canvas_context = this.floor_top_tile_grid.draw(canvas_context, position_predicate);

        this._redraw_floor_requested = false;
    }

    _render_surface(canvas_context, position_predicate){
        if(this._enable_tile_sprites){
            if (this._enable_overlay) {
                canvas_context = this.mid_tile_grid.draw(canvas_context, position_predicate);
            }
            canvas_context = this.surface_tile_grid.draw(canvas_context, this._half_tile_predicate(position_predicate));
            //this.procWallSys.draw(canvas_context, this._half_tile_predicate(position_predicate));
            this.procWallSys.draw(canvas_context, this._wall_visibility_predicate(position_predicate));
        }

        this._redraw_surface_requested = false;
    }

};


