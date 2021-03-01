// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable,
    is_safely_walkable,
    is_safe,
    is_blocking_view,
    info_text,
    name_text,
    floor_tiles, surface_tiles, procgen_floor_tiles, procgen_surface_tiles,
}

import * as debug from "./system/debug.js";
import { sprite_defs } from "./game-assets.js";
import { sides } from "./view/wall-model.js";
import { Color } from "./system/color.js";
import { auto_newlines } from "./system/utility.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    GROUND2: 11,
    CALCFLOORWARM : 12,
    CALCFLOORCOOL : 13,
    MEMFLOORWARM : 14,
    MEMFLOORCOOL : 15,
    CPUFLOORWARM : 16,
    CPUFLOORCOOL : 17,
    WALL: 20,
    WALL2: 21,
    VOID: 30,
    HOLE: 40,

    STREAM_LEFT: 50,
    STREAM_RIGHT: 51,
    STREAM_UP: 52,
    STREAM_DOWN: 53,

    LVL1A : 100,
    LVL1B : 101,
    LVL2A : 102,
    LVL2B : 103,
    LVL3A : 104,
    LVL3B : 105,
    LVL4A : 106,
    LVL4B : 107,

    WALL1A: 120,
    WALL1B: 121,
    WALL2A: 122,
    WALL2B: 123,
    WALL3A: 124,
    WALL3B: 125,
    WALL4A: 126,
    WALL4B: 127,

    //// PROCEDURAL GENERATION SPECIAL TILES
    PROCGEN_TILE_1: 9000,
    PROCGEN_TILE_2: 9001,
    PROCGEN_TILE_3: 9002,
    PROCGEN_TILE_4: 9003,
    PROCGEN_TILE_5: 9004,
    PROCGEN_SPAWN_1: 9100,
    PROCGEN_SPAWN_2: 9101,
    PROCGEN_SPAWN_3: 9102,
    PROCGEN_SPAWN_4: 9103,
    PROCGEN_SPAWN_5: 9104,
};

// NOTE: these are filled out by iterating through the definitions below.  if is_surface is included, the tile type is added to surface_tiles, otherwise to floor tiles
const floor_tiles = [];
const surface_tiles = [];
const procgen_floor_tiles = [];
const procgen_surface_tiles = [];

// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "GROUND",
        name: "Free Memory",
        description: "Unallocated memory, unused from any program.",
        is_ground: true,
        shape_template: "ground_template",
        tile_match_predicate: (v) => (v==ID.GROUND),
        tile_same_predicate: (v) => (v==ID.GROUND),
    },
    [ID.GROUND2] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "GROUND2",
        name: "Free Memory",
        description: "Unallocated memory, unused from any program.",
        is_ground: true,
        shape_template: "ground2_template",
        tile_match_predicate: (v) => (v==ID.GROUND2),
        tile_same_predicate: (v) => (v==ID.GROUND2),
    },
    [ID.CALCFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "CALCFLOORWARM",
        name: "Fresh Calculator Buffer",
        description: "Memory used by spreadsheet programs.",
        is_ground: true,
        shape_template: "lvl1warm_template",
        tile_match_predicate: (v) => (v==ID.CALCFLOORWARM),
        tile_same_predicate: (v) => (v==ID.CALCFLOORWARM),
    },
    [ID.CALCFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "CALCFLOORCOOL",
        name: "Stale Calculator Buffer",
        description: "Memory used by spreadsheet programs.",
        is_ground: true,
        shape_template: "lvl1cool_template",
        tile_match_predicate: (v) => (v==ID.CALCFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.CALCFLOORCOOL),
    },

    [ID.MEMFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "MEMFLOORWARM",
        name: "Active Memory",
        description: "Allocated 'hot' usage memory.",
        is_ground: true,
        shape_template: "lvl2warm_template",
        tile_match_predicate: (v) => (v==ID.MEMFLOORWARM),
        tile_same_predicate: (v) => (v==ID.MEMFLOORWARM),
    },
    [ID.MEMFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Freed Memory",
        name: "Freed Memory",
        description: auto_newlines("Deallocated freshly used memory. Some life-forms seems to like these very much. Or are they generating these?", 35),
        is_ground: true,
        shape_template: "lvl2cool_template",
        tile_match_predicate: (v) => (v==ID.MEMFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.MEMFLOORCOOL),
    },

    [ID.CPUFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "CPU Register",
        name: "CPU Register",
        description: "Memory in a CPU used for fast computing.",
        is_ground: true,
        shape_template: "lvl3warm_template",
        tile_match_predicate: (v) => (v==ID.CPUFLOORWARM),
        tile_same_predicate: (v) => (v==ID.CPUFLOORWARM),
    },
    [ID.CPUFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Cache",
        name: "Cache",
        description: "Memory close to the CPU for fast acces.",
        is_ground: true,
        shape_template: "lvl3cool_template",
        tile_match_predicate: (v) => (v==ID.CPUFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.CPUFLOORCOOL),
    },

    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "Test Wall 1",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL),
        tile_same_predicate: (v) => (v==ID.WALL),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(98,129,189,.75),
                [sides.bottom]: new Color(98,129,189,.75),
                [sides.fl]:     new Color(70,85,175,.75),
                [sides.front]:  new Color(49,60,123,.75),
                [sides.fr]:     new Color(36,45,91,.75),
                [sides.br]:     new Color(70,85,175,.25),
                [sides.back]:   new Color(49,60,123,.25),
                [sides.bl]:     new Color(36,45,91,.25),
                [sides.hlm]:    new Color(0,222,164,.25),
                [sides.hlM]:    new Color(0,222,164,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL2] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "Test Wall 2",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL2),
        tile_same_predicate: (v) => (v==ID.WALL2),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(98,129,0,.75),
                [sides.bottom]: new Color(98,129,0,.75),
                [sides.fl]:     new Color(70,85,0,.75),
                [sides.front]:  new Color(49,60,0,.75),
                [sides.fr]:     new Color(36,45,0,.75),
                [sides.br]:     new Color(70,85,0,.25),
                [sides.back]:   new Color(49,60,0,.25),
                [sides.bl]:     new Color(36,45,0,.25),
                [sides.hlm]:    new Color(0,222,164,.25),
                [sides.hlM]:    new Color(0,222,164,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },
    [ID.HOLE] : {
        sprite_def: sprite_defs.void,
        is_walkable: false,
        is_view_blocking: false,
        editor_name: "Hole",
        name: "No Memory",
        description: "Hole in the memory. Can be seen through but nothing can move there.",
        shape_template: "hole_template",
        tile_match_predicate: (v) => (v==ID.HOLE),
        tile_same_predicate: (v) => (v==ID.HOLE),
        pwall: {
            width: 8,
            height: 15,
            faceMask: sides.inner,
            edgeMask: sides.inner|sides.top|sides.vertical|sides.bottom,
            colormap: {
                [sides.top]:    new Color(90,24,90,.3),
                [sides.bottom]: new Color(90,24,90,.3),
                [sides.fl]:     new Color(156,36,222,.2),
                [sides.front]:  new Color(156,36,222,.3),
                [sides.fr]:     new Color(156,36,222,.4),
                [sides.br]:     new Color(156,36,222,.2),
                [sides.back]:   new Color(156,36,222,.3),
                [sides.bl]:     new Color(156,36,222,.4),
                [sides.hlm]:    new Color(200,50,200,.25),
                [sides.hlM]:    new Color(200,50,200,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },
    [ID.VOID] : {
        sprite_def: sprite_defs.void,
        is_walkable: true,
        is_safe: false,
        is_view_blocking: false,
        editor_name: "Void",
        name: "Void",
        description: "Highly unstable memory section. Destroys anything moving in it.",
        shape_template: "void_template",
        tile_match_predicate: (v) => (v==ID.VOID),
        tile_same_predicate: (v) => (v==ID.VOID),
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Entry",
        name: "Input BUS - ENTRY",
        description: "Data from other part of the computer comes through here.",
        is_surface: true,
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Exit BUS",
        name: "Output BUS - EXIT",
        description: "Data can leave this part of the computer through here.",
        is_surface: true,
    },

    [ID.STREAM_LEFT] : {
        sprite_def: sprite_defs.stream_left,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Stream Buffer -> West",
        name: "Stream Buffer -> West",
        description: "Memory buffer used to move data around.",
        is_surface: true,
    },

    [ID.STREAM_RIGHT] : {
        sprite_def: sprite_defs.stream_right,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Stream Buffer -> East",
        name: "Stream Buffer -> East",
        description: "Memory buffer used to move data around.",
        is_surface: true,
    },

    [ID.STREAM_UP] : {
        sprite_def: sprite_defs.stream_up,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Stream Buffer -> North",
        name: "Stream Buffer -> North",
        description: "Memory buffer used to move data around.",
        is_surface: true,
    },

    [ID.STREAM_DOWN] : {
        sprite_def: sprite_defs.stream_down,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "Stream Buffer -> South",
        name: "Stream Buffer -> South",
        description: "Memory buffer used to move data around.",
        is_surface: true,
    },

    [ID.LVL1A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL1A",
        name: "Calculation Buffer",
        description: "Memory used by spreadsheet programs.",
        is_ground: true,
        shape_template: "lvl1a_template",
        tile_match_predicate: (v) => (v==ID.LVL1A),
        tile_same_predicate: (v) => (v==ID.LVL1A),
    },
    [ID.LVL1B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL1B",
        name: "Storage Buffer",
        description: "Memory keeping some values around for future calculations.",
        is_ground: true,
        shape_template: "lvl1b_template",
        tile_match_predicate: (v) => (v==ID.LVL1B),
        tile_same_predicate: (v) => (v==ID.LVL1B),
    },

    [ID.LVL2A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL2A",
        name: "Allocated Memory",
        description: "Memory used by some programs.",
        is_ground: true,
        shape_template: "lvl2a_template",
        tile_match_predicate: (v) => (v==ID.LVL2A),
        tile_same_predicate: (v) => (v==ID.LVL2A),
    },
    [ID.LVL2B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL2B",
        name: "Unallocated Memory",
        description: "Memory not used by any program.",
        is_ground: true,
        shape_template: "lvl2b_template",
        tile_match_predicate: (v) => (v==ID.LVL2B),
        tile_same_predicate: (v) => (v==ID.LVL2B),
    },

    [ID.LVL3A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL3A",
        name: "Level 2 Cache",
        description: "Memory close to the CPU but not that close.",
        is_ground: true,
        shape_template: "lvl3a_template",
        tile_match_predicate: (v) => (v==ID.LVL3A),
        tile_same_predicate: (v) => (v==ID.LVL3A),
    },
    [ID.LVL3B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL3B",
        name: "Level 1 Cache",
        description: "Memory very close to the CPU for fast access.",
        is_ground: true,
        shape_template: "lvl3b_template",
        tile_match_predicate: (v) => (v==ID.LVL3B),
        tile_same_predicate: (v) => (v==ID.LVL3B),
    },

    [ID.LVL4A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL4A",
        name: "Network Buffer",
        description: "Memory used for acquiring data coming from over the network.",
        is_ground: true,
        shape_template: "lvl4a_template",
        tile_match_predicate: (v) => (v==ID.LVL4A),
        tile_same_predicate: (v) => (v==ID.LVL4A),
    },
    [ID.LVL4B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        editor_name: "LVL4B",
        name: "Message Buffer",
        description: "Memory used to write messages to be sent over the network.",
        is_ground: true,
        shape_template: "lvl4b_template",
        tile_match_predicate: (v) => (v==ID.LVL4B),
        tile_same_predicate: (v) => (v==ID.LVL4B),
    },

    [ID.WALL1A] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL1A",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL1A),
        tile_same_predicate: (v) => (v==ID.WALL1A),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(245,133,73,.75),
                [sides.bottom]: new Color(245,133,73,.75),
                [sides.fl]:     new Color(201,86,29,.75),
                [sides.front]:  new Color(150,66,21,.75),
                [sides.fr]:     new Color(112,48,16,.75),
                [sides.br]:     new Color(201,86,29,.25),
                [sides.back]:   new Color(150,66,21,.25),
                [sides.bl]:     new Color(112,48,16,.25),
                [sides.hlm]:    new Color(222,218,90,.25),
                [sides.hlM]:    new Color(222,218,90,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL1B] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL1B",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL1B),
        tile_same_predicate: (v) => (v==ID.WALL1B),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(101,111,224,.75),
                [sides.bottom]: new Color(101,111,224,.75),
                [sides.fl]:     new Color(74,80,168,.75),
                [sides.front]:  new Color(45,48,103,.75),
                [sides.fr]:     new Color(27,29,61,.75),
                [sides.br]:     new Color(74,80,168,.25),
                [sides.back]:   new Color(45,48,103,.25),
                [sides.bl]:     new Color(27,29,61,.25),
                [sides.hlm]:    new Color(91,230,240,.25),
                [sides.hlM]:    new Color(91,230,240,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL2A] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL2A",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL2A),
        tile_same_predicate: (v) => (v==ID.WALL2A),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(253,36,183,.75),
                [sides.bottom]: new Color(253,36,183,.75),
                [sides.fl]:     new Color(163,23,119,.75),
                [sides.front]:  new Color(104,14,75,.75),
                [sides.fr]:     new Color(69,10,50,.75),
                [sides.br]:     new Color(163,23,119,.25),
                [sides.back]:   new Color(104,14,75,.25),
                [sides.bl]:     new Color(69,10,50,.25),
                [sides.hlm]:    new Color(255,210,63,.25),
                [sides.hlM]:    new Color(255,210,63,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL2B] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL2B",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL2B),
        tile_same_predicate: (v) => (v==ID.WALL2B),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(61,153,83,.75),
                [sides.bottom]: new Color(61,153,83,.75),
                [sides.fl]:     new Color(63,143,81,.75),
                [sides.front]:  new Color(45,103,59,.75),
                [sides.fr]:     new Color(30,69,39,.75),
                [sides.br]:     new Color(63,143,81,.25),
                [sides.back]:   new Color(45,103,59,.25),
                [sides.bl]:     new Color(30,69,39,.25),
                [sides.hlm]:    new Color(255,243,77,.25),
                [sides.hlM]:    new Color(255,243,77,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL3A] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL3A",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL3A),
        tile_same_predicate: (v) => (v==ID.WALL3A),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(73,151,245,.75),
                [sides.bottom]: new Color(73,151,245,.75),
                [sides.fl]:     new Color(25,112,166,.75),
                [sides.front]:  new Color(14,64,97,.75),
                [sides.fr]:     new Color(10,43,64,.75),
                [sides.br]:     new Color(25,112,166,.25),
                [sides.back]:   new Color(14,64,97,.25),
                [sides.bl]:     new Color(10,43,64,.25),
                [sides.hlm]:    new Color(97,250,227,.25),
                [sides.hlM]:    new Color(97,250,227,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL3B] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL3B",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL3B),
        tile_same_predicate: (v) => (v==ID.WALL3B),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(0,60,218,.75),
                [sides.bottom]: new Color(0,60,218,.75),
                [sides.fl]:     new Color(100,83,252,.75),
                [sides.front]:  new Color(66,53,181,.75),
                [sides.fr]:     new Color(47,38,128,.75),
                [sides.br]:     new Color(100,83,252,.25),
                [sides.back]:   new Color(66,53,181,.25),
                [sides.bl]:     new Color(47,38,128,.25),
                [sides.hlm]:    new Color(247,20,255,.25),
                [sides.hlM]:    new Color(247,20,255,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL4A] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL4A",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL4A),
        tile_same_predicate: (v) => (v==ID.WALL4A),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(12,71,103,.75),
                [sides.bottom]: new Color(12,71,103,.75),
                [sides.fl]:     new Color(46,31,184,.75),
                [sides.front]:  new Color(20,13,79,.75),
                [sides.fr]:     new Color(10,7,41,.75),
                [sides.br]:     new Color(46,31,184,.25),
                [sides.back]:   new Color(20,13,79,.25),
                [sides.bl]:     new Color(10,7,41,.25),
                [sides.hlm]:    new Color(0,222,164,.25),
                [sides.hlM]:    new Color(0,222,164,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

    [ID.WALL4B] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        editor_name: "WALL4B",
        name: "Barrier",
        description: "Memory section preventing read or write access.",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL4B),
        tile_same_predicate: (v) => (v==ID.WALL4B),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(209,17,73,.75),
                [sides.bottom]: new Color(209,17,73,.75),
                [sides.fl]:     new Color(22,118,125,.75),
                [sides.front]:  new Color(15,82,87,.75),
                [sides.fr]:     new Color(10,53,56,.75),
                [sides.br]:     new Color(22,118,125,.25),
                [sides.back]:   new Color(15,82,87,.25),
                [sides.bl]:     new Color(10,53,56,.25),
                [sides.hlm]:    new Color(0,222,164,.25),
                [sides.hlM]:    new Color(0,222,164,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },

};

// Generate tile definitions for pro-gen:
Object.entries(ID).filter(([key, value]) => key.startsWith("PROCGEN_"))
    .forEach(([key, value]) => {
        const is_surface = key.startsWith("PROCGEN_SPAWN_");
        defs[value] = {
            sprite_def: sprite_defs[key],
            is_walkable: true,
            is_safe: true,
            is_view_blocking: false,
            editor_name: key,
            name: key,
            description: key,
            is_ground: !is_surface,
            is_surface: is_surface,
            is_procgen: true,
        };
        if (!is_surface) {
            defs[value].shape_template = `${key.toLowerCase()}`;
            defs[value].tile_match_predicate = (v) => (v==value);
            defs[value].tile_same_predicate = (v) => (v==value);
        }
    });

// Sort out the surface tiles and floor tiles for later usage.
for (const id of Object.values(ID)) {
    const def = defs[id];
    debug.assertion(()=>def instanceof Object);
    if(def.is_procgen){
        if (def.is_surface) {
            procgen_surface_tiles.push(id);
        } else {
            procgen_floor_tiles.push(id);
        }
    } else if (def.is_surface) {
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
    debug.assertion(()=>tile_def);
    return tile_def.is_walkable && tile_def.is_safe;
}

function is_walkable(tile_id){
    const tile_def = defs[tile_id];
    debug.assertion(()=>tile_def);
    return tile_def.is_walkable;
}

function is_safe(tile_id){
    const tile_def = defs[tile_id];
    debug.assertion(()=>tile_def);
    return tile_def.is_safe;
}

function is_blocking_view(tile_id){
    const tile_def = defs[tile_id];
    debug.assertion(()=>tile_def);
    return tile_def.is_view_blocking;
}

function info_text(tile_id){
    const tile_def = defs[tile_id];
    debug.assertion(()=>tile_def);
    if(tile_def.description)
        return auto_newlines(tile_def.description, 36);
    else
        return "No description for this tile.";
}

function name_text(tile_id){
    const tile_def = defs[tile_id];
    debug.assertion(()=>tile_def);
    return tile_def.name;
}
