export {
    Rule_Stream,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import * as spatial from "../system/spatial.js";
import { apply_directional_force, Pushed } from "./rules-forces.js";

class Rule_Stream extends concepts.Rule {

    apply_stream_rule(world, stream_tile_id, translation) {
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>Number.isInteger(stream_tile_id));
        debug.assertion(()=>translation instanceof spatial.Vector2);
        const events = [];
        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === stream_tile_id))
            .map((entity) => {
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });
        return events;
    }

    update_world_at_the_beginning_of_game_turn(world){
        debug.assertion(()=>world instanceof concepts.World);
        const events = [
            ...this.apply_stream_rule(world, tiles.ID.STREAM_RIGHT, spatial.Vector2_unit_x),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_LEFT, spatial.Vector2_negative_unit_x),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_UP, spatial.Vector2_negative_unit_y),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_DOWN, spatial.Vector2_unit_y),
        ];
        return events;
    }
};




