
export {
    FogOfWar,
}

import * as debug from "../system/debug.js";
import * as visibility from "../core/visibility.js";
import * as graphics from "../system/graphics.js";
import { PIXELS_PER_TILES_SIDE, graphic_position } from "./entity-view.js";
import { index_from_position, position_from_index } from "../system/utility.js";
import * as assets from "../game-assets.js";
import * as concepts from "../core/concepts.js";


class FogOfWar {

    fog_color = "black";
    fovs = {}; // { entity_id : FieldOfVision }...

    constructor(world){
        debug.assertion(()=>world instanceof concepts.World);
        this.graphic_width = world.width * PIXELS_PER_TILES_SIDE;
        this.graphic_height = world.height * PIXELS_PER_TILES_SIDE;

        this.viewed_at_least_once_grid = new Array(world.size).fill(false);

        this._last_seen_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);
        this._last_seen_canvas_context.filter = "sepia(60%) brightness(60%) contrast(60%)";

        this._fog_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);
        this._dark_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);

        this._permanent_fovs = {};

        this.refresh(world);
    }

    add_fov(entity_id, field_of_vision, force_keep = false){
        debug.assertion(()=>Number.isInteger(entity_id));
        debug.assertion(()=>field_of_vision instanceof visibility.FieldOfVision);
        this.fovs[entity_id] = field_of_vision;
        if(force_keep){
            this._permanent_fovs[entity_id] = field_of_vision;
        }
    }

    remove_fov(entity_id){
        debug.assertion(()=>Number.isInteger(entity_id));
        delete this.fovs[entity_id];
    }

    // Clears currently tracked fovs, but don't clear the memory of what have been seen so far.
    clear_fovs(){
        this.fovs = {};
    }

    get fov_list() { return [...Object.values(this._permanent_fovs), ...Object.values(this.fovs) ]; }

    index(position){
        return index_from_position(this.world.width, this.world.height, position);
    }

    position_from_index(idx){
        return position_from_index(this.world.width, this.world.height, idx);
    }

    refresh(world){
        debug.assertion(()=>world instanceof concepts.World);
        this.world = world;
        this.current_visibility_grid = new Array(this.world.size).fill(false);

        this.fov_list.forEach(fov => {
            fov.visible_positions.filter(position => this.world.is_valid_position(position))
                .forEach(position =>{
                    const idx = this.index(position);
                    this.viewed_at_least_once_grid[idx] = true;
                    this.current_visibility_grid[idx] = true;
                });
        })

        this._render_dark_unknown();
        this._need_last_seen_capture = true;
    }

    update(delta_time){
        // ¯\_(ツ)_/¯  No sprite to update nor other animation to animate.
    }

    display(canvas_context){
        debug.assertion(()=>canvas_context);
        this._draw_dark_unknown(canvas_context);
        this._draw_last_visible_squares(canvas_context);
    }

    capture_visible_squares(canvas_context){
        if(!this._need_last_seen_capture)
            return;

        // const previous_transform = canvas_context.getTransform();
        // canvas_context.resetTransform();

        // for(let idx = 0; idx < this.current_visibility_grid.length; ++idx){
        //     if(this.current_visibility_grid[idx] === true){
        //         const position = this.position_from_index(idx);
        //         const gfx_position = graphic_position(position);
        //         this._last_seen_canvas_context.drawImage(canvas_context.canvas,
        //                 gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE, // source
        //                 gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE, // destination
        //             );
        //     }
        // }

        // canvas_context.setTransform(previous_transform);
        //this._last_seen_canvas_context.fillColor = "white";
        //this._last_seen_canvas_context.fillRect(0, 0, this._last_seen_canvas_context.canvas.width, this._last_seen_canvas_context.canvas.height);
        this._last_seen_canvas_context.drawImage(canvas_context.canvas, 0, 0);

        this._need_last_seen_capture = false;
    }


    is_visible(...positions){
        // debug.assertion(()=>positions.every(position => position instanceof concepts.Position));
        return positions.every(position => this.world.is_valid_position(position)
                                        && this.current_visibility_grid[this.index(position)] === true
                                        );
    }

    is_any_visible(...positions){
        // debug.assertion(()=>positions.every(position => position instanceof concepts.Position));
        return positions.some(position => this.world.is_valid_position(position)
                                        && this.current_visibility_grid[this.index(position)] === true);
    }

    was_visible(...positions){
        // debug.assertion(()=>positions.every(position => position instanceof concepts.Position));
        return positions.every(position => this.world.is_valid_position(position)
                                        && this.viewed_at_least_once_grid[this.index(position)] === true);
    }

    was_any_visible(...positions){
        // debug.assertion(()=>positions.every(position => position instanceof concepts.Position));
        return positions.some(position => this.world.is_valid_position(position)
                                        && this.viewed_at_least_once_grid[this.index(position)] === true);
    }

    _draw_dark_unknown(canvas_context){
        canvas_context.drawImage(this._dark_canvas_context.canvas, 0, 0);
    }

    _render_dark_unknown(){
        this._dark_canvas_context.fillStyle = this.fog_color;
        this._dark_canvas_context.globalCompositeOperation  = "source-over";

        this._dark_canvas_context.fillRect(0, 0, this.graphic_width, this.graphic_height);
        this._dark_canvas_context.fillStyle = "#ffffffff";
        this._dark_canvas_context.globalCompositeOperation = "destination-out";

        const all_visible_positions = this.fov_list.flatMap(fov => fov.visible_positions);
        all_visible_positions.forEach(position => {
            const gfx_position = graphic_position(position);
            this._dark_canvas_context.fillRect(gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);
        });
    }

    _draw_last_visible_squares(canvas_context){
        if(this._need_last_seen_capture)
            this._render_last_visible_squares();
        canvas_context.drawImage(this._fog_canvas_context.canvas, 0, 0);
    }

    _render_last_visible_squares(){
        graphics.clear(this._fog_canvas_context);
        for(let idx = 0; idx < this.viewed_at_least_once_grid.length; ++idx){
            if(this.viewed_at_least_once_grid[idx] === true && this.current_visibility_grid[idx] === false){ // Not currently visible.
                const position = this.position_from_index(idx);
                const gfx_position = graphic_position(position);
                this._fog_canvas_context.drawImage(this._last_seen_canvas_context.canvas,
                        gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE, // source
                        gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE, // destination
                    );
            }
        }
    }

};


