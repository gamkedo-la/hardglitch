// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import * as debug from "../system/debug.js";
import { EntityView } from "./entity-view.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super(character.id, character.position, character.assets);
        this._character = character;
    }

    get is_player() { return this._character.is_player_actor; }

    get is_virus() { return this._character.is_virus; }


    render_graphics(canvas_context){
        if(this.is_virus && !this._has_infected_shadow){
            this._has_infected_shadow = true;
            this.set_shadow(sprite_defs.shadow_red);
        }
        super.render_graphics(canvas_context);
    }
};



