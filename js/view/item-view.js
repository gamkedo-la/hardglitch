// This file provides the code presenting items in the game.


export {
    ItemView,
}

import * as debug from "../system/debug.js";
import { EntityView } from "./entity-view.js";
import * as concepts from "../core/concepts.js";
import { item_description } from "../definitions-texts.js";


class ItemView extends EntityView {
    constructor(item){
        debug.assertion(()=>item instanceof concepts.Item);
        super(item.id, item.position, item.assets);
        this.name = item.name;
        this.description = item_description(item);
        this.is_floating = item.is_floating;
    }
};

