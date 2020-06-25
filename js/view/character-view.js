// This file contains the code deciding how to display characters.

export {
    CharacterView,
}


import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { tween } from "../system/tweening.js";
import { graphic_position, EntityView } from "./common-view.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(body){
        console.assert(body instanceof concepts.Body);
        super(body.position, body.assets);
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



