
export {
    crypto_kind,
    CryptoFile,
    CryptoFile_Circle,
    CryptoFile_Triangle,
    CryptoFile_Plus,
    CryptoFile_Equal,
    CryptoKey,
    CryptoKey_Circle,
    CryptoKey_Triangle,
    CryptoKey_Plus,
    CryptoKey_Equal,

    Item_BadCode,
    Item_Jump,
    Item_Push,
    Item_Pull,
    Item_Swap,
    Item_Scanner,
    Item_ClosedScope,
    Item_ThreadPool,
    Item_Zip,
    Item_LifeStrength,
    Item_MemoryCleanup,
    Item_ByteClearer,
    Item_Corrupt,
    Item_Destabilize,
    Item_Copy,
    Item_Merge,
    Item_AutoRepair,
    Item_IntegrityBoost,
    Item_FrequencyBoost,
    Item_DataBender,


    MovableWall,
    MovableWall_Blue,
    MovableWall_Green,
    MovableWall_Orange,
    MovableWall_Purple,
    MovableWall_Red,

    MovableWall_Glass,
    MovableWall_Glass_Blue,
    MovableWall_Glass_Green,
    MovableWall_Glass_Orange,
    MovableWall_Glass_Purple,
    MovableWall_Glass_Red,

    all_crypto_file_types,
    all_crypto_key_types,
    all_item_types,
    all_movable_walls,

    Debug_AllActions,
}

import * as debug from "./system/debug.js";
import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";
import { auto_newlines, random_sample } from "./system/utility.js";
import { Jump, Swap } from "./rules/rules-movement.js";
import { Pull, Push, Push_Short } from "./rules/rules-forces.js";
import { Repair } from "./rules/rules-repair.js";
import { Corrupt } from "./rules/rules-corruption.js";
import { Delete } from "./rules/rules-delete.js";
import { Copy } from "./rules/rules-copy.js";
import { Merge } from "./rules/rules-merge.js";
import { Destabilize } from "./rules/rules-unstability.js";

function all_crypto_file_types() {
    return [
        CryptoFile_Triangle,
        CryptoFile_Equal,
        CryptoFile_Plus,
        CryptoFile_Circle,
    ];
}

function all_crypto_key_types() {
    return [
        CryptoKey_Triangle,
        CryptoKey_Equal,
        CryptoKey_Plus,
        CryptoKey_Circle,
    ];
}

function all_debug_item_types(){
    return [
        Debug_AllActions,
        Debug_Crucial,
        Debug_AugmentHealth,
        Debug_ReduceHealth,
        Debug_AugmentActionPoints,
        Debug_ReduceActionPoints,
        Debug_HealthRecovery,
        Debut_NegativeHealthRecovery,
        Debug_ActionPointsRecovery,
        Debug_NegativeActionPointsRecovery,
        Debug_BiggerInventory,
        Debut_SmallerInventory,
        Debug_AddActivableItem,
        Debug_RemoveActivableItem,
        Debug_AugmentViewDistance,
        Debug_ReduceViewDistance,
    ];
}

function all_movable_walls(){
    return [
        MovableWall_Blue,
        MovableWall_Green,
        MovableWall_Orange,
        MovableWall_Purple,
        MovableWall_Red,
        MovableWall_Glass_Blue,
        MovableWall_Glass_Green,
        MovableWall_Glass_Orange,
        MovableWall_Glass_Purple,
        MovableWall_Glass_Red,
    ];
}


function all_item_types(){
    return [
        ...all_debug_item_types(),

        ...all_crypto_file_types(),
        ...all_crypto_key_types(),

        Item_BadCode,
        Item_ClosedScope,
        Item_Jump,
        Item_Push,
        Item_Pull,
        Item_Swap,
        Item_Scanner,
        Item_ThreadPool,
        Item_Zip,
        Item_LifeStrength,
        Item_MemoryCleanup,
        Item_ByteClearer,
        Item_Corrupt,
        Item_Destabilize,
        Item_Copy,
        Item_Merge,
        Item_AutoRepair,
        Item_IntegrityBoost,
        Item_FrequencyBoost,
        Item_DataBender,

        ...all_movable_walls(),

    ];
}

const crypto_kind = {
    triangle: 0,
    equal: 1,
    plus: 2,
    circle: 3,
};

