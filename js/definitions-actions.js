export {
    all_uncommon_action_types,
}

import { Delete } from "./rules/rules-delete.js";
import { Destroy } from "./rules/rules-destroy.js";
import { Push, Pull } from "./rules/rules-forces.js";
import { Jump, Swap } from "./rules/rules-movement.js";
import { Repair } from "./rules/rules-repair.js";
import { Range_Cross_Diagonal } from "./core/visibility.js";

class SmallerJump extends Jump {
    constructor(target){
        super(target);
        this.range = new Range_Cross_Diagonal(1,3);
    }
};


const all_uncommon_action_types = { // Action types which are not by default (like Move, TakeItem etc.)
    Delete,
    Destroy,
    Jump,
    SmallerJump,
    Swap,
    Push,
    Pull,
    Repair,
};


