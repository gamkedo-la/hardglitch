
export {
    Rule_TakeItem,
    ItemTaken,
    InventoryItemDropped,
    EntityDropped,
    TakeItem,
    SwapItemSlots,
    DropItem,
    handle_items_in_limbo,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../game-animations.js";
import { Character } from "../core/character.js";
import { GameView } from "../game-view.js";
import { CharacterView } from "../view/character-view.js";
import { sprite_defs } from "../game-assets.js";
import { ItemView } from "../view/item-view.js";
import { spawn_entities_around } from "./spawn.js";
import { auto_newlines } from "../system/utility.js";

const take_item_range = new visibility.Range_Cross_Axis(1,2);

class ItemTaken extends concepts.Event {
    constructor(taker, item, inventory_idx){
        debug.assertion(()=>taker instanceof Character);
        debug.assertion(()=>item instanceof concepts.Item);
        debug.assertion(()=>Number.isInteger(inventory_idx));

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
        debug.assertion(()=>game_view instanceof GameView);
        const character_view = game_view.get_entity_view(this.taker_id);
        debug.assertion(()=>character_view instanceof CharacterView);
        const item_view = game_view.focus_on_entity(this.item_id);
        debug.assertion(()=>item_view instanceof ItemView);
        yield* anim.take_item(game_view.fx_view, character_view, item_view);
        game_view.remove_entity_view(this.item_id);
        if(character_view.is_player){
            game_view.ui.inventory.set_item_view_at(this.inventory_idx, item_view);
            yield* anim.inventory_add(game_view.ui.inventory.fx_view, game_view.ui.inventory, this.inventory_idx);
            game_view.ui.inventory.request_refresh();
        }
        game_view.clear_focus();
    }
};

class EntityDropped extends concepts.Event {
    constructor(dropped, target){
        debug.assertion(()=> dropped instanceof concepts.Entity);
        debug.assertion(()=> target instanceof concepts.Position);
        super({
            description: `Dropped Item ${dropped.id} at ${JSON.stringify(target)}`,
            allow_parallel_animation: true,
        });
        this.drop_position = target;
        this.dropped_id = dropped.id;
    }

    get focus_positions() { return [ this.drop_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.drop_position);
        const item_view = game_view.add_entity_view(this.dropped_id);
        yield* anim.drop_item(game_view.fx_view, this.drop_position);
        game_view.add_entity_view(item_view);
        item_view.is_visible = true;
    }
}

class InventoryItemDropped extends concepts.Event {
    constructor(dropper, item_idx, target, dropped_id){
        debug.assertion(()=>dropper instanceof concepts.Entity);
        debug.assertion(()=>Number.isInteger(item_idx) || item_idx === undefined);

        super({
            description: `Entity ${dropper.id} dropped entity ${dropped_id} from slot ${item_idx} at ${JSON.stringify(target)}`,
            allow_parallel_animation: false,
        });
        this.dropper_id = dropper.id;
        this.dropper_position = dropper.position;
        this.item_idx = item_idx;
        this.drop_position = target;
        this.dropper_is_player = dropper.is_player_actor;
        this.dropped_id = dropped_id;
    }

    get focus_positions() { return [ this.drop_position, this.dropper_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.drop_position);
        if(this.dropper_is_player) {
            yield* anim.inventory_remove(game_view.ui.inventory.fx_view, game_view.ui.inventory, this.item_idx);
            const item_view = game_view.ui.inventory.remove_item_view_at(this.item_idx);
            debug.assertion(()=>item_view instanceof ItemView);
            item_view.is_visible = false;
            item_view.game_position = this.drop_position;
            yield* anim.drop_item(game_view.fx_view, this.drop_position);
            game_view.add_entity_view(item_view);
            item_view.is_visible = true;
            game_view.ui.inventory.request_refresh();
        } else {
            const item_view = game_view.add_entity_view(this.dropped_id);
            debug.assertion(()=>item_view instanceof ItemView);
            yield* anim.drop_item(game_view.fx_view, this.drop_position);
            game_view.add_entity_view(item_view);
            item_view.is_visible = true;
        }
    }
};

function drop_items_around(world, dropper, ...items){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>dropper instanceof Character);
    debug.assertion(()=>items.every(item => item instanceof concepts.Item));
    return spawn_entities_around(world, dropper.position, items, EntityDropped);
}

function handle_items_in_limbo(world, character){
    // Items in limbo should be dropped into the world:
    const items_in_limbo = character.inventory.extract_items_from_limbo();
    return drop_items_around(world, character, ...items_in_limbo);
}

