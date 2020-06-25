// Common data and code used by the view implementations.

export {
    PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, square_unit_vector, square_half_unit_vector,
    EntityView,
    graphic_position, game_position_from_graphic_po,
}

import { Vector2 } from "../system/spatial.js";
import * as graphics from "../system/graphics.js";

const PIXELS_PER_TILES_SIDE = 64;
const PIXELS_PER_HALF_SIDE = 32;
const square_unit_vector = new Vector2({ x: PIXELS_PER_TILES_SIDE, y: PIXELS_PER_TILES_SIDE });
const square_half_unit_vector = new Vector2({ x: PIXELS_PER_TILES_SIDE / 2 , y: PIXELS_PER_TILES_SIDE / 2 });


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
    is_performing_animation = false;

    constructor(game_position, assets){
        console.assert(game_position);
        console.assert(assets);
        this.sprite = new graphics.Sprite(assets.graphics.sprite_def);
        this.sprite.position = graphic_position(game_position);
    }

    update(delta_time){ // TODO: make this a generator with an infinite loop
        this.sprite.update(delta_time);
    }

    render_graphics(){
        this.sprite.draw();
    }

    // This is used in animations to set the graphics at specific squares of the grid.
    set game_position(new_game_position){
        this.position = graphic_position(new_game_position);
    }

    get game_position() { return game_position_from_graphic_po(this.position); }

    get position(){
        return this.sprite.position;
    }
    set position(new_position){
        this.sprite.position = new_position;
    }

    *animate_event(event){
        this.is_performing_animation = true;
        yield* event.animation(this); // Let the event describe how to do it!
        this.is_performing_animation = false;
    }

};