const crypto_names = {
    [crypto_kind.triangle]: "Triangle",
    [crypto_kind.equal]: "Equal",
    [crypto_kind.plus]: "Plus",
    [crypto_kind.circle]: "Circle",
};


class CryptoFile extends concepts.Item {

    description = auto_newlines(`Crypted memory section preventing access to this memory section. Can be decrypted using a Crypto-Key with the same symbol. May contain some secret data item.`, 35);

    constructor(kind){
        debug.assertion(()=>Number.isInteger(kind));
        debug.assertion(()=>Object.values(crypto_kind).includes(kind));
        super(`Crypto File "${crypto_names[kind]}"`);
        this.crypto_kind = kind;
        this.assets = {
            graphics : { body: {
                sprite_def : sprite_defs[`crypto_file_${kind}`],
            }}
        };

    }

    get can_be_taken() { return false; }
    get can_be_moved() { return false; }

    // Decrypting can return (or not) an object
    decrypt(){
        if(this.drops){
            debug.assertion(()=>this.drops instanceof Array && this.drops.every(entity=>entity instanceof concepts.Entity));
            return random_sample(this.drops);
        }
    }

};

class CryptoFile_Triangle extends CryptoFile {
    constructor(){
        super(crypto_kind.triangle);
    }
}

class CryptoFile_Equal extends CryptoFile {
    constructor(){
        super(crypto_kind.equal);
    }
}

class CryptoFile_Plus extends CryptoFile {
    constructor(){
        super(crypto_kind.plus);
    }
}

class CryptoFile_Circle extends CryptoFile {
    constructor(){
        super(crypto_kind.circle);
    }
}


class CryptoKey extends concepts.Item {

    description = auto_newlines(`Decryption key used to decrypt a Crypto-File with the same symbol.`, 35);

    get can_be_taken() { return true; }
    get can_be_moved() { return true; }

    constructor(kind){
        debug.assertion(()=>Number.isInteger(kind));
        debug.assertion(()=>Object.values(crypto_kind).includes(kind));
        super(`Crypto Key "${crypto_names[kind]}"`);
        this.crypto_kind = kind;
        this.assets = {
            graphics : {
                body: { sprite_def : sprite_defs.item_generic_7 },
                top: { sprite_def : sprite_defs[`crypto_key_${kind}`] },
            }
        };
    }

};

class CryptoKey_Triangle extends CryptoKey{
    constructor() { super(crypto_kind.triangle); }
};

class CryptoKey_Equal extends CryptoKey{
    constructor() { super(crypto_kind.equal); }
};

class CryptoKey_Plus extends CryptoKey{
    constructor() { super(crypto_kind.plus); }
};

class CryptoKey_Circle extends CryptoKey{
    constructor() { super(crypto_kind.circle); }
};


class MovableWall extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall,
        }}
    };

    description = auto_newlines(`Data access protection mechanism that can be moved in memory.`, 35);

    static get editor_name(){ return "Movable Wall"; };

    get can_be_taken() { return false; }

    constructor(){
        super("Mutex");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Blue extends MovableWall {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_blue,
        }}
    };

    static get editor_name(){ return "Blue Movable Wall"; };

    get can_be_taken() { return false; }

};

class MovableWall_Green extends MovableWall {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_green,
        }}
    };

    static get editor_name(){ return "Green Movable Wall"; };

};

class MovableWall_Orange extends MovableWall {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_orange,
        }}
    };

    static get editor_name(){ return "Orange Movable Wall"; };
};

class MovableWall_Purple extends MovableWall {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_purple,
        }}
    };

    static get editor_name(){ return "Purple Movable Wall"; };
};

class MovableWall_Red extends MovableWall {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_red,
        }}
    };

    static get editor_name(){ return "Red Movable Wall"; };
};


class MovableWall_Glass extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall,
        }}
    };

    description = auto_newlines(`Data access protection mechanism that can be moved in memory.`, 35);

    static get editor_name(){ return "Movable Wall"; };

    get can_be_taken() { return false; }

    constructor(){
        super("Atomic Block");
        this.is_blocking_vision = false;
        this.is_floating = true;
    }

};

