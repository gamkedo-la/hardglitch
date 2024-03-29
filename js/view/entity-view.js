// Common data and code used by the view implementations.

export {
    PIXELS_PER_TILES_SIDE, PIXELS_PER_HALF_SIDE, square_unit_vector, square_half_unit_vector,
    EntityView,
    graphic_position, game_position_from_graphic_po,
}

import * as debug from "../system/debug.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";
import { Vector2, containing_rectangle, Rectangle, Vector2_unit, is_point_under } from "../system/spatial.js";
import { is_number } from "../system/utility.js";
import { sprite_defs } from "../game-assets.js";

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

//window.float_y = 0.08;      // for debug, you can change this in the console
//window.float_x = 0.03;      // for debug, you can change this in the console
window.float_y = 0.05;      // for debug, you can change this in the console
window.float_x = 0.00;      // for debug, you can change this in the console

// Common parts used by both body/character and items views.
class EntityView {
    is_visible = true;
    force_visible = false; // Used to bypass visibility checks.
    is_flying = false; // Set to true if you want to display the character over anything in the game world.
    _graphics = [];

    _area = new Rectangle();
    _scale = new Vector2(Vector2_unit);
    _orientation_degree = 0;

    is_floating = false;

    constructor(entity_id, game_position, assets){
        debug.assertion(()=>Number.isInteger(entity_id));
        debug.assertion(()=>game_position instanceof concepts.Position);
        debug.assertion(()=>assets instanceof Object);
        this.id = entity_id;
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

        this.set_shadow(sprite_defs.shadow);
    }

    set_shadow(shadow_sprite_def){
        this._graphics = this._graphics.filter(sprite => !sprite.is_shadow);

        const shadow_sprite = new graphics.Sprite(shadow_sprite_def);
        shadow_sprite.position = this.position;
        shadow_sprite.is_shadow = true;
        this._graphics.push({
            id: "shadow",
            sprite: shadow_sprite,
            order: -999999, // Must always be in the background.
        });
    }

    update(delta_time){ // TODO: make this a generator with an infinite loop

        if(this.is_floating === true){ // TODO: find a way to do this outside this class...
            const now = performance.now();
            const time_value = ((this.id * 7984595) + now) / 1000.0; // Arbitrary value that looks right and makes things float not-in-sync.
            const drift_x = Math.sin(time_value)* window.float_x;
            const drift_y = Math.cos(time_value)* window.float_y;

            this.for_each_sprite(sprite => {
                if(sprite.is_shadow){
                    sprite.position = sprite.position.translate({ x: drift_x });
                } else {
                    sprite.position = sprite.position.translate({ x: drift_x, y: drift_y });
                }
            });
        }

        this._graphics.forEach(graphic => graphic.sprite.update(delta_time));

    }

    render_graphics(canvas_context){
        if(this.is_visible || this.force_visible){
            this._graphics
                .filter(graphic => this.force_visible || graphics.camera.can_see(graphic.sprite.area))
                .sort((left, right) => left.order - right.order)
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
        new_position = new Vector2(new_position);
        this._area.position = new_position;
        this.for_each_sprite(sprite => sprite.position = new_position);
    }

    set scale(new_scale){
        this._scale = new Vector2(new_scale);
        this.for_each_sprite(sprite => {
            debug.assertion(()=>sprite instanceof graphics.Sprite);
            sprite.transform.scale = new_scale;
        });
    }

    get scale() {
        return new Vector2(this._scale);
    }

    set orientation(angle){
        debug.assertion(()=>is_number(angle));
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

    get is_mouse_over() {
        return this.is_visible
            && is_point_under(input.mouse.position, this._area, graphics.camera.position);
    }

};


