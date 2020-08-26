// This file contains the global definitions/values for defining how the world works
// in this game.

export { world_grid, default_rules, game_levels };

import * as basic_rules from "./rules/rules-basic.js";
import { Rule_Movements, Rule_Jump, Rule_Swap } from "./rules/rules-movement.js";
import { Rule_ActionPoints } from "./rules/rules-actionpoints.js";
import { Rule_Push, Rule_Pull } from "./rules/rules-forces.js";
import { Rule_Void } from "./rules/rules-void.js";
import { Rule_Stream } from "./rules/rules-stream.js";
import { Rule_Destroy } from "./rules/rules-destroy.js";
import { Rule_Delete } from "./rules/rules-delete.js";
import { Rule_Repair } from "./rules/rules-repair.js";
import { Rule_TakeItem } from "./rules/rules-items.js";
import { Rule_Decrypt } from "./rules/rules-decrypt.js";


import * as level_1 from "./levels/level_1.js";
import * as level_2 from "./levels/level_2.js";
import * as level_3 from "./levels/level_3.js";
import * as level_4 from "./levels/level_4.js";

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
    new Rule_Push(),
    new Rule_Pull(),
    new Rule_Swap(),

    new Rule_Repair(),
    new Rule_Destroy(),
    new Rule_Delete(),

    new Rule_Stream(),

    // The rules below check for the state of the game, so anything that modifies the game should be run before.
    new Rule_Void(),
    new basic_rules.Rule_Destroy_NoIntegrity(),
    new basic_rules.Rule_GameOver(),
    new basic_rules.Rule_LevelExit(),

    new Rule_ActionPoints(), // TODO: check that it's in the right order
];


const game_levels = [
    level_1, level_2, level_3, level_4,
];

