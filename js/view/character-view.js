// This file contains the code deciding how to display characters.

export {
    CharacterView,
}


import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { tween } from "../system/tweening.js";
import { graphic_position } from "./common-view.js";

// Representation of a character's body.
class CharacterView {
    is_performing_animation = false;

    constructor(body_position, body_assets){
        console.assert(body_position);
        console.assert(body_assets);
        this.sprite = new graphics.Sprite(body_assets.graphics.sprite_def);
        this.sprite.position = graphic_position(body_position);
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

    *move_animation(target_game_position){
        console.assert(target_game_position instanceof concepts.Position);

        const move_duration = 200;
        const target_gfx_pos = graphic_position(target_game_position);

        yield* tween(this.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, move_duration,
            (updated_position)=>{ this.position = updated_position; });
        this.game_position = target_game_position;
    }

};



