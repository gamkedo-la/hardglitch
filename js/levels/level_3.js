export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.LVL3A,
    ground_alt: tiles.ID.LVL3B,
    wall : tiles.ID.WALL3A,
    wall_alt : tiles.ID.WALL3B,
};

function generate_world(){

    // LEVEL 3:
    // CPU Caches: https://trello.com/c/wgMFsGbN/76-level-3-cpu-caches
    //

    const world = generate_empty_world("Level 3 - CPU Caches", 30, 30, defaults);
    world.level_id = 3;
    return world;
}