export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./edit_level.js";

const defaults = {
    ground : tiles.ID.GROUND2,
    wall : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 2:
    // RAM: https://trello.com/c/wQCJeRfn/75-level-2-ram
    //

    return generate_empty_world(20, 20, defaults);
}