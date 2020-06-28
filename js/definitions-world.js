// This file contains the global definitions/values for defining how the world works
// in this game.

export { world_grid, default_rules };

import * as basic_rules from "./rules/rules-basic.js";
import { Rule_Movements, Rule_Jump } from "./rules/rules-movement.js";
import { Rule_ActionPoints } from "./rules/rules-actionpoints.js";
import { Rule_Push, Rule_Pull } from "./rules/rules-forces.js";

const world_grid = {
    width: 64,
    height: 64,
};

const default_rules = [ // BEWARE: rules will be applied in-order.
    new basic_rules.Rule_BasicActions(),
    new Rule_Movements(),
    new basic_rules.Rule_GameOver(),
    new Rule_ActionPoints(),
    new basic_rules.Rule_LevelExit(),

    new Rule_Jump(),
    new Rule_Push(),
    new Rule_Pull(),
];


