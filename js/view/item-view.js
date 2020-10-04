// This file provides the code presenting items in the game.


export {
    ItemView,
}

import { EntityView } from "./entity-view.js";
import * as concepts from "../core/concepts.js";
import { item_description } from "../definitions-texts.js";


class ItemView extends EntityView {
    constructor(item){
        console.assert(item instanceof concepts.Item);
        super(item.id, item.position, item.assets);
        this.name = item.name;
        this.description = item_description(item);
    }
};

