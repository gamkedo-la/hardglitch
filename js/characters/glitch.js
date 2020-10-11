export {
    GlitchyGlitchMacGlitchy,
}


import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import { auto_newlines } from "../system/utility.js";

const default_player_view_distance = 6;
const default_player_inventory_slots = 3;
const default_player_active_slots = 1;

class GlitchyGlitchMacGlitchy extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.player,
        }}
    };

    description = auto_newlines("Sentient glitch, computer bug with a conscience, ghost in the machine. Will probably be destroyed by the computer's protection.", 35);

    constructor(){
        super("\"Glitch\"", new CharacterStats());
        this.actor = new concepts.Player();
        this.stats.view_distance.real_value = default_player_view_distance;
        this.stats.inventory_size.real_value = default_player_inventory_slots;
        this.stats.activable_items.real_value = default_player_active_slots
    }
}


