export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.CALCFLOORWARM,
    ground_alt: tiles.ID.CALCFLOORWARM,
    wall : tiles.ID.WALL,
    wall_alt : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    return generate_empty_world("Level 1 - Buggy Program", 10, 10, defaults);
}