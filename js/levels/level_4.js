export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.LVL4A,
    ground_alt: tiles.ID.LVL4B,
    wall : tiles.ID.WALL4A,
    wall_alt : tiles.ID.WALL4B,
};

function generate_world(){

    // LEVEL 4:
    // Network Bus: https://trello.com/c/pbKyK5TJ/78-level-4-network-bus
    //

    const world = generate_empty_world("Level 4 - Network Bus", 40, 40, defaults);
    world.level_id = 4;
    return world;
}