
export {
    Rule_TakeItem,
    ItemTaken,
    ItemDropped,
    TakeItem,
    SwapItemSlots,
    DropItem,
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
    constructor(taker, item, inventory_idx){
        console.assert(taker instanceof Character);
        console.assert(item instanceof concepts.Item);
        console.assert(Number.isInteger(inventory_idx));

        super({
            description: `Character ${taker.id} took item ${item.id}`,
            allow_parallel_animation: false,
        });
        this.taker_id = taker.id;
        this.taker_position = taker.position;
        this.item_id = item.id;
        this.item_position = item.position;
        this.inventory_idx = inventory_idx;
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
        game_view.ui.inventory.set_item_view_at(this.inventory_idx, item_view);
    }
};

class ItemDropped extends concepts.Event {
    constructor(dropper, item_idx, target){
        console.assert(dropper instanceof Character);
        console.assert(Number.isInteger(item_idx));

        super({
            description: `Character ${dropper.id} dropped item from slot ${item_idx} at ${JSON.stringify(target)}`,
            allow_parallel_animation: false,
        });
        this.dropper_id = dropper.id;
        this.dropper_position = dropper.position;
        this.item_idx = item_idx;
        this.drop_position = target;
    }

    get focus_positions() { return [ this.drop_position, this.dropper_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        game_view.ui.inventory.remove_item_view_at(this.item_idx);
        game_view.reset_entities(); // TODO: only add the entity view, instead of recreating all the entity views.
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
        this.is_basic = true;
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const item = world.item_at(this.target_position);
        console.assert(item instanceof concepts.Item);
        world.remove_entity(item.id);
        const item_idx = character.inventory.add(item);
        return [ new ItemTaken(character, item, item_idx) ];
    }
};


class SwappedItemsSlots extends concepts.Event {
    constructor(left_item_idx, right_item_idx){

        super({
            description: `Character swaped inventory items ${left_item_idx} and ${right_item_idx}`,
            allow_parallel_animation: false,
        });
        this.left_item_idx = left_item_idx;
        this.right_item_idx = right_item_idx;
    }

    get focus_positions() { return [ this.drop_position, this.dropper_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const inventory = game_view.ui.inventory;
        const left_item_view = inventory.remove_item_view_at(this.left_item_idx);
        const right_item_view = inventory.remove_item_view_at(this.right_item_idx);
        if(left_item_view)
            inventory.set_item_view_at(this.right_item_idx, left_item_view);
        if(right_item_view)
            inventory.set_item_view_at(this.left_item_idx, right_item_view);

    }
}

class SwapItemSlots extends concepts.Action {
    constructor(slot_a_idx, slot_b_idx){
        console.assert(Number.isInteger(slot_a_idx) && slot_a_idx >= 0);
        console.assert(Number.isInteger(slot_b_idx) && slot_b_idx >= 0);
        super(`swap_items_from_slot_${slot_a_idx}_to_${slot_b_idx}`, "THIS SHOULD NEVER BE DISPLAYED", undefined,
            { // costs
                action_points: 1,
            }
        );
        this.is_generated = true;

        this.slot_a_idx = slot_a_idx;
        this.slot_b_idx = slot_b_idx;
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const item_a = character.inventory.remove(this.slot_a_idx);
        const item_b = character.inventory.remove(this.slot_b_idx);
        if(item_a) character.inventory.set_item_at(this.slot_b_idx, item_a);
        if(item_b) character.inventory.set_item_at(this.slot_a_idx, item_b);

        return [ new SwappedItemsSlots(this.slot_a_idx, this.slot_b_idx)];
    }
};

class DropItem extends concepts.Action {
    constructor(target, inventory_idx){
        console.assert(target instanceof concepts.Position);
        console.assert(Number.isInteger(inventory_idx) && inventory_idx >= 0);
        super(`drom_item_at_${target.x}_${target.y}`, "THIS SHOULD NEVER BE DISPLAYED", undefined,
            { // costs
                action_points: 1,
            }
        );
        this.is_generated = true;

        this.target = target;
        this.item_idx = inventory_idx;
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const item = character.inventory.remove(this.item_idx);
        item.position = this.target;
        world.add(item);
        console.assert(item instanceof concepts.Item);
        return [new ItemDropped(character, this.item_idx, this.target)];
    }
};

class Rule_TakeItem extends concepts.Rule {
    range = new visibility.Range_Cross_Axis(1,2);

    get_actions_for(character, world){
        console.assert(character instanceof Character);

        if(!character.is_player_actor)
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