class TakeItem extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_take; }
    static get action_type_name() { return "Take Item"; }
    static get action_type_description() { return auto_newlines("Transfer the target item in this character's free item slot.", 35); }
    static get range() { return take_item_range; }
    static get costs(){
        return {
            action_points: { value: 1 },
        };
    }

    constructor(target_position){
        debug.assertion(()=>target_position instanceof concepts.Position);
        super(`take_item_at_${target_position.x}_${target_position.y}`,
            "Take this item", target_position);
        this.is_basic = true;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item = world.item_at(this.target_position);
        debug.assertion(()=>item instanceof concepts.Item);
        world.remove_entity(item.id);
        const item_idx = character.inventory.add(item);
        character.inventory.update_modifiers();
        return [
            new ItemTaken(character, item, item_idx),
            ...handle_items_in_limbo(world, character),
        ];
    }
};


class SwappedItemsSlots extends concepts.Event {
    constructor(character, left_item_idx, right_item_idx){
        debug.assertion(()=>character instanceof Character);
        super({
            description: `Character swaped inventory items ${left_item_idx} and ${right_item_idx}`,
            allow_parallel_animation: false,
        });
        this.left_item_idx = left_item_idx;
        this.right_item_idx = right_item_idx;
        this.character_position = character.position;
    }

    get focus_positions() { return [ this.character_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.character_position);
        const inventory = game_view.ui.inventory;
        yield* anim.inventory_remove(game_view.ui.inventory.fx_view, game_view.ui.inventory, this.left_item_idx);
        const left_item_view = inventory.remove_item_view_at(this.left_item_idx);
        const right_item_view = inventory.remove_item_view_at(this.right_item_idx);
        yield* anim.inventory_add(game_view.ui.inventory.fx_view, game_view.ui.inventory, this.right_item_idx);
        if(left_item_view)
            inventory.set_item_view_at(this.right_item_idx, left_item_view);
        if(right_item_view)
            inventory.set_item_view_at(this.left_item_idx, right_item_view);
        inventory.request_refresh();
    }
}

class SwapItemSlots extends concepts.Action {

    static get costs(){
        return {
            action_points: { value: 1 },
        };
    }

    constructor(slot_a_idx, slot_b_idx){
        debug.assertion(()=>Number.isInteger(slot_a_idx) && slot_a_idx >= 0);
        debug.assertion(()=>Number.isInteger(slot_b_idx) && slot_b_idx >= 0);
        super(`swap_items_from_slot_${slot_a_idx}_to_${slot_b_idx}`, "THIS SHOULD NEVER BE DISPLAYED", undefined);
        this.is_generated = true;

        this.slot_a_idx = slot_a_idx;
        this.slot_b_idx = slot_b_idx;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item_a = character.inventory.swap(this.slot_a_idx, this.slot_b_idx);
        character.inventory.update_modifiers();
        // Beware: the inventory size can change because we active items changing it.
        return [
            new SwappedItemsSlots(character, this.slot_a_idx, this.slot_b_idx),
            ...handle_items_in_limbo(world, character),
        ];
    }
};

class DropItem extends concepts.Action {
    static get costs(){
        return {
            action_points: { value: 1 },
        };
    }

    constructor(target, inventory_idx){
        debug.assertion(()=>target instanceof concepts.Position);
        debug.assertion(()=>Number.isInteger(inventory_idx) && inventory_idx >= 0);
        super(`drom_item_at_${target.x}_${target.y}`, "THIS SHOULD NEVER BE DISPLAYED", undefined);
        this.is_generated = true;

        this.target = target;
        this.item_idx = inventory_idx;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item = character.inventory.remove(this.item_idx);
        debug.assertion(()=>item instanceof concepts.Item);
        item.position = this.target;
        world.add_entity(item);
        character.inventory.update_modifiers();
        return [
            new InventoryItemDropped(character, this.item_idx, this.target, item.id),
            ...handle_items_in_limbo(world, character),
        ];
    }
};

class Rule_TakeItem extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        // if(!character.is_player_actor) // Only allow the player to take items. Discutable XD
        //     return {};

        if(character.inventory.is_full)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, TakeItem.range)
            .filter(target=> { // Only if there is an item to take.
                const item = world.item_at(target);
                return item && item.can_be_taken === true;
            })
            .forEach((target)=>{
                const action = new TakeItem(target);
                actions[action.id] = action;
            });
        return actions;
    }
};


