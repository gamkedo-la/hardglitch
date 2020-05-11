// This file describe the assets specific to this game
// and how to load them.

export { loaded_assets as assets, load_all_assets };

import * as asset_system from "./system/assets.js";


const game_assets = { // Description of the assets to load.
    images : { // group "images"
        asset_loader : asset_system.image_loader, // This is the function that will be used to convert the following data into usable objects.
        warrior: "./images/warrior.png",
        door : "./images/world_door.png",
        goal : "./images/world_goal.png",
        ground : "./images/world_ground.png",
        key : "./images/world_key.png",
        wall : "./images/world_wall.png"
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
}
