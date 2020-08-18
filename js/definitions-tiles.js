// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable, is_safely_walkable, is_safe, is_blocking_view, info_text,
    floor_tiles, surface_tiles
}

import { sprite_defs } from "./game-assets.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    GROUND2: 11,
    WALL: 20,
    VOID: 30,
    HOLE: 40,
};

// NOTE: these are filled out by iterating through the definitions below.  if is_surface is included, the tile type is added to surface_tiles, otherwise to floor tiles
const floor_tiles = [];
const surface_tiles = [];

// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable ground.",
        is_ground: true,
        tile_layer: "ground",
        shape_template: "ground_template",
        tile_match_predicate: (v) => (v===ID.GROUND), 
        tile_same_predicate: (v) => (defs[v].is_ground), 
    },
    [ID.GROUND2] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable ground 2.",
        is_ground: true,
        tile_layer: "ground2",
        shape_template: "ground2_template",
        tile_match_predicate: (v) => (v===ID.GROUND2), 
        tile_same_predicate: (v) => (defs[v].is_ground), 
    },
    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        description: "Wall",
        is_wall: true,
        tile_layer: "wall",
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v===ID.WALL), 
        tile_same_predicate: (v) => (defs[v].is_wall), 
    },
    [ID.HOLE] : {
        sprite_def: sprite_defs.void,
        is_walkable: false,
        is_view_blocking: false,
        description: "Hole",
        tile_layer: "hole",
        shape_template: "hole_template",
        tile_match_predicate: (v) => (v===ID.HOLE), 
        tile_same_predicate: (v) => (v===ID.HOLE), 
    },
    [ID.VOID] : {
        sprite_def: sprite_defs.void,
        is_walkable: true,
        is_safe: false,
        is_view_blocking: false,
        description: "Void",
        tile_layer: "void",
        shape_template: "void_template",
        tile_match_predicate: (v) => (v===ID.VOID), 
        tile_same_predicate: (v) => (v===ID.VOID), 
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Entry",
        is_surface: true,
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Exit",
        is_surface: true,
    },
};

for (const [id, def] of Object.entries(defs)) {
    if (def.is_surface) {
        surface_tiles.push(id);
    } else {
        floor_tiles.push(id);
    }
}

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
