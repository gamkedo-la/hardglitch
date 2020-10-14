// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import * as debug from "../system/debug.js";
import { EntityView } from "./entity-view.js";
import { Character } from "../core/character.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super(character.id, character.position, character.assets);
        this._character = character;
    }

    get is_player() { return this._character.is_player_actor; }
};



