// This file describe the assets specific to this game
// and how to load them.

export {
    loaded_assets as assets,
    load_all_assets,
    sprite_defs,
    tile_id,
    tile_defs,
};

import * as asset_system from "./system/assets.js";


const game_assets = { // Description of the assets to load.
    images : { // group "images"
        asset_loader : asset_system.image_loader, // This is the function that will be used to convert the following data into usable objects.
        player: "./images/player.png",
        test_enemy: "./images/test_enemy.png",
        warrior: "./images/warrior.png",
        door : "./images/world_door.png",
        goal : "./images/world_goal.png",
        ground : "./images/world_ground.png",
        void : "./images/world_void.png",
        key : "./images/world_key.png",
        wall : "./images/world_wall.png",
        tileset_entry_exit : "./images/tileset_entry_exit.png",
        bgtemplate : "./images/bgtemplate.png",
        tiletemplate : "./images/tiletemplate.png",
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
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 1000 },
                                { frame: 1, duration: 1000 }
                              ],
                  },
        },
    },
    test_enemy: {
        image: "test_enemy",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 400 },
                                { frame: 1, duration: 400 }
                              ],
                  },
        },
    },
    ground : {
        image: "ground",
        // frames: [],
    },
    wall : {
        image: "wall",
        // frames: [],
    },
    void : {
        image: "void",
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

//////////////////////////////////////////////////////////////////////////////////////
// Tile template images are used to render the background/foreground tiles for the game.  Each image represents all the possible combinations
// of tiles for a specific view based on foreground/background and level.  This allows different tiles for different levels, but they all use the
// same template.
// The tile_defs map below defines all of the different tile combinations and the positions of each tile within the template image.  Indices are
// given in a grid index format {i,j}, representing the row/column of each tile within the image.  Multiply by the tilesize to get pixel coordinates.
const tile_defs = {
    t:      {i:7,   j:1},
    ot:     {i:7,   j:0},
    m:      {i:7,   j:2},
    om:     {i:3,   j:3},
    ttls:   {i:6,   j:1},
    ttl:    {i:5,   j:1},
    ttle:   {i:5,   j:2},
    ottls:  {i:5,   j:0},
    ottl:   {i:4,   j:0},
    ottle:  {i:4,   j:1},
    l:      {i:1,   j:7},
    ol:     {i:0,   j:7},
    ltts:   {i:5,   j:4},
    ltt:    {i:5,   j:5},
    ltte:   {i:4,   j:5},
    ltti:   {i:5,   j:3},
    oltts:  {i:4,   j:3},
    oltt:   {i:4,   j:4},
    oltte:  {i:3,   j:4},
    olttc:  {i:7,   j:3},
    ltbs:   {i:1,   j:9},
    ltb:    {i:1,   j:10},
    ltbe:   {i:2,   j:10},
    ltbi:   {i:2,   j:9},
    oltbs:  {i:0,   j:10},
    oltb:   {i:0,   j:11},
    oltbe:  {i:1,   j:11},
    b:      {i:3,   j:10},
    ob:     {i:2,   j:11},
    bi:     {i:3,   j:9},
    btls:   {i:4,   j:10},
    btlsi:  {i:4,   j:9},
    btl:    {i:5,   j:10},
    btle:   {i:5,   j:11},
    btli:   {i:5,   j:9},
    obtls:  {i:3,   j:11},
    obtl:   {i:4,   j:11},
    obtle:  {i:4,   j:12},
    obtlc:  {i:7,   j:4},
    btrs:   {i:9,   j:14},
    btr:    {i:10,  j:14},
    btre:   {i:10,  j:13},
    btri:   {i:9,   j:13},
    obtrs:  {i:10,  j:15},
    obtr:   {i:11,  j:15},
    obtre:  {i:11,  j:14},
    r:      {i:10,  j:12},
    or:     {i:15,  j:6},
    rtbs:   {i:10,  j:11},
    rtb:    {i:10,  j:10},
    rtbei:  {i:11,  j:9},
    rtbe:   {i:11,  j:10},
    rtbi:   {i:10,  j:9},
    ortbs:  {i:11,  j:12},
    ortb:   {i:11,  j:11},
    ortbe:  {i:12,  j:11},
    ortbc:  {i:8,   j:4},
    rtts:   {i:10,  j:2},
    rtt:    {i:10,  j:1},
    rtte:   {i:9,   j:1},
    ortts:  {i:11,  j:1},
    ortt:   {i:11,  j:0},
    ortte:  {i:10,  j:0},
    ttrs:   {i:11,  j:5},
    ttr:    {i:10,  j:5},
    ttre:   {i:10,  j:4},
    ttri:   {i:10,  j:3},
    ottrs:  {i:12,  j:4},
    ottr:   {i:11,  j:4},
    ottre:  {i:11,  j:3},
    ottrc:  {i:8,   j:3},
};

/**
 * return the full tile id given level, layer and tile name
 * @param {*} lvl 
 * @param {*} layer 
 * @param {*} name 
 */
function tile_id(lvl, layer, name) {
    return lvl + "_" + layer + "_" + name;
}

function update_sprite_defs(imgname, lvl, layer, tilesize) {
    for (const k of Object.keys(tile_defs)) {
        let p = tile_defs[k];
        let def = { 
            image: imgname,
            frames: [
                { 
                    x: p.i*tilesize, 
                    y: p.j*tilesize, 
                    width: tilesize, 
                    height: tilesize
                },
            ],
        };
        let id = tile_id(lvl, layer, k);
        sprite_defs[id] = def;
    }
}

update_sprite_defs("bgtemplate", "lvl1", "bg", 32);
update_sprite_defs("tiletemplate", "lvl1", "fg", 32);