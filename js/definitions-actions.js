export {
    all_uncommon_action_types,
}

import { Delete } from "./rules/rules-delete.js";
import { Destroy } from "./rules/rules-destroy.js";
import { Push, Pull } from "./rules/rules-forces.js";
import { Corrupt } from "./rules/rules-corruption.js";
import { Destabilize } from "./rules/rules-unstability.js";
import { Jump, RandomJump, Swap } from "./rules/rules-movement.js";
import { Repair } from "./rules/rules-repair.js";
import { Copy } from "./rules/rules-copy.js";
import { Merge } from "./rules/rules-merge.js";
import { TakeItem } from "./rules/rules-items.js";


const all_uncommon_action_types = { // Action types which are not by default (like Move, etc.)
    Jump,
    RandomJump,
    Swap,

    Push,
    Pull,

    Delete,
    Destroy,
    Repair,

    Corrupt,
    Destabilize,

    Copy,
    Merge,

    TakeItem,
};



