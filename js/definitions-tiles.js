// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable, is_safely_walkable, is_safe, is_blocking_view, info_text,
}

import { sprite_defs, tile_id, tile_defs } from "./game-assets.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    WALL: 20,
    VOID: 30,
    HOLE: 40,
};


// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable ground.",
    },
    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        description: "Wall",
    },
    [ID.HOLE] : {
        sprite_def: sprite_defs.void,
        is_walkable: false,
        is_view_blocking: false,
        description: "Hole",
    },
    [ID.VOID] : {
        sprite_def: sprite_defs.void,
        is_walkable: true,
        is_safe: false,
        is_view_blocking: false,
        description: "Void",
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Entry",
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Exit",
    },
};

/**
 * update ID/defs for tile definitions based on given level layer
 * @param {*} lvl - level to be associated w/ ID/defs (e.g.: "lvl1")
 * @param {*} layer  - layer to be associated w/ ID/defs update (e.g.: "fg"|"bg")
 */
function update_id_defs(lvl, layer) {
    for (const k of Object.keys(tile_defs)) {
        // add tile ID
        let id = tile_id(lvl, layer, k);
        ID[id] = id;
        // add def
        let def = {
            sprite_def: sprite_defs[id],
            is_walkable: false,
        }
        defs[id] = def;
    }
}
// update ID/defs for level 1 tiles
update_id_defs("lvl1", "fg");
update_id_defs("lvl1", "bg");
update_id_defs("lvl1", "laser");
update_id_defs("lvl1", "g2w");
update_id_defs("lvl1", "g2h");
update_id_defs("lvl1", "g2o");
update_id_defs("lvl1", "h2w");
update_id_defs("lvl1", "h2v");
update_id_defs("lvl1", "h2g");
update_id_defs("lvl1", "w2h");
update_id_defs("lvl1", "w2v");
update_id_defs("lvl1", "w2g");
update_id_defs("lvl1", "v2g");
update_id_defs("lvl1", "v2h");
update_id_defs("lvl1", "v2w");
update_id_defs("lvl1", "g2v");


// All the tile sprites definitions (as described by tiles definitions).
const tile_sprite_defs = {};
for(const tile_id of Object.values(ID)){
    tile_sprite_defs[tile_id] = defs[tile_id].sprite_def;
}


function is_safely_walkable(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_walkable && tile_def.is_safe;
}

function is_walkable(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_walkable;
}

function is_safe(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_safe;
}

function is_blocking_view(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_view_blocking;
}

function info_text(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.description;
}
