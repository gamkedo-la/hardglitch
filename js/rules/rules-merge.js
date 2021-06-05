
export {
    Rule_Merge,
    Merge,
    Merged,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../game-animations.js";
import * as audio from "../system/audio.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { handle_items_in_limbo } from "./rules-items.js";
import { EntityScanned } from "./spawn.js";
import { auto_newlines } from "../system/utility.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { CharacterView } from "../view/character-view.js";

const merge_ap_cost = 20;
const merge_range = new visibility.Range_Cross_Axis(1, 2);


class Merged extends concepts.Event {

    constructor(merger, merged_in){
        super({
            description: `Merged into entity`,
            allow_parallel_animation: false,
        });

        this.merger_id = merger.id;
        this.merged_in_id = merged_in.id;
        this.merger_position = merger.position;
        this.merged_in_position = merged_in.position;
    }

    get focus_positions() { return [ this.merger_position, this.merged_in_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const merger_view = game_view.get_entity_view(this.merger_id);
        const mergedin_view = game_view.focus_on_entity(this.merged_in_id);
        if(merger_view instanceof CharacterView && mergedin_view instanceof CharacterView)
            yield* anim.merge_characters(game_view.fx_view, merger_view, mergedin_view);
        game_view.reset_entities();
    }
};

class Merge extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_merge; }
    static get action_type_name() { return "Merge"; }
    static get action_type_description() { return auto_newlines("Merges into the entity and take its shape and characteristics.\nDoes not work on items.", 35); }

    static get range() { return merge_range; }
    static get costs(){
        return {
            action_points: { value: merge_ap_cost },
        };
    }

    constructor(target_position){
        super(`merge_${target_position.x}_${target_position.y}`,
                `Merges into that entity.`);
        this.target_position = target_position;
    }

    execute(world, character){
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>world instanceof concepts.World);
        const merged_entity =  world.entity_at(this.target_position);
        debug.assertion(()=>merged_entity instanceof concepts.Entity);

        const events = [new EntityScanned(merged_entity)];

        if(merged_entity instanceof Character){
            // Here is what it means to be merged:

            // 1. All inventory gets dropped.
            character.inventory.move_all_items_into_limbo();
            events.push(...handle_items_in_limbo(world, character));

            // 2. Take control of the body.
            merged_entity.actor = character.actor; // It's that simple.
            events.push(new Merged(character, merged_entity));

            // 3. Rename the new entity appropriately.
            merged_entity.name = `${merged_entity.name}-${character.name}`;

            // 4. Lose the previous body.
            world.remove_entity(character.id);

        } else {
            // We don't allow merging anything other than characters.
            // TODO: play some kind of "failed" animation here?
            audio.playEvent("errorAction");
        }
        return events;
    }
};


class Rule_Merge extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Merge);
    }

};

