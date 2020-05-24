// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export { ID, defs }

import { sprite_def } from "./game-assets.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    WALL: 20,
};


// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_def.ground,
        is_walkable: true,
        // TODO: add other information here
    },
    [ID.WALL] : {
        sprite_def: sprite_def.wall,
        is_walkable: false,
    },
};


