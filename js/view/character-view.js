// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import { EntityView } from "./entity-view.js";
import { Character } from "../core/character.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        console.assert(character instanceof Character);
        super(character.position, character.assets);
    }


};



