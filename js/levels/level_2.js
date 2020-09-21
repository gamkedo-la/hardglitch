export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.GROUND2,
    ground_alt : tiles.ID.GROUND2,
    wall : tiles.ID.WALL2,
    wall_alt : tiles.ID.WALL2,
};

function generate_world(){

    // LEVEL 2:
    // RAM: https://trello.com/c/wQCJeRfn/75-level-2-ram
    //

    return generate_empty_world("Level 2 - RAM", 20, 20, defaults);
}