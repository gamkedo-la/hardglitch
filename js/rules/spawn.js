export {
    EntitySpawned,
    spawn_entities_around,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { valid_spawn_positions } from "../core/visibility.js";
import { GameView } from "../game-view.js";
import * as anim from "../game-animations.js";


class EntitySpawned extends concepts.Event {
    constructor(entity, target_position){
        console.assert(entity instanceof concepts.Entity);
        console.assert(target_position instanceof concepts.Position);

        super({
            description: `Entity spawned at ${JSON.stringify(target_position)}`,
            allow_parallel_animation: false,
        });
        this.entity_id = entity.id;
        this.spawn_position = target_position;
    }

    get focus_positions() { return [ this.spawn_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        game_view.focus_on_position(this.spawn_position);
        yield* anim.spawned(game_view.fx_view, this.spawn_position);
        const entity_view = game_view.add_entity_view(this.entity_id); // TODO: add some FX and sounds?
        entity_view.game_position = this.spawn_position;
    }
};

function spawn_entities_around(world, center_position, entities, spawn_event = EntitySpawned, position_predicate = tiles.is_walkable, max_range){
    console.assert(center_position instanceof concepts.Position);
    console.assert(entities instanceof Array);
    console.assert(entities.every(entity => entity instanceof concepts.Entity));
    if(entities.length === 0)
        return [];

    const spawn_positions = valid_spawn_positions(world, center_position, position_predicate, max_range).reverse(); // Reversed so that pop gives us the closest position.
    entities = entities.reverse(); // So that we pop the first element first.
    const events = [];
    while(spawn_positions.length > 0 && entities.length > 0){
        const position = spawn_positions.pop();
        console.assert(position instanceof concepts.Position);
        const entity = entities.pop();
        entity.position = position;
        world.add_entity(entity);
        events.push(new spawn_event(entity, position));
    }
    // The other entities will not be spawned...
    for(const entity of entities){
        console.warn(`COULD NOT SPAWN ENTITY ${entity.id}`); // TODO: maybe create an event for this case, so that we add a sound or animation for the player to know?
    }
    return events;
}
