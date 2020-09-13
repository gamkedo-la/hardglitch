export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { generate_empty_world } from "./level-tools.js";

const defaults = {
    ground : tiles.ID.GROUND,
    wall : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 3:
    // CPU Caches: https://trello.com/c/wgMFsGbN/76-level-3-cpu-caches
    //

    return generate_empty_world("Level 3 - CPU Caches", 30, 30, defaults);
}