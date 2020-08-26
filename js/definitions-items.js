
export {
    CryptoFile,
    CryptoKey,
    MovableWall,
    all_item_types,
    crypto_kind,
}

import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";



function all_item_types(){
    return [
        DebugItem,
        CryptoFile_Triangle,
        CryptoFile_Bars,
        CryptoFile_Cross,
        CryptoFile_Circle,
        CryptoKey,
        MovableWall,
    ];
}

const crypto_kind = {
    triangle: 0,
    bars: 1,
    cross: 2,
    circle: 3,
};

const crypto_names = {
    [crypto_kind.triangle]: "Triangle",
    [crypto_kind.bars]: "Bars",
    [crypto_kind.cross]: "Cross",
    [crypto_kind.circle]: "Circle",
};


// TODO: maybe have a separate file for cryptyfile & cryptokey
class CryptoFile extends concepts.Item {

    constructor(kind){
        console.assert(Number.isInteger(kind));
        console.assert(Object.values(crypto_kind).includes(kind));
        super(`Crypto File ${crypto_names[kind]}`);

        this.assets = {
            graphics : {
                sprite_def : sprite_defs[`crypto_file_${kind}`],
            }
        };

    }

    get can_be_taken() { return false; }

};

class CryptoFile_Triangle extends CryptoFile {
    constructor(){
        super(crypto_kind.triangle);
    }
}

class CryptoFile_Bars extends CryptoFile {
    constructor(){
        super(crypto_kind.bars);
    }
}

class CryptoFile_Cross extends CryptoFile {
    constructor(){
        super(crypto_kind.cross);
    }
}

class CryptoFile_Circle extends CryptoFile {
    constructor(){
        super(crypto_kind.circle);
    }
}


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