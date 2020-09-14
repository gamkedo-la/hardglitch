export {
    Microcode,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";




class Microcode extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.microcode,
        }}
    };

    constructor(){
        super("Micro-Code", );
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
