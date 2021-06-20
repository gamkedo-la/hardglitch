export {
    all_uncommon_action_types,
}

import { Delete } from "./rules/rules-delete.js";
import { Destroy } from "./rules/rules-destroy.js";
import { Push, Pull, PushWave, PullWave, Shift_East, Shift_North, Shift_South, Shift_West } from "./rules/rules-forces.js";
import { Corrupt } from "./rules/rules-corruption.js";
import { Destabilize } from "./rules/rules-unstability.js";
import { Jump, RandomJump, Swap, Crawl } from "./rules/rules-movement.js";
import { Repair } from "./rules/rules-repair.js";
import { Copy } from "./rules/rules-copy.js";
import { Merge } from "./rules/rules-merge.js";
import { TakeItem, DestroyMovableWall, CreateMovableWall_Transparent, CreateMovableWall_Opaque } from "./rules/rules-items.js";
import { Invoke_AntiVirus, Invoke_Virus } from "./rules/rules-invocation.js";


const all_uncommon_action_types = { // Action types which are not by default (like Move, etc.)
    Crawl,
    Jump,
    RandomJump,
    Swap,

    Push,
    Pull,
    PushWave,
    PullWave,
    Shift_North,
    Shift_South,
    Shift_East,
    Shift_West,

    Delete,
    Destroy,
    Repair,

    Corrupt,
    Destabilize,

    Copy,
    Merge,

    TakeItem,

    DestroyMovableWall,
    CreateMovableWall_Transparent,
    CreateMovableWall_Opaque,

    Invoke_AntiVirus,
    Invoke_Virus,

};



