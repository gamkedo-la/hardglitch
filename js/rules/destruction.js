
export {
    destroy_entity,
    destroy_at,
    deal_damage,
    drop_entity_drops,
    Destroyed,
    Damaged,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { destroyed, take_damage } from "../game-animations.js";
import { Character } from "../core/character.js";
import { EntityDropped } from "./rules-items.js";
import { random_sample } from "../system/utility.js";
import { grid_ID } from "../definitions-world.js";
import { EntitySpawned, spawn_entities_around } from "./spawn.js";


class Damaged extends concepts.Event {
    constructor(entity_id, entity_position, damage_count){
        super({
            description: `Entity ${entity_id} took ${damage_count} damages!`
        });

        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
        this.damage_count = damage_count;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* take_damage(game_view.fx_view, entity_view);
    }

}


class Destroyed extends concepts.Event {
    constructor(entity_id, entity_position){
        console.assert(Number.isInteger(entity_id));
        console.assert(entity_position instanceof concepts.Position);

        super({
            description: `Entity ${entity_id} was DESTROYED!!!!!`
        });
        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* destroyed(game_view.fx_view, entity_view);
        game_view.clear_focus();
        game_view.remove_entity_view(this.entity_id);
    }

};

function drop_entity_drops(entity, world){
    console.assert(entity instanceof concepts.Entity);
    console.assert(world instanceof concepts.World);
    console.assert(!world.entities.includes(entity));
    if(entity.drops){
        console.assert(entity.drops instanceof Array && entity.drops.every(entity=>entity instanceof concepts.Entity));
        const dropped = random_sample(entity.drops);
        // Only drop around the character's position, where it's safe to walk, or don't.
        const spawn_events = spawn_entities_around(world, entity.position, [dropped], undefined, tiles.is_safely_walkable, 1);
        if(spawn_events.length > 0) // Use that event instead, but only if the item was actually dropped.
            return [ new EntityDropped(entity, 0, dropped.position, dropped.id) ];
    }

    return [];
}

function destroy_entity(entity, world){
    console.assert(entity instanceof concepts.Entity);
    console.assert(world instanceof concepts.World);
    const entities = world.remove_entity(entity.id);
    console.assert(entities instanceof Array && entities.length === 1);

    const events = [ new Destroyed(entity.id, entity.position) ];

    const destroyed_entity = entities[0];
    console.assert(destroyed_entity instanceof concepts.Entity);
    events.push( ...drop_entity_drops(destroyed_entity, world));

    return events;
}

function destroy_at(position, world){
    console.assert(position);
    console.assert(world instanceof concepts.World);
    const entity = world.entity_at(position);
    if(entity){
        return destroy_entity(entity, world);
    } else {
        return [];
    }
}

function deal_damage(entity, damage){
    console.assert(Number.isInteger(damage) && damage >= 0);
    console.assert(entity instanceof concepts.Entity);
    if(entity instanceof Character){
        entity.take_damage(damage);
    }
    return [ new Damaged(entity.id, entity.position, damage) ];
}