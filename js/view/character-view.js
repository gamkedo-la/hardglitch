// This file contains the code deciding how to display characters.

export {
    CharacterView,
}


import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { tween } from "../system/tweening.js";
import { graphic_position, EntityView } from "./entity-view.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(body){
        console.assert(body instanceof concepts.Body);
        super(body.position, body.assets);
    }


};



