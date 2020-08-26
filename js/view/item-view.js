// This file provides the code presenting items in the game.


export {
    ItemView,
}

import { EntityView } from "./entity-view.js";
import * as concepts from "../core/concepts.js";


class ItemView extends EntityView {
    constructor(item){
        console.assert(item instanceof concepts.Item);
        super(item.position, item.assets);
        this.name = item.name;
    }
};

