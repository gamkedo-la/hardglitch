export {
    Virus,
}
import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";
import { closest_entity, move_away, move_towards, scan_entities_around, select_action_by_type, wander } from "./characters-common.js";
import { AntiVirus } from "./antivirus.js";
import { Copy } from "../rules/rules-copy.js";
import { Merge } from "../rules/rules-merge.js";

const virus_gang_size = 3;
const virus_gang_distance = 5;

class VirulentInvader extends concepts.Actor {

    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        const antivirus = this._find_antivirus(character, world);
        if(antivirus instanceof Character){
            return move_away(possible_actions, antivirus.position);
        }

        const target = this._get_target(character, world);
        if(target instanceof Character){
            const distance_to_target = target.position.distance(character.position);
            if(distance_to_target > 1){
                if(this._gang_size(character, world) < virus_gang_size){
                    const duplicates = this._duplicates(possible_actions, character);
                    if(duplicates instanceof concepts.Action)
                        return duplicates;
                }

                const move = move_towards(possible_actions, target.position);
                if(move instanceof concepts.Action)
                    return move;

            } else {
                // We are close: try to merge
                const merge = this._merge_in_target(possible_actions, target);
                if(merge instanceof concepts.Action)
                    return merge;
            }
        }

        const move = wander(possible_actions);
        if(move)
            return move;

        return possible_actions.wait;
    }

    _get_target(character, world){
        const target = closest_entity(character, world, entity => entity instanceof Character
                                                                     && !(entity instanceof Virus)
                                                                     && !(entity instanceof AntiVirus)
                                                                     && !(entity.actor instanceof VirulentInvader)
                                            );
        return target;
    }

    _find_antivirus(character, world){
        return closest_entity(character, world, entity => entity instanceof AntiVirus);
    }

    _merge_in_target(possible_actions, target){
        return select_action_by_type(possible_actions, target.position, Merge);
    }

    _duplicates(possible_actions, character){
        return select_action_by_type(possible_actions, character.position, Copy);
    }

    _gang_size(character, world){
        const gang = scan_entities_around(character, world, entity => entity instanceof Character
                                                                   && entity.actor instanceof VirulentInvader
                                                                   && entity.position.distance(character.position) <= virus_gang_distance);
        return gang.length;
    }

};

class Virus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.virus,
        }}
    };

    description = auto_newlines("Self-replicating malware. Beware of it's resistance and agressivity. Hunted by Anti-Viruses.", 35);
    is_anomaly = true;

    constructor(){
        super("Virus", );
        this.actor = new VirulentInvader;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 8;
        this.stats.ap_recovery.real_value = 20;
        this.stats.action_points.real_max = 15;
        this.stats.action_points.real_value = 15;
        this.stats.integrity.real_max = 20;
        this.stats.integrity.real_value = 20;
        this.inventory.add(new items.Item_Copy());
        this.inventory.add(new items.Item_Merge());
    }

};
