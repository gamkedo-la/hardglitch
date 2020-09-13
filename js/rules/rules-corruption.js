
export {
    Rule_Corruption,
    Corruption,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { deal_damage } from "./destruction.js";
import { random_int } from "../system/utility.js";
import { grid_ID } from "../definitions-world.js";
import { Character } from "../core/character.js";

function corruption_damage() {
    return random_int(1, 20);
}

class Corruption {};

class Corrupt extends concepts.Action {

};

class Rule_Corruption extends concepts.Rule {

    damage_anything_in_corrupted_tiles(world){
        console.assert(world instanceof concepts.World);
        const events = [];

        world.entities.filter(entity => world.tiles_at(entity.position).some(value => value instanceof Corruption))
            .map((entity) => {
                events.push(...deal_damage(entity.position, corruption_damage()));
            });

        return events;
    }

    update_world_at_the_beginning_of_game_turn(world){
        return this.damage_anything_in_corrupted_tiles(world);
    }

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        console.assert(world instanceof concepts.World);

        // TODO: characters who can use Corrupt action gets it.

    }
};




