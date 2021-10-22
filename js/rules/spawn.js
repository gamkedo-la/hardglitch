export {
    EntityScanned,
    EntitySpawned,
    spawn_entities_around,

    default_spawn_position_predicate,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { valid_spawn_positions } from "../core/visibility.js";
import { GameView } from "../game-view.js";
import * as anim from "../game-animations.js";
import { EntityView } from "../view/entity-view.js";


class EntityScanned extends concepts.Event {
    constructor(entity) {
        debug.assertion(()=>entity instanceof concepts.Entity);
        super({
            description: `Entity scanned`,
            allow_parallel_animation: false,
        });
        this.entity_position = entity.position;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.entity_position);
        yield* anim.scanned(game_view.fx_view, this.entity_position);
    }
};


class EntitySpawned extends concepts.Event {
    constructor(entity, target_position){
        debug.assertion(()=>entity instanceof concepts.Entity);
        debug.assertion(()=>target_position instanceof concepts.Position);

        super({
            description: `Entity spawned at ${JSON.stringify(target_position)}`,
            allow_parallel_animation: false,
        });
        this.entity_id = entity.id;
        this.spawn_position = target_position;
    }

    get focus_positions() { return [ this.spawn_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.spawn_position);
        yield* anim.spawned(game_view.fx_view, this.spawn_position);
        const entity_view = game_view.add_entity_view(this.entity_id); // TODO: add some FX and sounds?
        if(!(entity_view instanceof EntityView)) return; // FIXME: was an assertion, not sure why it went false.
        entity_view.game_position = this.spawn_position;
    }
};

const default_spawn_position_predicate = tiles.is_safely_walkable;

function spawn_entities_around(world, center_position, entities, spawn_event = EntitySpawned, position_predicate = default_spawn_position_predicate, max_range){
    debug.assertion(()=>center_position instanceof concepts.Position);
    debug.assertion(()=>entities instanceof Array);
    debug.assertion(()=>entities.every(entity => entity instanceof concepts.Entity));
    if(entities.length === 0)
        return [];

    const spawn_positions = valid_spawn_positions(world, center_position, position_predicate, max_range).reverse(); // Reversed so that pop gives us the closest position.
    entities = entities.reverse(); // So that we pop the first element first.
    const events = [];
    while(spawn_positions.length > 0 && entities.length > 0){
        const position = spawn_positions.pop();
        debug.assertion(()=>position instanceof concepts.Position);
        const entity = entities.pop();
        console.assert(entity instanceof concepts.Entity);
        entity.position = position;
        world.add_entity(entity);
        events.push(new spawn_event(entity, position));
    }
    // The other entities will not be spawned...
    for(const entity of entities){
        debug.warn(`COULD NOT SPAWN ENTITY ${entity.id}`); // TODO: maybe create an event for this case, so that we add a sound or animation for the player to know?
    }
    return events;
}
