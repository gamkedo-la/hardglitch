// Common data and code used by the view implementations.

export {
    PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, square_unit_vector, square_half_unit_vector,
    EntityView,
    graphic_position, game_position_from_graphic_po,
}

import { Vector2 } from "../system/spatial.js";
import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { tween } from "../system/tweening.js";

const PIXELS_PER_TILES_SIDE = 64;
const PIXELS_PER_HALF_SIDE = PIXELS_PER_TILES_SIDE / 2;
const square_unit_vector = new Vector2({ x: PIXELS_PER_TILES_SIDE, y: PIXELS_PER_TILES_SIDE });
const square_half_unit_vector = new Vector2({ x: PIXELS_PER_HALF_SIDE , y: PIXELS_PER_HALF_SIDE });


// Return a vector in the graphic-world by interpreting a game-world position.
function graphic_position(vec2){
    return graphics.from_grid_to_graphic_position(vec2, PIXELS_PER_TILES_SIDE);
}

// Return a vector in the game-world by interpreting a graphic-world position.
function game_position_from_graphic_po(vec2){
    return graphics.from_graphic_to_grid_position(vec2, PIXELS_PER_TILES_SIDE);
}

// Common parts used by both body/character and items views.
class EntityView {
    is_visible = true;
    is_flying = false; // Set to true if you want to display the character over anything in the game world.

    constructor(game_position, assets){
        console.assert(game_position);
        console.assert(assets);
        this.sprite = new graphics.Sprite(assets.graphics.sprite_def);
        this.sprite.position = graphic_position(game_position);
    }

    update(delta_time){ // TODO: make this a generator with an infinite loop
        this.sprite.update(delta_time);
    }

    render_graphics(canvas_context){
        if(this.is_visible && graphics.camera.can_see(this.sprite.area))
            this.sprite.draw(canvas_context);
    }

    // This is used in animations to set the graphics at specific squares of the grid.
    set game_position(new_game_position){
        this.position = graphic_position(new_game_position);
    }

    get game_position() { return new concepts.Position(game_position_from_graphic_po(this.position)); }

    get position(){
        return this.sprite.position;
    }
    set position(new_position){
        this.sprite.position = new_position;
    }

    set scale(new_scale){
        this.sprite.transform.scale = new Vector2(new_scale);
    }

    get scale() {
        return new Vector2(this.sprite.transform.scale);
    }

    set orientation(angle){
        this.sprite.transform.orientation.degrees = angle;
    }

    get orientation(){
        return this.sprite.transform.orientation.degrees;
    }

};


