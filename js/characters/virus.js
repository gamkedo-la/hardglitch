export {
    Virus,
    VirusBehavior,
}
import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import * as tiles from "../definitions-tiles.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines, random_int } from "../system/utility.js";
import { closest_entity, move_away, move_towards, select_action_by_type, wander } from "./characters-common.js";
import { AntiVirus } from "./antivirus.js";
import { Copy } from "../rules/rules-copy.js";
import { Merge } from "../rules/rules-merge.js";
import { DropItem, TakeItem } from "../rules/rules-items.js";
import { Range_Circle, search_entities, valid_spawn_positions } from "../core/visibility.js";
import { Delete } from "../rules/rules-delete.js";
import { distance_grid_precise } from "../system/spatial.js";
import { desc_chars_per_line } from "../definitions-texts.js";

const virus_gang_size = 3; // Total count of Virus that should be around each-other when hunting.
const virus_max_gang_distance = 3;
const virus_gang_range = new Range_Circle(0, 6); // Range in which Virus around another are considered a gang.
const interersting_item_types = [ items.Item_Copy, items.Item_Merge, items.Item_Jump, items.Item_ByteClearer ];
class VirusBehavior extends concepts.Actor {

    is_virus = true;
    is_daring = random_int(1, 100) > 90 ? true : false;


    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        if(!this.is_daring){
            const antivirus = this._find_antivirus(character, world);
            if(antivirus instanceof Character){

                const dice_roll = random_int(1, 100);
                if(dice_roll >= 95){
                    const duplicates = this._duplicates(possible_actions, character);
                    if(duplicates instanceof concepts.Action)
                        return duplicates;
                }

                const attack = select_action_by_type(possible_actions, antivirus.position, Delete);
                if(attack instanceof concepts.Action)
                    return attack;

                const move =  move_away(character, possible_actions, antivirus.position);
                if(move instanceof concepts.Action)
                    return move;
            }
        }

        const drop_item = this._drop_item(character, world);
        if(drop_item instanceof concepts.Action)
            return drop_item;

        const gather_items = this._gather_items_around(possible_actions, character, world);
        if(gather_items instanceof concepts.Action)
            return gather_items;

        const target = this._get_target(character, world);
        const gang = this._get_gang(character, world);
        if(target instanceof Character){
            const distance_to_target = target.position.distance(character.position);
            if(distance_to_target > 1){
                if(gang.length < virus_gang_size){
                    const duplicates = this._duplicates(possible_actions, character);
                    if(duplicates instanceof concepts.Action)
                        return duplicates;
                }

                const move = move_towards(character, possible_actions, target.position);
                if(move instanceof concepts.Action)
                    return move;

            } else {
                // We are close: try to merge
                const merge = this._merge_in_target(possible_actions, target);
                if(merge instanceof concepts.Action)
                    return merge;
            }
        }

        const farthest_gang_member = gang.reverse().find(virus => virus != character);
        debug.assertion(()=>farthest_gang_member == null || farthest_gang_member.is_virus);

        // Move towards gang's members if we have any and are too far.
        if(farthest_gang_member instanceof Character
        && distance_grid_precise(character.position, farthest_gang_member.position) > virus_max_gang_distance
        ){
            const move = move_towards(character, possible_actions, farthest_gang_member.position);
            if(move)
                return move;
        }

        return possible_actions.wait;
    }

    _gather_items_around(possible_actions, character, world){
        if(this._have_item_clone(character) && this._have_item_merge(character))
            return;

        const interesting_item_around = closest_entity(character, world, entity => interersting_item_types.some(item_type => entity instanceof item_type));
        if(interesting_item_around){
            const take_action = select_action_by_type(possible_actions, interesting_item_around.position, TakeItem);
            if(take_action instanceof concepts.Action)
                return take_action;

            return move_towards(character, possible_actions, interesting_item_around.position);
        }
    }

    _drop_item(character, world){
        const uninteresting_items = character.inventory.stored_items
                                        .map((item, idx)=> { return {idx, item} })
                                        .filter(info => info.item instanceof concepts.Item
                                                        && !interersting_item_types.some(item_type => info.item instanceof item_type));
        if(uninteresting_items.length > 0){
            const drop_positions = valid_spawn_positions(world, character.position, tiles.is_walkable);
            return new DropItem(drop_positions.shift(), uninteresting_items.shift().idx);
        }
    }

    _have_item_clone(character){
        return character.inventory.stored_items.some(item => item instanceof items.Item_Copy);
    }

    _have_item_merge(character){
        return character.inventory.stored_items.some(item => item instanceof items.Item_Merge);
    }

    _get_target(character, world){
        const target = closest_entity(character, world, entity => entity instanceof Character
                                                                     && !entity.is_virus
                                                                     && (!(entity instanceof AntiVirus) || this.is_daring)
                                            );
        return target;
    }

    _find_antivirus(character, world){
        return closest_entity(character, world, entity => entity instanceof AntiVirus && !entity.is_virus);
    }

    _merge_in_target(possible_actions, target){
        return select_action_by_type(possible_actions, target.position, Merge);
    }

    _duplicates(possible_actions, character){
        return select_action_by_type(possible_actions, character.position, Copy);
    }

    _get_gang(character, world){
        const gang = search_entities(world, character.position, virus_gang_range, (entity)=> entity.is_virus);
        return gang;
    }


};

class Virus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.virus,
        }}
    };

    description = auto_newlines("Self-replicating malware. Beware of its resistance and agressivity. Can steal virtual bodies if close enough. Hunted by Anti-Viruses.", desc_chars_per_line);
    is_anomaly = true;
    is_floating = true; // rule of cool

    constructor(){
        super("Virus", );
        this.actor = new VirusBehavior;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 4;
        this.stats.ap_recovery.real_value = 20;
        this.stats.action_points.real_max = 10;
        this.stats.action_points.real_value = 10;
        this.stats.integrity.real_max = 4;
        this.stats.integrity.real_value = 4;
        this.inventory.add(new items.Item_Copy());
        this.inventory.add(new items.Item_Merge());
    }

};
