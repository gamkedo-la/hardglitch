
export {
    Rule_TakeItem,
    ItemTaken,
    TakeItem,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../game-animations.js";
import { Character } from "../core/character.js";
import { GameView } from "../game-view.js";
import { CharacterView } from "../view/character-view.js";
import { sprite_defs } from "../game-assets.js";
import { ItemView } from "../view/item-view.js";


class ItemTaken extends concepts.Event {
    constructor(taker, item){
        console.assert(taker instanceof Character);
        console.assert(item instanceof concepts.Item);

        super({
            description: `Character ${taker.id} took item ${item.id}`,
            allow_parallel_animation: false,
        });
        this.taker_id = taker.id;
        this.taker_position = taker.position;
        this.item_id = item.id;
        this.item_position = item.position;
    }

    get focus_positions() { return [ this.item_position, this.taker_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const character_view = game_view.get_entity_view(this.taker_id);
        console.assert(character_view instanceof CharacterView);
        const item_view = game_view.get_entity_view(this.item_id);
        console.assert(item_view instanceof ItemView);
        yield* anim.take_item(character_view, item_view);
        game_view.remove_entity_view(this.item_id);
    }
};


class TakeItem extends concepts.Action {
    icon_def = sprite_defs.icon_action_take;

    constructor(target_position){
        console.assert(target_position instanceof concepts.Position);
        super(`take_item_at_${target_position.x}_${target_position.y}`,
            "Take Item", target_position,
            { // costs
                action_points: 1
            });
        this.is_basic = true; // Items occupy positions that cannot be moved into, so it's safe to assume that we will take them by default.
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const item = world.item_at(this.target_position);
        console.assert(item instanceof concepts.Item);
        world.remove_entity(item.id);
        character.inventory.add(item);
        return [ new ItemTaken(character, item) ];
    }
};


class Rule_TakeItem extends concepts.Rule {
    range = new visibility.Range_Cross_Axis(1,2);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        if(!character.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        if(character.inventory.is_full)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, this.range)
            .filter(target=> { // Only if there is an item to take.
                const item = world.item_at(target);
                return item && item.can_be_taken === true;
            })
            .forEach((target)=>{
                const action = new TakeItem(target);
                action.range = this.range;
                actions[action.id] = action;
            });
        return actions;
    }


};



