// This file contains the global definitions/values for defining how the world works
// in this game.

export {
    world_grid, default_rules, game_levels, grid_ID,
    is_blocked_position,
    is_valid_world,
    get_entity_type,
};

import * as debug from "./system/debug.js";
import * as basic_rules from "./rules/rules-basic.js";
import * as concepts from "./core/concepts.js";
import { not } from "./system/utility.js";
import { Grid } from "./system/grid.js";

import { Rule_Movements, Rule_Jump, Rule_Swap, Rule_RandomJump } from "./rules/rules-movement.js";
import { Rule_ActionPoints } from "./rules/rules-actionpoints.js";
import { Rule_Push, Rule_Pull } from "./rules/rules-forces.js";
import { Rule_Void } from "./rules/rules-void.js";
import { Rule_Stream } from "./rules/rules-stream.js";
import { Rule_Destroy } from "./rules/rules-destroy.js";
import { Rule_Delete } from "./rules/rules-delete.js";
import { Rule_Repair } from "./rules/rules-repair.js";
import { Rule_TakeItem } from "./rules/rules-items.js";
import { Rule_Decrypt } from "./rules/rules-decrypt.js";
import { Rule_Copy } from "./rules/rules-copy.js";
import { Rule_Corruption } from "./rules/rules-corruption.js";
import { Rule_Unstability } from "./rules/rules-unstability.js";
import { Rule_Merge } from "./rules/rules-merge.js";


import * as level_1 from "./levels/level_1.js";
import * as level_2 from "./levels/level_2.js";
import * as level_3 from "./levels/level_3.js";
import * as level_4 from "./levels/level_4.js";
import { all_characters_types } from "./deflinitions-characters.js";
import { all_item_types } from "./definitions-items.js";

const world_grid = {
    width: 64,
    height: 64,
};

const default_rules = [ // BEWARE: rules will be applied in-order.
    new basic_rules.Rule_BasicActions(),
    new Rule_Movements(),
    new Rule_TakeItem(),
    new Rule_Decrypt(),

    new Rule_Jump(),
    new Rule_RandomJump(),
    new Rule_Push(),
    new Rule_Pull(),
    new Rule_Swap(),

    new Rule_Repair(),
    new Rule_Destroy(),
    new Rule_Delete(),

    new Rule_Copy(),
    new Rule_Merge(),

    new Rule_Corruption(),
    new Rule_Unstability(),
    new Rule_Stream(),

    // The rules below check for the state of the game, so anything that modifies the game should be run before.
    new Rule_Void(),
    new basic_rules.Rule_Destroy_NoIntegrity(),
    new basic_rules.Rule_GameOver(),
    new basic_rules.Rule_LevelExit(),

    new Rule_ActionPoints(), // TODO: check that it's in the right order
];

let _all_entity_types;

function all_entity_types(){
    if(!_all_entity_types){
        const types = [
            ...all_item_types(),
            ...all_characters_types(),
        ];
        _all_entity_types = {};
        for(const type of types){
            _all_entity_types[type.name] = type;
        }
    }
    return _all_entity_types;
}

function get_entity_type(type_name){
    return all_entity_types()[type_name];
}

const game_levels = [
    level_1, level_2, level_3, level_4,
];

const grid_ID = {
    floor: "floor",
    surface: "surface",
    corruption: "corruption",
    unstable: "unstable",
};

// Returns true if the position given is blocked by an entity (Body or Item) or a tile that blocks (wall).
// The meaning of "blocking" depends on the provided predicate.
function is_blocked_position(world, position, is_not_blocking){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>position);
    debug.assertion(()=>is_not_blocking instanceof Function);
    const is_blocking = not(is_not_blocking); // Why do this instead of taking a is_blocking predicate? Because the code calling this function is far easier to understand (when you read it) if the predicate is not negated.

    if(!world.is_valid_position(position))
        return true;

    const floor_tile = world.grids[grid_ID.floor].get_at(position);
    if(!floor_tile || is_blocking(floor_tile))
        return true;

    const surface_tile = world.grids[grid_ID.surface].get_at(position);
    if(surface_tile && is_blocking(surface_tile))
        return true;

    if(world.body_at(position))
        return true;

    if(world.item_at(position))
        return true;

    return false;
}

function is_valid_world(world){
    return world instanceof concepts.World
        && world.width > 1 && world.height > 1
        && world.all_grids.length >= Object.keys(grid_ID).length
        && Object.values(grid_ID).every(grid_id => world.grids[grid_id] instanceof Grid)
        && world.all_grids.every(grid => grid.width === world.width && grid.height === world.height)
        ;
}
