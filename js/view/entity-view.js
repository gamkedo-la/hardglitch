// Common data and code used by the view implementations.

export {
    PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, square_unit_vector, square_half_unit_vector,
    EntityView,
    graphic_position, game_position_from_graphic_po,
}

import { Vector2, containing_rectangle, Rectangle, Vector2_unit } from "../system/spatial.js";
import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { tween } from "../system/tweening.js";
import { is_number } from "../system/utility.js";

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
    _graphics = [];

    _area = new Rectangle();
    _scale = new Vector2(Vector2_unit);
    _orientation_degree = 0;

    constructor(game_position, assets){
        console.assert(game_position instanceof concepts.Position);
        console.assert(assets instanceof Object);

        const position = graphic_position(game_position);

        for(const [graphics_id, graphic] of Object.entries(assets.graphics)){
            const sprite = new graphics.Sprite(graphic.sprite_def);
            sprite.position = new Vector2(position);
            this._graphics.push({
                id: graphics_id,
                sprite: sprite,
                order: graphic.order === undefined ? 0 : graphic.order,
            });
        }

        this._area = containing_rectangle(...this.sprites.map(sprite=>sprite.area));
        this._area.position = position;
    }

    update(delta_time){ // TODO: make this a generator with an infinite loop
        this._graphics.forEach(graphic => graphic.sprite.update(delta_time));
    }

    render_graphics(canvas_context){
        if(this.is_visible){
            // TODO: sort by ascending order
            this._graphics.filter(graphic => graphics.camera.can_see(graphic.sprite.area))
                .forEach(graphic => graphic.sprite.draw(canvas_context));
        }
    }

    get sprites() {
        return this._graphics.map(graphic => graphic.sprite);
    }

    for_each_sprite(operation){
        return this.sprites.map(operation);
    }

    get_sprite(graphic_id){
        const graphic = this._graphics.find(graphic => graphic.id === graphic_id);
        if(graphic !== undefined)
            return graphic.sprite;
    }

    // This is used in animations to set the graphics at specific squares of the grid.
    set game_position(new_game_position){
        this.position = graphic_position(new_game_position);
    }

    get game_position() { return new concepts.Position(game_position_from_graphic_po(this._area.position)); }

    get position(){
        return new Vector2(this._area.position);
    }

    set position(new_position){
        this._area.position = new Vector2(new_position);
        this.for_each_sprite(sprite => sprite.position = new_position);
    }

    set scale(new_scale){
        this._scale = new Vector2(new_scale);
        this.for_each_sprite(sprite => {
            console.assert(sprite instanceof graphics.Sprite);
            sprite.transform.scale = new_scale;
        });
    }

    get scale() {
        return new Vector2(this._scale);
    }

    set orientation(angle){
        console.assert(is_number(angle));
        this._orientation_degree = angle;
        this.for_each_sprite(sprite => sprite.transform.orientation.degrees = angle);
    }

    get orientation(){
        return this._orientation_degree;
    }

    get area(){
        return new Rectangle(this._area);
    }

    get width() { return this._area.width; }
    get height() { return this._area.height; }

};


