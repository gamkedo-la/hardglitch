
export {
    Rule_Copy,
    Copy,
    Copied,
}

import * as debug from "../system/debug.js";
import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { EntitySpawned, spawn_entities_around } from "./spawn.js";
import { GameView } from "../game-view.js";
import * as anim from "../game-animations.js";
import { auto_newlines } from "../system/utility.js";

const copy_ap_cost = 20;

class Copied extends EntitySpawned {}; // Shortcut for now...

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

const copy_range = new visibility.Range_Circle(0, 6);

class Copy extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_merge; }
    static get action_type_name() { return "Copy"; }
    static get action_type_description() { return auto_newlines("Duplicates the target entity.", 35); }

    static get range() { return copy_range; }
    static get costs(){
        return {
            action_points: { value: copy_ap_cost },
        };
    }

    constructor(target_position){
        super(`copy_${target_position.x}_${target_position.y}`,
                `Make a copy of this entity`);
        this.target_position = target_position;
    }

    execute(world){
        debug.assertion(()=>world instanceof concepts.World);
        const copied_entity =  world.entity_at(this.target_position);
        debug.assertion(()=>copied_entity instanceof concepts.Entity);

        // Javascript copy ability is bad, so we will have to do it manually.
        // Copying a character does not imply copying it's inventory.
        // nor does it imply copying it's state.
        // What we want, exactly, is to copy the kind of entity it is.
        const entity_copy = new copied_entity.constructor(); // Warning: This only works because we know that the different Items and Characters types can be built from no parametters.
        const events = [new EntityScanned(copied_entity)];
        return events.concat(spawn_entities_around(world, this.target_position, [ entity_copy ]));
    }
};


class Rule_Copy extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Copy);
    }

};

