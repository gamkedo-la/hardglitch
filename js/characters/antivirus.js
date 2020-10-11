export {
    AntiVirus,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";




class AntiVirus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.antivirus,
        }}
    };

    description = auto_newlines("Hunts defects, glitches, viruses, malwares. Very agressive and does not have any kind of pity.", 35);

    constructor(){
        super("Anti-Virus");
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
