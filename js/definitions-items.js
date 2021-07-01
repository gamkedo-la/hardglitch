
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
    Item_Crawl,
    Item_Jump,
    Item_FreeJump,
    Item_Push,
    Item_Pull,
    Item_Shift,
    Item_ForceWave,
    Item_PushCardinal,
    Item_Swap,
    Item_Scanner,
    Item_ClosedScope,
    Item_ThreadPool,
    Item_Zip,
    Item_ComputerCluster,
    Item_LifeStrength,
    Item_MemoryCleanup,
    Item_ByteClearer,
    Item_Freeze,
    Item_Corrupt,
    Item_Destabilize,
    Item_Copy,
    Item_Merge,
    Item_AutoRepair,
    Item_IntegrityBoost,
    Item_FrequencyBoost,
    Item_DataBender,
    Item_PowerGlove,
    Item_BlockMaster,
    Item_CriticalSection,
    Item_Destructor,

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
    all_opaque_movable_walls,
    all_transparent_movable_walls,
    all_movable_walls,

    Debug_AllActions,
}

import * as debug from "./system/debug.js";
import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";
import { auto_newlines, random_sample } from "./system/utility.js";
import { Crawl, FreeJump, Jump, Swap } from "./rules/rules-movement.js";
import { Pull, Push, Push_Short, Shift_East, Shift_West, Shift_South, Shift_North, PushWave, PullWave, Push_East, Push_North, Push_West, Push_South } from "./rules/rules-forces.js";
import { Repair } from "./rules/rules-repair.js";
import { Corrupt } from "./rules/rules-corruption.js";
import { Delete } from "./rules/rules-delete.js";
import { Copy } from "./rules/rules-copy.js";
import { Merge } from "./rules/rules-merge.js";
import { Destabilize } from "./rules/rules-unstability.js";
import { Character } from "./core/character.js";
import { CreateMovableWall_Opaque, CreateMovableWall_Transparent, DestroyMovableWall } from "./rules/rules-items.js";
import { Invoke_AntiVirus, Invoke_Virus } from "./rules/rules-invocation.js";
import { Destroy } from "./rules/rules-destroy.js";
import { Freeze } from "./rules/rules-freeze.js";

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

function all_opaque_movable_walls(){
    return [
        MovableWall_Blue,
        MovableWall_Green,
        MovableWall_Orange,
        MovableWall_Purple,
        MovableWall_Red,
    ];
}

function all_transparent_movable_walls(){
    return [
        MovableWall_Glass_Blue,
        MovableWall_Glass_Green,
        MovableWall_Glass_Orange,
        MovableWall_Glass_Purple,
        MovableWall_Glass_Red,
    ]
}

function all_movable_walls(){
    return [ ...all_opaque_movable_walls(), ...all_transparent_movable_walls() ];
}


function all_item_types(){
    return [
        ...all_debug_item_types(),

        ...all_crypto_file_types(),
        ...all_crypto_key_types(),

        Item_BadCode,
        Item_ClosedScope,
        Item_Crawl,
        Item_Jump,
        Item_FreeJump,
        Item_Push,
        Item_Pull,
        Item_Shift,
        Item_ForceWave,
        Item_PushCardinal,
        Item_Swap,
        Item_Scanner,
        Item_ThreadPool,
        Item_Zip,
        Item_ComputerCluster,
        Item_LifeStrength,
        Item_MemoryCleanup,
        Item_ByteClearer,
        Item_Freeze,
        Item_Corrupt,
        Item_Destabilize,
        Item_Copy,
        Item_Merge,
        Item_AutoRepair,
        Item_IntegrityBoost,
        Item_FrequencyBoost,
        Item_DataBender,
        Item_PowerGlove,
        Item_BlockMaster,
        Item_CriticalSection,
        Item_InvokeAntiVirus,
        Item_InvokeVirus,
        Item_Destructor,

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
            const to_drop = random_sample(this.drops);
            if(this.drops_are_crucial){
                to_drop.is_crucial = true;
            }
            return to_drop;
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

    description = auto_newlines(`Data access protection mechanism that can be moved in memory.\nDo not allow seeing what is beyond it.`, 35);

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

    description = auto_newlines(`Data access protection mechanism that can be moved in memory.\nAllows seeing what is beyond it.`, 35);

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

class Item_Crawl extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_3_1,
        }}
    };

    description = auto_newlines("Secret file containing secrets programs of the computer's owner. Allows one to crawl through data in new ways.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("X-File");
    }

    get_enabled_action_types(){
        return [ Crawl ];
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


class Item_Shift extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_2,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Optimized algorithm to shift bits in memory efficiently. Shifts everything visible in one direction.", 35);

    constructor(){
        super("Bit Shifter");
    }

    get_enabled_action_types(){
        return [ Shift_East, Shift_West, Shift_South, Shift_North ];
    }

}

class Item_ForceWave extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_2,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Simple but powerful algorithm allowing to push or pull entities around in a range.", 35);

    constructor(){
        super("Force-Each Loop");
    }

    get_enabled_action_types(){
        return [ PushWave, PullWave ];
    }

}


class Item_PushCardinal extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_2,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Arcane algorithm used by secret hardware manufacturer socities which allow precise move of targetted data.", 35);

    constructor(){
        super("Barrel-Shift");
    }

    get_enabled_action_types(){
        return [ Push_North, Push_South, Push_East, Push_West ];
    }

}

