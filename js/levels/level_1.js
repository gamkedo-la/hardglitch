export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./edit_level.js";

const defaults = {
    ground : tiles.ID.GROUND,
    wall : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    return generate_empty_world("Level 1 - Buggy Program", 10, 10, defaults);
}