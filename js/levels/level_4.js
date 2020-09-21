export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.GROUND2,
    ground_alt : tiles.ID.GROUND2,
    wall : tiles.ID.WALL,
    wall_alt : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 4:
    // Network Bus: https://trello.com/c/pbKyK5TJ/78-level-4-network-bus
    //

    return generate_empty_world("Level 4 - Network Bus", 40, 40, defaults);
}