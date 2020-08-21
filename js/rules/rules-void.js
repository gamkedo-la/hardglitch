
export {
    Rule_Void,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { destroy_at } from "./destruction.js";


class Rule_Void extends concepts.Rule {

    destroy_anything_in_void_tiles(world){
        console.assert(world instanceof concepts.World);
        const events = [];

        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === tiles.ID.VOID))
            .map((entity) => {
                events.push(...destroy_at(entity.position, world));
            });

        return events;
    }

    update_world_after_character_turn(world){
        return this.destroy_anything_in_void_tiles(world);
    }

    update_world_at_the_beginning_of_game_turn(world){
        return this.destroy_anything_in_void_tiles(world);
    }
};




