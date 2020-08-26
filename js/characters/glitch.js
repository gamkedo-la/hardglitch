export {
    GlitchyGlitchMacGlitchy,
}


import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js";
import * as concepts from "../core/concepts.js";

const default_player_view_distance = 8;
const default_player_interface_slots = 6;

class GlitchyGlitchMacGlitchy extends Character {
    assets = {
        graphics : {
            sprite_def : sprite_defs.player,
        }
    };

    constructor(){
        super("\"Glitch\"", new CharacterStats());
        this.actor = new concepts.Player();
        this.stats.view_distance.value = default_player_view_distance;
        this.stats.inventory_size.value = default_player_interface_slots;
    }
}


