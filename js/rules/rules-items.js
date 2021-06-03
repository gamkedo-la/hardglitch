
export {
    Rule_TakeItem,
    ItemTaken,
    InventoryItemDropped,
    EntityDropped,
    TakeItem,
    SwapItemSlots,
    DropItem,
    DestroyInventoryItem,
    Rule_WallControl,
    CreateMovableWall_Opaque,
    CreateMovableWall_Transparent,
    DestroyMovableWall,
    handle_items_in_limbo,
    drop_items_around,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../game-animations.js";
import * as tiles from "../definitions-tiles.js";
import { Character } from "../core/character.js";
import { GameView } from "../game-view.js";
import { CharacterView } from "../view/character-view.js";
import { sprite_defs } from "../game-assets.js";
import { EntitySpawned, spawn_entities_around } from "./spawn.js";
import { auto_newlines, lazy_call, random_sample } from "../system/utility.js";
import { EntityView } from "../view/entity-view.js";
import { actions_for_each_target, add_default_action_if_adjacent, ranged_actions_for_each_target } from "./rules-common.js";
import { all_opaque_movable_walls, all_transparent_movable_walls, MovableWall, MovableWall_Glass } from "../definitions-items.js";
import { destroy_at } from "./destruction.js";
import { config } from "../game-config.js";

const take_item_range = new visibility.Range_Cross_Axis(1,2);
const create_block_range = new visibility.Range_Square(1,3);
const destroy_block_range = new visibility.Range_Cross_Star(1,3);

class ItemTaken extends concepts.Event {
    constructor(taker, item, inventory_idx){
        debug.assertion(()=>taker instanceof Character);
        debug.assertion(()=>item instanceof concepts.Item || (taker.can_take_entities && item instanceof concepts.Entity));
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
        const slot_position = game_view.ui.inventory.get_slot_position(this.inventory_idx);
        if(item_view instanceof EntityView){
            const take_animation = character_view.is_player ? anim.player_take_item : anim.take_item;
            yield* take_animation(game_view.fx_view, character_view, item_view, slot_position);
        }

        game_view.remove_entity_view(this.item_id);
        if(character_view.is_player){
            debug.assertion(()=>item_view instanceof EntityView);
            game_view.ui.inventory.set_item_view_at(this.inventory_idx, item_view);
            yield* anim.inventory_add(game_view.ui.inventory.fx_view, game_view.ui.inventory, this.inventory_idx);
            game_view.ui.inventory.request_refresh();
            character_view.sync_health();
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
        const previous_visibility = item_view.is_visible;
        yield* anim.drop_item(game_view.fx_view, this.drop_position);
        game_view.add_entity_view(item_view);
        item_view.is_visible = previous_visibility;
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
            if(item_view instanceof EntityView){ // Could be something else than an item.
                const previous_visibility = item_view.is_visible;
                item_view.is_visible = false;
                item_view.game_position = this.drop_position;
                yield* anim.drop_item(game_view.fx_view, this.drop_position);
                game_view.add_entity_view(item_view);
                item_view.is_visible = previous_visibility;
            }
            game_view.ui.inventory.request_refresh();

            const player_character_view = game_view.get_entity_view(this.dropper_id);
            if(player_character_view)
                player_character_view.sync_health();
        } else {
            const dropped_view = game_view.add_entity_view(this.dropped_id);
            const previous_visibility = dropped_view.is_visible;
            debug.assertion(()=>dropped_view instanceof EntityView); // Could be something else than an item.
            yield* anim.drop_item(game_view.fx_view, this.drop_position);
            game_view.add_entity_view(dropped_view);
            dropped_view.is_visible = previous_visibility;
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
            "Take this", target_position);
        this.is_basic = true;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item = world.entity_at(this.target_position);
        debug.assertion(()=>item instanceof concepts.Item || (character.can_take_entities && item instanceof concepts.Entity));
        world.remove_entity(item.id);
        item.owner = character;
        item.world = world;
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

        const player_character_view = game_view.focus_on_current_player_character();
        if(player_character_view)
            player_character_view.sync_health();
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



class InventoryItemDestroyed extends concepts.Event {
    constructor(dropper, item_idx, dropped_id){
        debug.assertion(()=>dropper instanceof concepts.Entity);
        debug.assertion(()=>Number.isInteger(item_idx) || item_idx === undefined);

        super({
            description: `Entity ${dropper.id} destroyed entity ${dropped_id} that was in slot ${item_idx}`,
            allow_parallel_animation: false,
        });
        this.dropper_id = dropper.id;
        this.dropper_position = dropper.position;
        this.item_idx = item_idx;
        this.dropper_is_player = dropper.is_player_actor;
        this.dropped_id = dropped_id;
    }

    get focus_positions() { return [ this.dropper_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.dropper_position);
        if(this.dropper_is_player) {
            game_view.ui.inventory.remove_item_view_at(this.item_idx);
            game_view.ui.inventory.request_refresh();
            yield* anim.inventory_destroy(game_view.ui.inventory.fx_view, game_view.ui.inventory, game_view.ui.inventory.destroy_item_slot.idx);
        }
    }
};

class DestroyInventoryItem extends concepts.Action {

    static get costs(){
        return {
            action_points: { value: 1 },
        };
    }

    constructor(slot_idx){
        debug.assertion(()=>Number.isInteger(slot_idx) && slot_idx >= 0);
        super(`destroy_inventory_item_${slot_idx}`, "THIS SHOULD NEVER BE DISPLAYED", undefined);
        this.is_generated = true;

        this.slot_idx = slot_idx;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item_to_destroy = character.inventory.remove(this.slot_idx);
        character.inventory.update_modifiers();
        // Beware: the inventory size can change because we active items changing it.
        return [
            new InventoryItemDestroyed(character, this.slot_idx, item_to_destroy.id),
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
        debug.assertion(()=>item instanceof concepts.Entity);
        item.position = this.target;
        delete item.owner;
        delete item.world;
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

        if(character.inventory.is_full)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, TakeItem.range)
            .filter(target=> { // Only if there is an item to take.
                const item = world.entity_at(target);
                if(item instanceof concepts.Item){
                    if(item.can_be_taken === true)
                        return true;
                    if(character.can_take_movable_walls && item instanceof MovableWall)
                        return true;

                    return false;
                }

                if(character.can_take_entities && item instanceof concepts.Entity)
                    return true;

                return false;
            })
            .forEach((target)=>{
                const action = new TakeItem(target);
                actions[action.id] = action;
                if(config.enable_take_by_move){
                    add_default_action_if_adjacent(character.position, actions, action, target);
                }
            });
        return actions;
    }
};


class CreateMovableWall extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_corrupt; }
    static get action_type_name() { return "THIS SHOULD NEVER BE READ"; }
    static get action_type_description() { return "THIS SHOULD NEVER BE READ"; }
    static get range() { return create_block_range; }
    static get costs(){
        return {
            action_points: { value: 4 },
        };
    }

    constructor(target_position, is_opaque){
        debug.assertion(()=>target_position instanceof concepts.Position);
        debug.assertion(()=>typeof is_opaque === "boolean");
        const block_name = is_opaque ? "Mutex" : "Atomic";
        super(`create_${block_name}_at_${target_position.x}_${target_position.y}`,
            `Create ${block_name} here`, target_position);
        this.is_opaque = is_opaque;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);

        const possible_movable_wall_type = this.is_opaque ? all_opaque_movable_walls() : all_transparent_movable_walls();
        const movable_wall_type = random_sample(possible_movable_wall_type);
        const movable_wall = new movable_wall_type();
        movable_wall.position = this.target_position;
        world.add_entity(movable_wall);

        return [
            new EntitySpawned(movable_wall, movable_wall.position),
        ];
    }
};


