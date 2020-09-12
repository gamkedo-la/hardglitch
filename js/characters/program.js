export {
    Program,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";




class Program extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.program,
        }}
    };

    constructor(){
        super("Program", );
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