class MovableWall_Glass_Blue extends MovableWall_Glass {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall_blue,
        }}
    };

    static get editor_name(){ return "Blue Movable Glass Wall"; };

    get can_be_taken() { return false; }

};

class MovableWall_Glass_Green extends MovableWall_Glass {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall_green,
        }}
    };

    static get editor_name(){ return "Green Movable Glass Wall"; };

};

class MovableWall_Glass_Orange extends MovableWall_Glass {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall_orange,
        }}
    };

    static get editor_name(){ return "Orange Movable Glass Wall"; };
};

class MovableWall_Glass_Purple extends MovableWall_Glass {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall_purple,
        }}
    };

    static get editor_name(){ return "Purple Movable Glass Wall"; };
};

class MovableWall_Glass_Red extends MovableWall_Glass {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_glass_wall_red,
        }}
    };

    static get editor_name(){ return "Red Movable Glass Wall"; };
};


class Item_BadCode extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

    description = auto_newlines(`Scrambled data. Probably dangerous to use.`, 35);

    get can_be_taken() { return true; }

    stats_modifiers = {
        int_recovery: { value: -1 },
    }

    constructor(){
        super("0xDEADBEEF");
    }
};

class Item_Jump extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_3_1,
        }}
    };

    description = auto_newlines("Rare secret CPU instruction, considered taboo by most programmers. Useful if you have an escape plan and are in a hurry.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("GOTO");
    }

    get_enabled_action_types(){
        return [ Jump ];
    }

}

class Item_Push extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_2,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Producer side of a concurrent data queue mechanism.", 35);

    constructor(){
        super("Data Pusher");
    }

    get_enabled_action_types(){
        return [ Push ];
    }

}

class Item_Pull extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_1,
        }}
    };

    description = auto_newlines("Consumer side of a concurrent data queue mechanism.", 35);

    get can_be_taken() { return true; }

    constructor(){
        super("Data Puller");
    }

    get_enabled_action_types(){
        return [ Pull ];
    }

}

class Item_Swap extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_3,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Programming knowledge hold secretly by experienced programmers in sacred books.", 35);

    constructor(){
        super("Hexchanger");
    }

    get_enabled_action_types(){
        return [ Swap ];
    }

}


class Item_DataBender extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_5,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Provides data manipulation and transfer powers beyond imagination.", 35);

    constructor(){
        super("Data Bender");
    }

    get_enabled_action_types(){
        return [ Push, Pull, Swap, Jump ];
    }

}

class Item_Scanner extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Scanner algorithm allowing one to read more memory arosund at the same time.", 35);

    stats_modifiers = {
        view_distance: { value: +4 },
    }

    constructor(){
        super("Scanner");
    }

};

class Item_ClosedScope extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Reduces the scope of the readable data available.", 35);

    stats_modifiers = {
        view_distance: { value: -3 },
    }

    constructor(){
        super("Closed Scope");
    }

}


class Item_ThreadPool extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_5,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Enables concurrent execution of tasks. Do not share your data between threads, or at least protect accessing them!", 35);

    stats_modifiers = {
        activable_items: { value: +4 },
    }

    constructor(){
        super("Thread Pool");
    }

}

class Item_Zip extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_3,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Compression algorithm allowing to store more data in the same space.", 35);

    stats_modifiers = {
        inventory_size: { value: +4 },
    }

    constructor(){
        super("Zip");
    }

}


class Item_LifeStrength extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

    description = auto_newlines("Instinct of the newborn who needs to push things around. Allow to push close entities.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Life Strengh");
    }

    get_enabled_action_types(){
        return [ Push_Short ];
    }

}


class Item_MemoryCleanup extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

    description = auto_newlines("Cleans up memory and restore it to it's initial state.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Memory Cleanup");
    }

    get_enabled_action_types(){
        return [ Repair ];
    }

}

class Item_ByteClearer extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Simple data deletion tool, used by Anti-Virus to clear \"anomalies\" from the system.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Byte Clearer");
    }

    get_enabled_action_types(){
        return [ Delete ];
    }

}

class Item_Corrupt extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Trashes memory to corrupt it.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Memory Trasher");
    }

    get_enabled_action_types(){
        return [ Corrupt ];
    }

}

