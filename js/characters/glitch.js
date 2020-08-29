export {
    GlitchyGlitchMacGlitchy,
}


import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js";
import * as concepts from "../core/concepts.js";

const default_player_view_distance = 6;
const default_player_interface_slots = 3;
const default_player_equipable_items = 1;

class GlitchyGlitchMacGlitchy extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.player,
        }}
    };

    constructor(){
        super("\"Glitch\"", new CharacterStats());
        this.actor = new concepts.Player();
        this.stats.view_distance.real_value = default_player_view_distance;
        this.stats.inventory_size.real_value = default_player_interface_slots;
        this.stats.equipable_items.real_value = default_player_equipable_items
    }
}


