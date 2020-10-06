
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
    Item_JumpOpCode,
    Item_Push,
    Item_Pull,
    Item_Swap,
    MovableWall,
    MovableWall_Blue,
    MovableWall_Green,
    MovableWall_Orange,
    MovableWall_Purple,
    MovableWall_Red,

    all_crypto_file_types,
    all_crypto_key_types,
    all_item_types,
}

import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";
import { random_sample } from "./system/utility.js";
import { Jump, Swap } from "./rules/rules-movement.js";
import { Pull, Push } from "./rules/rules-forces.js";

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


function all_item_types(){
    return [
        ...all_crypto_file_types(),
        ...all_crypto_key_types(),

        Item_BadCode,
        Item_JumpOpCode,
        Item_Push,
        Item_Pull,
        Item_Swap,
        MovableWall,
        MovableWall_Blue,
        MovableWall_Green,
        MovableWall_Orange,
        MovableWall_Purple,
        MovableWall_Red,

        ...all_debug_item_types(),
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


// TODO: maybe have a separate file for cryptyfile & cryptokey
class CryptoFile extends concepts.Item {

    constructor(kind){
        console.assert(Number.isInteger(kind));
        console.assert(Object.values(crypto_kind).includes(kind));
        super(`Crypto File ${crypto_names[kind]}`);
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
            console.assert(this.drops instanceof Array && this.drops.every(entity=>entity instanceof concepts.Entity));
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

    get can_be_taken() { return true; }

    constructor(kind){
        console.assert(Number.isInteger(kind));
        console.assert(Object.values(crypto_kind).includes(kind));
        super(`Crypto Key ${crypto_names[kind]}`);
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

    get can_be_taken() { return false; }

    constructor(){
        super("Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Blue extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_blue,
        }}
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Blue Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Green extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_green,
        }}
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Green Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Orange extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_orange,
        }}
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Orange Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Purple extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_purple,
        }}
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Purple Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};

class MovableWall_Red extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.movable_wall_red,
        }}
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Red Movable Wall");
        this.is_blocking_vision = true;
        this.is_floating = true;
    }

};


class Item_BadCode extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

    get can_be_taken() { return true; }

    stats_modifiers = {
        int_recovery: { value: -1 },
    }

    constructor(){
        super("0xDEADBEEF");
    }
};

class Item_JumpOpCode extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_3,
        }}
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Jump Op-Code");
    }

    get_enabled_action_types(){
        return [ Jump ];
    }

}

class Item_Push extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

    get can_be_taken() { return true; }

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
            sprite_def : sprite_defs.item_generic_4,
        }}
    };

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
            sprite_def : sprite_defs.item_generic_1,
        }}
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Hexchanger");
    }

    get_enabled_action_types(){
        return [ Swap ];
    }

}

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

