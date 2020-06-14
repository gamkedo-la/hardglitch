// Common data and code used by the view implementations.

export {
    PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, square_unit_vector, square_half_unit_vector,
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