class Item_Swap extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4_3,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Programming knowledge held secretly by experienced programmers in sacred books.", 35);

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
            sprite_def : sprite_defs.item_threadpool,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Enables concurrent execution of tasks. Do not share your data between threads, or at least protect accessing them!\nMakes more item slots Active but do not increase the number of item slots.", 35);

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
            sprite_def : sprite_defs.item_zip,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Compression algorithm allowing to store more data in the same space.\nIncreases the number of item slots, but not the number of Active slots.", 33);

    stats_modifiers = {
        inventory_size: { value: +4 },
    }

    constructor(){
        super("Zip");
    }

}


class Item_ComputerCluster extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_computercluster,
        }}
    };

    get can_be_taken() { return true; }

    description = auto_newlines("Access to a remote cluster of computers, ready to help with improving speed of execution and size of storage.\nIncreases the number of item slots and make them Active.", 33);

    stats_modifiers = {
        inventory_size: { value: +4 },
        activable_items: { value: +4 },
    }

    constructor(){
        super("Computer Cluster");
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
            sprite_def : sprite_defs.item_generic_7,
        }}
    };

    description = auto_newlines("Cleans up memory and restore it to its initial state.", 35);
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

class Item_Freeze extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Hidden system functionality to reduce the execution priority of some programs. Very useful for preventing a dangerous program to act.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Priority Stab");
    }

    get_enabled_action_types(){
        return [ Freeze ];
    }

}

class Item_Corrupt extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_corrupt,
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
            sprite_def : sprite_defs.item_copy,
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

class Item_InvokeVirus extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Allows one to invoke a Virus. Be cautious what you wish for.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Digital Pentagram");
    }

    get_enabled_action_types(){
        return [ Invoke_Virus ];
    }

}


class Item_InvokeAntiVirus extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Allows one to invoke an Anti-Virus. Be cautious what you wish for.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Deus Ex Machina");
    }

    get_enabled_action_types(){
        return [ Invoke_AntiVirus ];
    }

}

class Item_AutoRepair extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_7,
        }}
    };
    description = auto_newlines("Repairs a bit its owner's memory at each new cycle.", 35);
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

    description = auto_newlines("Boosts the memory integrity of its owner.", 35);
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

class Item_PowerGlove extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    get can_be_taken() { return true; }
    description = auto_newlines("Allows one to take and drop any character. Putting a character in an Active Slot will enable that character's powers!", 35);

    constructor(){
        super("Power Glove");
    }

    on_activated(){
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Item_PowerGlove).length > 0){
            this.owner.can_take_entities = true; // TODO FIXME : this should have been a special action TakeEntity (+TakeItem) so that we don't have weird state to handle.
        }
    }

    on_deactivated(){
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Item_PowerGlove).length < 1){
            this.owner.can_take_entities = false; // TODO FIXME : this should have been a special action TakeEntity (+TakeItem) so that we don't have weird state to handle.
        }
    }
};

class Item_BlockMaster extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    get can_be_taken() { return true; }
    description = auto_newlines("Allows one to take and drop any Mutex or Atomic.", 35);

    constructor(){
        super("Block Master");
    }

    on_activated(){
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Item_BlockMaster).length > 0){
            this.owner.can_take_movable_walls = true; // TODO FIXME : this should have been a special action TakeMovableWall (+TakeItem) so that we don't have weird state to handle.
        }
    }

    on_deactivated(){
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Item_BlockMaster).length < 1){
            this.owner.can_take_movable_walls = false; // TODO FIXME : this should have been a special action TakeMovableWall (+TakeItem) so that we don't have weird state to handle.
        }
    }
};


class Item_FreeJump extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_3_1,
        }}
    };


    description = auto_newlines("Forbidden black-art CPU instruction, considered evil by most programmers. Useful if you have an escape plan and need precise relocation.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("ASM JMP");
    }

    get_enabled_action_types(){
        return [ FreeJump ];
    }

};

class Item_CriticalSection extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    get can_be_taken() { return true; }
    description = auto_newlines("Allows one to create and destroy Mutex or Atomic blocks. Useful to manipulate enemies field of view or move set!", 35);

    constructor(){
        super("Critical Section");
    }


    get_enabled_action_types(){
        return [ CreateMovableWall_Opaque, CreateMovableWall_Transparent, DestroyMovableWall ];
    }

};


class Item_Destructor extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_2,
        }}
    };

    count = 1; // How many times we can use this item's action.

    get description(){ return auto_newlines(`Secret system command allowing to instantly destroy any entity. Usage left: ${this.count}`, 35); }
    get can_be_taken() { return true; }

    constructor(){
        super("kill -9");
    }

    get_enabled_action_types(){
        if(this.count > 0)
            return [ Destroy ];
        else
            return [];
    }

    on_action_used(){
        --this.count;
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


    on_activated(){
        // TODO FIXME : this should have been a special action TakeEntity + TakeMovableWall + TakeItem so that we don't have weird state to handle.
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Debug_AllActions).length > 0){
            this.owner.can_take_entities = true;
            this.owner.can_take_movable_walls = true;
        }
    }

    on_deactivated(){
        // TODO FIXME : this should have been a special action TakeEntity + TakeMovableWall + TakeItem so that we don't have weird state to handle.
        debug.assertion(()=>this.owner instanceof Character);
        debug.assertion(()=>this.world instanceof concepts.World);
        if(this.owner.inventory.active_items.filter(item=>item instanceof Debug_AllActions).length < 1){
            this.owner.can_take_entities = false;
            this.owner.can_take_movable_walls = false;
        }
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

