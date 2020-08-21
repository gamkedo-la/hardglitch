export {
    Rule_Stream,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { apply_directional_force, Pushed } from "./rules-forces.js";
import { PIXELS_PER_TILES_SIDE } from "../view/entity-view.js";
import { Vector2 } from "../system/spatial.js";

class Rule_Stream extends concepts.Rule {
    update_world_after_character_turn(world){
        console.assert(world instanceof concepts.World);
        const events = [];

        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === tiles.ID.STREAM_RIGHT))
            .map((entity) => {
                const translation = new Vector2({x: 1, y:0});
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });

        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === tiles.ID.STREAM_LEFT))
            .map((entity) => {
                const translation = new Vector2({x: -1, y:0});
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });

        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === tiles.ID.STREAM_UP))
            .map((entity) => {
                const translation = new Vector2({x: 0, y:-1});
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });

        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === tiles.ID.STREAM_DOWN))
            .map((entity) => {
                const translation = new Vector2({x: 0, y:1});
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });

        return events;
    }
};




