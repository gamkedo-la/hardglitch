
export {
    CryptoFile,
    CryptoKey,
}

import * as concepts from "./core/concepts.js";
import { sprite_defs } from "./game-assets.js";


// TODO: maybe have a separate file for cryptyfile & cryptokey

class CryptoFile extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.crypto_file,
        }
    };

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



