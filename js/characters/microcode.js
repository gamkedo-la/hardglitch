export {
    Microcode,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";




class Microcode extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.microcode,
        }}
    };

    description = auto_newlines("Complex but swiftly optimized code sequences. Avoid them if you do not want your data to be corrupted.", 34);

    constructor(){
        super("Micro-Code", );
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
