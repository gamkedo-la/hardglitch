
export {
    CryptoFile,
    CryptoKey,
    MovableWall,
    all_crypto_file_types,
    all_crypto_key_types,
    all_item_types,
    crypto_kind,
}

import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";
import { all_uncommon_action_types } from "./definitions-actions.js";

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


function all_item_types(){
    return [
        DebugItem,

        ...all_crypto_file_types(),
        ...all_crypto_key_types(),

        MovableWall,
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
            graphics : {
                sprite_def : sprite_defs[`crypto_file_${kind}`],
            }
        };

    }

    get can_be_taken() { return false; }

    // Decrypting can return (or not) an object
    decrypt(){
        return new DebugItem();
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
                sprite_def : sprite_defs[`crypto_key_${kind}`],
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