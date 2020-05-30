// This file describe the assets specific to this game
// and how to load them.

export {
    loaded_assets as assets,
    load_all_assets,
    sprite_defs,
};

import * as asset_system from "./system/assets.js";


const game_assets = { // Description of the assets to load.
    images : { // group "images"
        asset_loader : asset_system.image_loader, // This is the function that will be used to convert the following data into usable objects.
        player: "./images/player.png",
        warrior: "./images/warrior.png",
        door : "./images/world_door.png",
        goal : "./images/world_goal.png",
        ground : "./images/world_ground.png",
        key : "./images/world_key.png",
        wall : "./images/world_wall.png",
        tileset_entry_exit : "./images/tileset_entry_exit.png",
    }
};


let loaded_assets = {}; // This object will be set with all the asset converted and usable.
                        // It will be organized eactly how game_assets is organized,
                        // but each asset path will be replaced by an object
                        // (for example an image path will be replaced by an HTML image element).
                        // See load_all_assets() below.

async function load_all_assets(){
    loaded_assets = await asset_system.load_assets(game_assets);
    console.log(`ASSETS: ${JSON.stringify(loaded_assets)}`);
    return loaded_assets;
}

//////////////////////////////////////////////////////////////////////////////////////
// Sprite descriptions here.
// Describe here all the sprites and sprite animations as defined by Sprite class.
const sprite_defs = {
    player : {
        image: "player",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                ],
        animations: [
            {
                loop: true,
                timeline: [
                            { frame: 0, duration: 1000 },
                            { frame: 1, duration: 1000 }
                          ],
            },
        ],
    },
    test_enemy: {
        image: "warrior",
        // frames: [],
    },
    ground : {
        image: "ground",
        // frames: [],
    },
    wall : {
        image: "wall",
        // frames: [],
    },
    entry : {
        image: "tileset_entry_exit",
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
    },
    exit : {
        image: "tileset_entry_exit",
        frames: [
            { x:64, y:0, width:64, height:64 }
         ]
    }
};


