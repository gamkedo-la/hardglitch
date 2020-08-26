
export {
    CryptoFile,
    CryptoKey,
    MovableWall,
    all_item_types,
}

import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";



function all_item_types(){
    return [
        DebugItem,
        CryptoFile,
        CryptoKey,
        MovableWall,
    ];
}



// TODO: maybe have a separate file for cryptyfile & cryptokey
class CryptoFile extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.crypto_file,
        }
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Crypto File");
        this.is_blocking_vision = true;
    }

};

class CryptoKey extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.crypto_key,
        }
    };

    get can_be_taken() { return true; }


    constructor(){
        super("Crypto Key");
    }

};



class MovableWall extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.movable_wall,
        }
    };

    get can_be_taken() { return false; }

    constructor(){
        super("Movable Wall");
        this.is_blocking_vision = true;
    }

};

class DebugItem extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.item_generic_1,
        }
    };

    get can_be_taken() { return true; }

    constructor(){
        super("Debug: Enable All Actions");
    }

    get_enabled_action_types(action_type){
        return [ action_type,
            ...Object.values(all_uncommon_action_types)
                    .filter(type => type.prototype instanceof action_type), // All action types inheriting from that action type.
        ];
    }

}