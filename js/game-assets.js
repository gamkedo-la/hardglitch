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
        player: "./images/virus.png",
        test_enemy: "./images/test_enemy.png",
        warrior: "./images/warrior.png",
        door : "./images/world_door.png",
        goal : "./images/world_goal.png",
        ground : "./images/world_ground.png",
        void : "./images/world_void.png",
        key : "./images/world_key.png",
        wall : "./images/world_wall.png",
        tileset_entry_exit : "./images/portalinout.png",
        bgtemplate : "./images/bgtemplate.png",
        tiletemplate : "./images/tiletemplate.png",
        g2w_template : "./images/groundToWall.png",
        g2h_template : "./images/groundToHole.png",
        g2o_template : "./images/groundToOther.png",
        h2w_template : "./images/holeToWall.png",
        h2v_template : "./images/holeToVoid.png",
        h2g_template : "./images/holeToGround.png",
        w2h_template : "./images/wallToHole.png",
        w2v_template : "./images/wallToVoid.png",
        w2g_template : "./images/wallToGround.png",
        g2v_template : "./images/groundToVoid.png",
        v2g_template : "./images/voidToGround.png",
        v2h_template : "./images/voidToHole.png",
        v2w_template : "./images/voidToWall.png",
        test_button : "./images/test_button.png",
        highlights : "./images/highlights.png",
        laserwalltemplate : "./images/laserwall.png",
        crypto_file: "./images/allcryptofiles.png",
        crypto_key: "./images/cryptokeycircle2.png",

        // TODO: merge icons into one image
        icon_corrupt: "./images/iconcorrupt.png",
        icon_delete: "./images/icondelete.png",
        icon_merge: "./images/iconmerge.png",
        icon_move: "./images/iconmove.png",
        icon_pull: "./images/iconpull.png",
        icon_push: "./images/iconpush.png",
        icon_repair: "./images/iconrepair.png",
        icon_restore: "./images/iconrestore.png",
        icon_swap: "./images/iconswap.png",
        icon_wait: "./images/wait.png",
        icon_cancel: "./images/iconcancel.png",
        icon_take: "./images/iconpickup.png"
    },

    audio_buffers: { // Short audio assets held in memory. No hard limit on duplicates/overlaps.
        asset_loader: asset_system.audiobuffer_loader,
        test: './audio/test.mp3',
    },

    audio_streams: { // Longer audio assets streamed from disk/server. Currently limited to one unique event per audio source.
        asset_loader: asset_system.audiostream_loader,
        test: './audio/test.mp3',
    }
};


let loaded_assets = {}; // This object will be set with all the asset converted and usable.
                        // It will be organized eactly how game_assets is organized,
                        // but each asset path will be replaced by an object
                        // (for example an image path will be replaced by an HTML image element).
                        // See load_all_assets() below.

async function load_all_assets(){
    loaded_assets = await asset_system.load_assets(game_assets);
    // console.log(`ASSETS: ${JSON.stringify(loaded_assets)}`);
    return loaded_assets;
}

//////////////////////////////////////////////////////////////////////////////////////
// Some tools...
const test_button ={
    image: "test_button",
    frames: [
        { x:0, y:0, width:50, height:50 },
        { x:50, y:0, width:50, height:50 },
        { x:100, y:0, width:50, height:50 },
        { x:150, y:0, width:50, height:50 },
    ]
};

const highlight_animations = {
    idle: {
            loop: true,
            timeline: [
                        { frame: 0, duration: 333 },
                        { frame: 1, duration: 333 }
                      ],
          },
};

function icon_def_from_image(image){
    return {
        image: image,
        frames: [ { x: 0, y: 0, width: 32, height: 32 } ],
    };
}


