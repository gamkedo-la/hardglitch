
export {
    FogOfWar,
}

import * as visibility from "../core/visibility.js";
import * as graphics from "../system/graphics.js";
import { PIXELS_PER_TILES_SIDE, graphic_position } from "./entity-view.js";
import { index_from_position, position_from_index } from "../system/utility.js";
import * as assets from "../game-assets.js";
import * as concepts from "../core/concepts.js";
import * as utility from "../system/utility.js";

const visibility_sprites_defs = {
    [false] : assets.sprite_defs.void,  // When we cannot see there
};

class FogOfWar {

    fog_color = "black";

    constructor(world, field_of_view){
        console.assert(world instanceof concepts.World);
        console.assert(field_of_view instanceof visibility.FieldOfView);
        this.field_of_view = field_of_view;
        this.world = world;
        this.graphic_width = this.world.width * PIXELS_PER_TILES_SIDE;
        this.graphic_height = this.world.height * PIXELS_PER_TILES_SIDE;

        this.viewed_at_least_once_grid = new Array(this.world.size).fill(false);

        this._last_seen_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);
        this._last_seen_canvas_context.filter = "grayscale(100%)";

        this._fog_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);
        this._dark_canvas_context = graphics.create_canvas_context( this.graphic_width, this.graphic_height);

        this._refresh();
    }

    index(position){
        return index_from_position(this.world.width, this.world.height, position);
    }

    position_from_index(idx){
        return position_from_index(this.world.width, this.world.height, idx);
    }

    _refresh(){
        this.current_visibility_grid = new Array(this.world.size).fill(false);

        this.field_of_view.update(this.world);

        this.field_of_view.visible_positions
            .filter(position => this.world.is_valid_position(position))
            .forEach(position =>{
                const idx = this.index(position);
                this.viewed_at_least_once_grid[idx] = true;
                this.current_visibility_grid[idx] = undefined;
            });

        this._render_dark_unknown();
        this._render_last_visible_squares();
        this._need_last_seen_capture = true;
    }

    change_viewer_position(new_pos){
        this.field_of_view.position = new_pos;
        this._refresh();
    }

    update(delta_time){
        // ¯\_(ツ)_/¯
    }

    display(canvas_context, complete_grid_canvas_context){
        console.assert(canvas_context);
        console.assert(complete_grid_canvas_context);
        this.draw_dark_unknown(canvas_context);
        this.draw_last_visible_squares(canvas_context);
        if(this._need_last_seen_capture){
            this.capture_last_visible_squares(complete_grid_canvas_context);
        }
    }

    is_visible(...positions){
        return positions.every(position => this.current_visibility_grid[this.index(position)] === undefined);
    }

    was_visible(...positions){
        return positions.every(position => this.viewed_at_least_once_grid[this.index(position)] === true);
    }

    draw_dark_unknown(canvas_context){
        canvas_context.drawImage(this._dark_canvas_context.canvas, 0, 0);
    }

    _render_dark_unknown(){
        this._dark_canvas_context.fillStyle = this.fog_color;
        this._dark_canvas_context.globalCompositeOperation  = "source-over";

        this._dark_canvas_context.fillRect(0, 0, this.graphic_width, this.graphic_height);
        this._dark_canvas_context.fillStyle = "#ffffffff";
        this._dark_canvas_context.globalCompositeOperation = "destination-out";
        this.field_of_view.visible_positions.forEach(position => {
            const gfx_position = graphic_position(position);
            this._dark_canvas_context.fillRect(gfx_position.x, gfx_position.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);
        });
    }

    draw_last_visible_squares(canvas_context){
        canvas_context.drawImage(this._fog_canvas_context.canvas, 0, 0);
    }

    _render_last_visible_squares(){
        this._fog_canvas_context.clearRect(0, 0, this.graphic_width, this.graphic_height);
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

    capture_last_visible_squares(canvas_context){
        this._last_seen_canvas_context.drawImage(canvas_context.canvas, 0, 0);
        this._need_last_seen_capture = false;
    }

};