class Item_Destabilize extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Allows to make a memory section unstable.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Chaos Well");
    }

    get_enabled_action_types(){
        return [ Destabilize ];
    }

}

class Item_Copy extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    count = 3; // How many times we can use this item's action.

    get description(){ return auto_newlines(`Allows duplicating entities in memory. Usage left: ${this.count}`, 35); }
    get can_be_taken() { return true; }

    constructor(){
        super("Cloner");
    }

    get_enabled_action_types(){
        if(this.count > 0)
            return [ Copy ];
        else
            return [];
    }

    on_action_used(){
        --this.count;
    }

}


class Item_Merge extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Allows merging an entity into another one.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Memory Mixer");
    }

    get_enabled_action_types(){
        return [ Merge ];
    }

}

class Item_AutoRepair extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };
    description = auto_newlines("Repairs a bit it's owner's memory at each new cycle.", 35);
    get can_be_taken() { return true; }

    stats_modifiers = {
        int_recovery: { value: +2 },
    }

    constructor(){
        super("Auto-Repair");
    }
};

class Item_IntegrityBoost extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_5,
        }}
    };

    description = auto_newlines("Boosts the memory integrity of it's owner.", 35);
    get can_be_taken() { return true; }

    stats_modifiers = {
        integrity: { max: +10 },
    }

    constructor(){
        super("Integrity Booster");
    }
};

class Item_FrequencyBoost extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }
    description = auto_newlines("Boosts frequency of the owner's code, making them faster.", 35);

    stats_modifiers = {
        action_points: { max: +10 },
        ap_recovery: { value: +10 },
    }

    constructor(){
        super("Frequency Booster");
    }
};



///////////////////////////////////////////////////////////////////////////
// DEBUG ITEMS
/////////////////

class Debug_AllActions extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Debug: Enable All Actions");
    }

    get_enabled_action_types(){
        return [ ...Object.values(all_uncommon_action_types) ];
    }

}


class Debug_Crucial extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_7,
        }}
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Debug: Crucial");
    }

    is_crucial = true;

}

class Debug_HealthRecovery extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        int_recovery: { value: +2 },
    }

    constructor(){
        super("Debug: Health Recovery +2");
    }
};

class Debut_NegativeHealthRecovery extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        int_recovery: { value: -2 },
    }

    constructor(){
        super("Debug: Health Recovery -2");
    }
};


class Debug_ActionPointsRecovery extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        ap_recovery: { value: +10 },
    }

    constructor(){
        super("Debug: Action Points Recovery +10");
    }
};

class Debug_NegativeActionPointsRecovery extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        ap_recovery: { value: -5 },
    }

    constructor(){
        super("Debug: Action Points Recovery -5");
    }
};


class Debug_AugmentHealth extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        integrity: { max: +10 },
    }

    constructor(){
        super("Debug: Health Max +10");
    }
};

class Debug_ReduceHealth extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        integrity: { max: -5 },
    }

    constructor(){
        super("Debug: Health Max -5");
    }
};


class Debug_AugmentActionPoints extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        action_points: { max: +10 },
    }

    constructor(){
        super("Debug: Action Points +10");
    }
};

class Debug_ReduceActionPoints extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        action_points: { max: -5 },
    }

    constructor(){
        super("Debug: Action Points -5");
    }
};



class Debug_BiggerInventory extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        inventory_size: { value: +4 },
    }

    constructor(){
        super("Debug: +4 Inventory Size");
    }
};

class Debut_SmallerInventory extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        inventory_size: { value: -1 },
    }

    constructor(){
        super("Debug: -1 Inventory Size");
    }
};


class Debug_AddActivableItem extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        activable_items: { value: +3 },
    }

    constructor(){
        super("Debug: +3 Activable Items");
    }
};

class Debug_RemoveActivableItem extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        activable_items: { value: -1 },
    }

    constructor(){
        super("Debug: -1 Activable Items");
    }
};


class Debug_AugmentViewDistance extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        view_distance: { value: +4 },
    }

    constructor(){
        super("Debug: +4 View Distance");
    }
};

class Debug_ReduceViewDistance extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        view_distance: { value: -3 },
    }

    constructor(){
        super("Debug: -3 View Distance");
    }
};