//////////////////////////////////////////////////////////////////////////////////////
// Sprite descriptions here.
// Describe here all the sprites and sprite animations as defined by Sprite class.
const sprite_defs = {
    player : {
        image: "player",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    // { x: 64, y: 0, width: 64, height: 64 },
                ],
        // animations: {
        //     idle: {
        //             loop: true,
        //             timeline: [
        //                         { frame: 0, duration: 1000 },
        //                         { frame: 1, duration: 1000 }
        //                       ],
        //           },
        // },
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
    },
    wall : {
        image: "wall",
    },
    void : {
        image: "void",
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
    },
    crypto_file : {
        image: "crypto_file",
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
    },
    crypto_key : {
        image: "crypto_key",
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
    },

    button_cancel_action_target_selection: test_button,
    button_select_action: test_button,
    button_mute_audio: test_button,

    icon_action_corrupt: icon_def_from_image("icon_corrupt"),
    icon_action_delete: icon_def_from_image("icon_delete"),
    icon_action_merge: icon_def_from_image("icon_merge"),
    icon_action_move: icon_def_from_image("icon_move"),
    icon_action_pull: icon_def_from_image("icon_pull"),
    icon_action_push: icon_def_from_image("icon_push"),
    icon_action_repair: icon_def_from_image("icon_repair"),
    icon_action_restore: icon_def_from_image("icon_restore"),
    icon_action_swap: icon_def_from_image("icon_swap"),
    icon_action_wait: icon_def_from_image("icon_wait"),
    icon_action_cancel: icon_def_from_image("icon_cancel"),
    icon_action_take: icon_def_from_image("icon_take"),


    highlight_purple : {
        image: "highlights",
        frames: [
            { x:0, y:0, width:64, height:64 },
            { x:0, y:64, width:64, height:64 },

        ],
        animations: highlight_animations,
    },
    highlight_green : {
        image: "highlights",
        frames: [
            { x:64, y:0, width:64, height:64 },
            { x:64, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_red : {
        image: "highlights",
        frames: [
            { x:128, y:0, width:64, height:64 },
            { x:128, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_yellow : {
        image: "highlights",
        frames: [
            { x:192, y:0, width:64, height:64 },
            { x:192, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_blue : {
        image: "highlights",
        frames: [
            { x:256, y:0, width:64, height:64 },
            { x:256, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },

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
    ttlc:   {i:7,   j:3},
    ttle:   {i:5,   j:2},
    ottls:  {i:5,   j:0},
    ottl:   {i:5,   j:0},
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
    olttc:  {i:1,   j:1},
    ltbs:   {i:1,   j:9},
    ltbsc:  {i:1,   j:13},
    ltb:    {i:1,   j:10},
    ltbc:   {i:7,   j:4},
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
    obtlc:  {i:1,   j:2},
    btrs:   {i:9,   j:14},
    btr:    {i:10,  j:14},
    btrc:   {i:8,   j:4},
    btre:   {i:10,  j:13},
    btrec:  {i:2,   j:13},
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
    ortbc:  {i:2,   j:2},
    rtts:   {i:10,  j:2},
    rtt:    {i:10,  j:1},
    rttc:   {i:8,   j:3},
    rtte:   {i:9,   j:1},
    ortts:  {i:11,  j:1},
    ortt:   {i:10,  j:0},
    ortte:  {i:10,  j:0},
    ttrs:   {i:11,  j:5},
    ttr:    {i:10,  j:5},
    ttre:   {i:10,  j:4},
    ttri:   {i:10,  j:3},
    ottrs:  {i:12,  j:4},
    ottr:   {i:11,  j:4},
    ottre:  {i:11,  j:3},
    ottrc:  {i:2,   j:1},
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

/**
 * split up a sprite sheet representing animated tiles
 * @param {*} imgname - template tilesheet reference
 * @param {*} lvl - level associated w/ tilesheet
 * @param {*} layer - layer associated w/ tilesheet
 * @param {*} tilesize - base size of a single tile
 * @param {*} templatesize - base size of the template
 * @param {*} frames - number of frames
 * @param {*} duration - duration to apply for each frame
 */
function update_anim_defs(imgname, lvl, layer, tilesize, templatesize, frames, duration) {
    // build animation
    const anim = {
        idle: {
            loop: true,
            timeline: []
        },
    }
    for (let i=0; i<frames; i++) {
        anim.idle.timeline.push( { frame: i, duration: duration } );
    }

    // for each possible tile definition from template, build out asset
    for (const [k, p] of Object.entries(tile_defs)) {
        let def = {
            image: imgname,
            frames: [],
            animations: anim,
        }
        for (let i=0; i<frames; i++) {
            def.frames.push({
                x: p.i*tilesize + i*templatesize,
                y: p.j*tilesize,
                width: tilesize,
                height: tilesize
            });
        }
        let id = tile_id(lvl, layer, k);
        sprite_defs[id] = def;
    }
}

update_sprite_defs("bgtemplate", "lvl1", "bg", 32);
update_sprite_defs("tiletemplate", "lvl1", "fg", 32);
update_sprite_defs("laserwalltemplate", "lvl1", "laser", 32);

update_sprite_defs("g2w_template", "lvl1", "g2w", 32);
update_sprite_defs("g2h_template", "lvl1", "g2h", 32);
update_sprite_defs("g2o_template", "lvl1", "g2o", 32);
update_sprite_defs("g2v_template", "lvl1", "g2v", 32);

update_sprite_defs("h2w_template", "lvl1", "h2w", 32);
update_sprite_defs("h2v_template", "lvl1", "h2v", 32);
update_sprite_defs("h2g_template", "lvl1", "h2g", 32);

update_sprite_defs("w2h_template", "lvl1", "w2h", 32);
update_sprite_defs("w2v_template", "lvl1", "w2v", 32);
update_sprite_defs("w2g_template", "lvl1", "w2g", 32);


update_sprite_defs("v2g_template", "lvl1", "v2g", 32); // FIXME: performance of animations in tile grids - replace this line by the following commented one once we have animations fluid on tiles
// update_anim_defs("v2g_template", "lvl1", "v2g", 32, 512, 8, 100);

update_sprite_defs("v2h_template", "lvl1", "v2h", 32);
update_sprite_defs("v2w_template", "lvl1", "v2w", 32);