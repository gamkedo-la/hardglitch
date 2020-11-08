export {
    Virus,
}

import { RandomActionSelector } from "./test-enemy.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";




class Virus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.virus,
        }}
    };

    description = auto_newlines("Self-replicating malware. Beware of it's resistance and agressivity. Hunted by Anti-Viruses.", 35);
    is_anomaly = true;

    constructor(){
        super("Virus", );
        this.actor = new RandomActionSelector;
        this.stats.inventory_size.real_value = 1;
    }

};
