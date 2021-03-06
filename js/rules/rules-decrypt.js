export {
    Rule_Decrypt,
    Decrypt,
    DecryptedFile,
}

import * as debug from "../system/debug.js";
import * as items from "../definitions-items.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../game-animations.js";
import { Character } from "../core/character.js";
import { GameView } from "../game-view.js";
import { CharacterView } from "../view/character-view.js";
import { sprite_defs } from "../game-assets.js";
import { ItemView } from "../view/item-view.js";
import { auto_newlines } from "../system/utility.js";
import { add_default_action_if_adjacent } from "./rules-common.js";
import { config } from "../game-config.js";

const decrypt_range = new visibility.Range_Cross_Axis(1,2);

class DecryptedFile extends concepts.Event {
    constructor(character, file, key_inventory_idx, crypto_kind){
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>file instanceof items.CryptoFile);
        debug.assertion(()=>Number.isInteger(key_inventory_idx));

        super({
            description: `Character ${character.id} decrypted file ${file.id}`,
            allow_parallel_animation: false,
        });
        this.character_position = character.position;
        this.character_id = character.id;
        this.file_id = file.id;
        this.file_position = file.position;
        this.key_idx = key_inventory_idx;
        this.crypto_kind = crypto_kind;
    }

    get focus_positions() { return [ this.file_position, this.character_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        // TODO: maybe add an effect on the character too?

        const character_view = game_view.focus_on_entity(this.character_id);
        debug.assertion(()=>character_view instanceof CharacterView);

        // Make sure the file is visibly open:
        const file_view = game_view.focus_on_entity(this.file_id);
        file_view.get_sprite("body").start_animation("ready_to_decrypt");
        const key_view = game_view.ui.inventory.get_item_view_at(this.key_idx);
        debug.assertion(()=>file_view instanceof ItemView);
        debug.assertion(()=>key_view instanceof ItemView);

        // 1. Decrypt animation of the key/file
        yield* anim.decrypt_file(file_view, game_view.fx_view, key_view, game_view.ui.inventory.fx_view, this.crypto_kind);

        // 2. Dissolve the key
        yield* anim.dissolve_item(key_view);
        game_view.ui.inventory.remove_item_view_at(this.key_idx);

        game_view.reset_entities(); // To make the potential new item visible. // TODO: this might be a bit overkill...

        game_view.clear_focus();
    }
};


class Decrypt extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_take; }
    static get action_type_name() { return "Decrypt"; }
    static get action_type_description() { return auto_newlines("Decrypt the target Crypto-File by consuming the Crypto-Key with the same symbol owned by this character.", 35); }
    static get range() { return decrypt_range; }
    static get costs(){
        return {
            action_points: { value: 10 },
        };
    }

    constructor(target_position){
        debug.assertion(()=>target_position instanceof concepts.Position);
        super(`decrypt_item_at_${target_position.x}_${target_position.y}`,
            "Decrypt and open this Crypto-File", target_position);
        this.is_basic = true;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);

        const file = world.item_at(this.target_position);
        debug.assertion(()=>file instanceof items.CryptoFile);

        const keys = character.inventory.stored_items
            .filter(item => item instanceof items.CryptoKey
                         && item.crypto_kind === file.crypto_kind
                );
        debug.assertion(()=>keys.length > 0);
        const key = keys[0];
        const key_idx = character.inventory.stored_items.indexOf(key);

        character.inventory.remove(key_idx);
        world.remove_entity(file.id);

        const new_item = file.decrypt();
        if(new_item){
            new_item.position = this.target_position;
            world.add_entity(new_item);
        }

        return [ new DecryptedFile(character, file, key_idx, key.crypto_kind) ];
    }
};



class Rule_Decrypt extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        if(!character.is_player_actor)
            return {};

        const crypto_keys = character.inventory.stored_items
            .filter(item => item instanceof items.CryptoKey);

        if(crypto_keys.length === 0)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, Decrypt.range)
            .filter(target=> { // Only if there is an item to decrypt.
                const item = world.item_at(target);
                return item instanceof items.CryptoFile
                    && crypto_keys.some(key => key.crypto_kind === item.crypto_kind); // We have at least one key that decrypt that file.
            })
            .forEach((target)=>{
                const action = new Decrypt(target);
                actions[action.id] = action;
                if(config.enable_decrypt_by_move){
                    add_default_action_if_adjacent(character.position, actions, action, target);
                }
            });
        return actions;
    }
}