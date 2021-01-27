
export {
    destroy_entity,
    destroy_at,
    deal_damage,
    drop_entity_drops,
    Destroyed,
    Damaged,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { destroyed, integrity_value_change, take_hit_damage } from "../game-animations.js";
import { Character } from "../core/character.js";
import { InventoryItemDropped } from "./rules-items.js";
import { random_sample } from "../system/utility.js";
import { spawn_entities_around } from "./spawn.js";
import { fail_game } from "./rules-basic.js";
import { in_parallel, wait } from "../system/animation.js";


class Damaged extends concepts.Event {
    constructor(entity_id, entity_position, damage_count){
        super({
            description: `Entity ${entity_id} took ${damage_count} damages!`
        });

        this.allow_parallel_animation = true;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
        this.damage_count = damage_count;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(entity_view instanceof EntityView){ // FIXME: was an assertion, not sure why it went false.
            if(game_view.fog_of_war.is_visible(entity_view.game_position)){
                game_view.special_animations.play(integrity_value_change(game_view, -this.damage_count, entity_view.position));
            }
        }
        yield* wait(1);
    }

}


class Destroyed extends concepts.Event {
    constructor(entity_id, entity_position){
        debug.assertion(()=>Number.isInteger(entity_id));
        debug.assertion(()=>entity_position instanceof concepts.Position);

        super({
            description: `Entity ${entity_id} was DESTROYED!!!!!`
        });
        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(entity_view instanceof EntityView) // FIXME: was an assertion, not sure why it went false.
            yield* destroyed(game_view.fx_view, entity_view);

        game_view.clear_focus();
        game_view.remove_entity_view(this.entity_id);
    }

};

function drop_entity_drops(entity, world){
    debug.assertion(()=>entity instanceof concepts.Entity);
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>!world.entities.includes(entity));

    const events = [];

    const drop = (dropped, idx) => {
        if(!(dropped instanceof concepts.Entity)) return;
        // Only drop around the character's position, where it's safe to walk, or don't.
        const spawn_events = spawn_entities_around(world, entity.position, [dropped], undefined, tiles.is_safely_walkable, 1);
        if(spawn_events.length > 0) // Use that event instead, but only if the item was actually dropped.
            events.push(new InventoryItemDropped(entity, idx, dropped.position, dropped.id));
    }

    if(entity.drops){
        debug.assertion(()=>entity.drops instanceof Array);
        const dropped = random_sample(entity.drops);
        if(dropped instanceof Array){
            dropped.forEach(item => drop(item, -1)); // -1 idx means it's not from the inventory.
        } else {
            drop(dropped);
        }
    }

    if(entity instanceof Character){
        const items_slots = entity.inventory.extract_all_items_slots();
        items_slots.forEach(drop);
    }

    return events;
}

function destroy_entity(entity, world){
    debug.assertion(()=>entity instanceof concepts.Entity);
    debug.assertion(()=>world instanceof concepts.World);
    const entities = world.remove_entity(entity.id);
    debug.assertion(()=>entities instanceof Array && entities.length === 1);

    const events = [ new Destroyed(entity.id, entity.position) ];

    const destroyed_entity = entities[0];
    debug.assertion(()=>destroyed_entity instanceof concepts.Entity);
    events.push( ...drop_entity_drops(destroyed_entity, world));

    if(destroyed_entity.is_crucial){
        events.push( ...fail_game(world));
    }

    return events;
}

function destroy_at(position, world){
    debug.assertion(()=>position);
    debug.assertion(()=>world instanceof concepts.World);
    const entity = world.entity_at(position);
    if(entity){
        return destroy_entity(entity, world);
    } else {
        return [];
    }
}

function deal_damage(entity, damage){
    debug.assertion(()=>Number.isInteger(damage) && damage >= 0);
    debug.assertion(()=>entity instanceof concepts.Entity);
    if(entity instanceof Character){
        entity.take_damage(damage);
    } else {
        damage = 0; // All other entities take 0 damage.
    }
    return [ new Damaged(entity.id, entity.position, damage) ];
}