class CreateMovableWall_Opaque extends CreateMovableWall {
    static get action_type_name() { return "Create Mutex Block"; }
    static get action_type_description() { return auto_newlines("Create a Mutex Block that will block vision and moves.", 35); }
    static get costs(){
        return {
            action_points: { value: 6 },
        };
    }

    constructor(position){ super(position, true); }
}

class CreateMovableWall_Transparent extends CreateMovableWall {
    static get action_type_name() { return "Create Atomic Block"; }
    static get action_type_description() { return auto_newlines("Create a Atomic Block that will block moves but not vision.", 35); }
    static get costs(){
        return {
            action_points: { value: 4 },
        };
    }

    constructor(position){ super(position, false); }
}

class DestroyMovableWall extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_delete; }
    static get action_type_name() { return "Destroy Block"; }
    static get action_type_description() { return auto_newlines("Destroys a Mutex or Atomic block.", 35); }
    static get range() { return destroy_block_range; }
    static get costs(){
        return {
            action_points: { value: 6 },
        };
    }

    constructor(target_position){
        debug.assertion(()=>target_position instanceof concepts.Position);
        super(`destroy_movable_wall_at_${target_position.x}_${target_position.y}`,
            "Destroy this", target_position);
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const item = world.entity_at(this.target_position);
        debug.assertion(()=>item instanceof MovableWall || item instanceof MovableWall_Glass);
        return destroy_at(this.target_position, world);
    }
};



class Rule_WallControl extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        // Destruction
        const destruction_actions = ranged_actions_for_each_target(world, character, DestroyMovableWall, target=> { // Only if there is a movable wall to destroy.
            const item = world.item_at(target);
            return item instanceof MovableWall || item instanceof MovableWall_Glass;
        } );

        // Creation
        const valid_creation_position = () => lazy_call(visibility.valid_move_positions, world, character, CreateMovableWall.range, tiles.is_walkable);
        const creation_actions = actions_for_each_target(character, CreateMovableWall, valid_creation_position, (action_type, target)=>{
            const action= new action_type(target);
            return action;
        });

        return Object.assign(destruction_actions, creation_actions);
    }
};
