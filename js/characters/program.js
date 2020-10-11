export {
    Program,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";




class Program extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.program,
        }}
    };

    description = auto_newlines("User-space program. Eats memory for no reason.", 35);

    constructor(){
        super("Program", );
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
