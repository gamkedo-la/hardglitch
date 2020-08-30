// This file describe the assets specific to this game
// and how to load them.

export {
    loaded_assets as assets,
    load_all_assets,
    sprite_defs,
    sound_event_defs,
};

import * as asset_system from "./system/assets.js";


const game_assets = { // Description of the assets to load.
    images : { // group "images"
        asset_loader : asset_system.image_loader, // This is the function that will be used to convert the following data into usable objects.
        player: "./images/virus.png",
        test_enemy: "./images/test_enemy.png",
        tileset_entry_exit : "./images/portalinout.png",
        ground_template : "./images/ground_template.png",
        ground2_template : "./images/ground2_template.png",
        void_template : "./images/void_template.png",
        hole_template : "./images/hole_template.png",
        wall_template : "./images/wall_template.png",
        test_button : "./images/test_button.png",
        highlights : "./images/highlights.png",
        laserwalltemplate : "./images/laserwall.png",
        crypto_file: "./images/allcryptofiles.png",
        crypto_key_0: "./images/cryptokeytriangle2.png",
        crypto_key_1: "./images/cryptokeyequal2.png",
        crypto_key_2: "./images/cryptokeyplus2.png",
        crypto_key_3: "./images/cryptokeycircle2.png",
        movable_wall: "./images/column5.png",
        life_form: "./images/life_form.png",
        life_form_weak: "./images/life_form_weak.png",
        menu_button_text: "./images/wordmenu1.png",
        menu_button: "./images/menu_button.png",
        stream_buffer: "./images/streambuffer.png",
        item_slot: "./images/itemslot.png",
        item_generic_1: "./images/genericitem1.png",
        item_generic_2: "./images/genericitem2.png",
        info_box_button: "./images/infoboxbutton.png",

        // TODO: merge icons into one image
        icon_volume_mute: "./images/iconmute.png",
        icon_volume_unmute: "./images/iconsound.png",
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
        icon_take: "./images/iconpickup.png",
        icon_observe: "./images/iconobserve.png",
    },

    audio_buffers: { // Short audio assets held in memory. No hard limit on duplicates/overlaps.
        asset_loader: asset_system.audiobuffer_loader,
        test: './audio/test.mp3',
        newCycle: './audio/test.mp3',
        click: './audio/Click.mp3',
        delete: './audio/Delete3.mp3',
        destroy: './audio/Destroy.mp3',
        error: './audio/Error.mp3',
        exitbus: './audio/ExitBus.mp3',
        jump: './audio/Jump3.mp3',
        move: './audio/Move.mp3',
        repair: './audio/Repair-001.mp3',
        select: './audio/Select.mp3',
        destoryExplode: './audio/DestroyExplode_4.mp3',
        hover: './audio/Hover.mp3',
        damage: './audio/TakeDmg.mp3',
        push: './audio/PushPull.mp3',
        bounce: './audio/Bounce.mp3',
        takeItem: './audio/TakeItem.mp3',
        waitTurn: './audio/Wait.mp3',
        aSelect: './audio/actionHover.mp3',
        aClick: './audio/actionClick.mp3',
        aCancel: './audio/Cancel.mp3',
        lower: './audio/Lower.mp3',
    },

    audio_streams: { // Longer audio assets streamed from disk/server. Currently limited to one unique event per audio source.
        asset_loader: asset_system.audiostream_loader,
        test: './audio/test.mp3',
        glitchlife: './audio/music/HardGlitch_GlitchyLife.mp3',
        radream: './audio/music/HardGlitch_RandomAccessDream_Loop.mp3',
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
function test_button(image_name = "test_button"){
    return {
        image: image_name,
        frames: [
            { x: 0, y: 0, width: 50, height: 50 },
            { x: 50, y: 0, width: 50, height: 50 },
            { x: 100, y: 0, width: 50, height: 50 },
            { x: 150, y: 0, width: 50, height: 50 },
        ]
    };
}

const highlight_animations = {
    idle: {
            loop: true,
            timeline: [
                        { frame: 0, duration: 333 },
                        { frame: 1, duration: 333 }
                      ],
          },
};

const stream_animations = {
    idle: {
            loop: true,
            timeline: [
                        { frame: 0, duration: 50 },
                        { frame: 1, duration: 50 },
                        { frame: 2, duration: 50 },
                        { frame: 3, duration: 50 },
                        { frame: 4, duration: 50 },
                        { frame: 5, duration: 50 },
                        { frame: 6, duration: 50 },
                        { frame: 7, duration: 50 },
                      ],
          },
};

function icon_def_from_image(image){
    return {
        image: image,
        frames: [ { x: 0, y: 0, width: 32, height: 32 } ],
    };
}

function crypto_file_def(line){
    console.assert(Number.isInteger(line));
    const y = line * 64;
    const width = 64;
    const height = 64;
    const animation_speed = 1000 / 2;
    return  {
        image: "crypto_file",
        frames: [
            { x: 0,             y, width, height },
            { x: width,         y, width, height },
            { x: width * 2,     y, width, height },
            { x: width * 3,     y, width, height },
            { x: width * 4,     y, width, height },
        ],
        animations: {
            idle: {
                loop: false,
                timeline: [ { frame: 0, duration: 0 } ],
            },
            ready_to_decrypt: {
                loop: false,
                timeline: [ { frame: 1, duration: 0 } ],
            },
            decrypt: {
                loop: false,
                timeline: [
                    { frame: 1, duration: animation_speed * 2 },
                    { frame: 2, duration: animation_speed },
                    { frame: 3, duration: animation_speed },
                    { frame: 4, duration: animation_speed * 2 },
                ],
            },
        },
    };
}

function crypto_key_def(kind){
    return {
        image: `crypto_key_${kind}`,
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
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

    life_form_weak: {
        image: "life_form_weak",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 500 },
                                { frame: 1, duration: 200 },
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 500 },
                              ],
                  },
        },
    },

    life_form: {
        image: "life_form",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
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
    movable_wall : {
        image: "movable_wall",
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
    stream_right : {
        image: "stream_buffer",
        frames: [
            { x:0, y:0, width:64, height:64 },
            { x:0, y:1*64, width:64, height:64 },
            { x:0, y:2*64, width:64, height:64 },
            { x:0, y:3*64, width:64, height:64 },
            { x:0, y:4*64, width:64, height:64 },
            { x:0, y:5*64, width:64, height:64 },
            { x:0, y:6*64, width:64, height:64 },
            { x:0, y:7*64, width:64, height:64 },
         ],
        animations: stream_animations,
    },
    stream_left : {
        image: "stream_buffer",
        frames: [
            { x:3*64, y:0, width:64, height:64 },
            { x:3*64, y:1*64, width:64, height:64 },
            { x:3*64, y:2*64, width:64, height:64 },
            { x:3*64, y:3*64, width:64, height:64 },
            { x:3*64, y:4*64, width:64, height:64 },
            { x:3*64, y:5*64, width:64, height:64 },
            { x:3*64, y:6*64, width:64, height:64 },
            { x:3*64, y:7*64, width:64, height:64 },
         ],
        animations: stream_animations,
    },
    stream_up : {
        image: "stream_buffer",
        frames: [
            { x:2*64, y:0, width:64, height:64 },
            { x:2*64, y:1*64, width:64, height:64 },
            { x:2*64, y:2*64, width:64, height:64 },
            { x:2*64, y:3*64, width:64, height:64 },
            { x:2*64, y:4*64, width:64, height:64 },
            { x:2*64, y:5*64, width:64, height:64 },
            { x:2*64, y:6*64, width:64, height:64 },
            { x:2*64, y:7*64, width:64, height:64 },
         ],
        animations: stream_animations,
    },
    stream_down : {
        image: "stream_buffer",
        frames: [
            { x:1*64, y:0, width:64, height:64 },
            { x:1*64, y:1*64, width:64, height:64 },
            { x:1*64, y:2*64, width:64, height:64 },
            { x:1*64, y:3*64, width:64, height:64 },
            { x:1*64, y:4*64, width:64, height:64 },
            { x:1*64, y:5*64, width:64, height:64 },
            { x:1*64, y:6*64, width:64, height:64 },
            { x:1*64, y:7*64, width:64, height:64 },
         ],
        animations: stream_animations,
    },
    item_slot : {
        image: "item_slot",
        frames: [
            { x:0, y:0, width:72, height:72 }
         ]
    },
    item_equipped_slot : {
        image: "item_slot",
        frames: [
            { x:72, y:0, width:72, height:72 }
         ]
    },
    crypto_file_0 : crypto_file_def(0),
    crypto_file_1 : crypto_file_def(1),
    crypto_file_2 : crypto_file_def(2),
    crypto_file_3 : crypto_file_def(3),
    crypto_key_0 : crypto_key_def(0),
    crypto_key_1 : crypto_key_def(1),
    crypto_key_2 : crypto_key_def(2),
    crypto_key_3 : crypto_key_def(3),

    item_generic_1 : {
        image: "item_generic_1",
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
    },
    item_generic_2 : {
        image: "item_generic_1",
        frames: [
            { x:0, y:0, width:64, height:64 }
         ]
    },

    button_cancel_action_target_selection: test_button(),
    button_select_action: test_button(),
    button_mute_audio: test_button(),
    button_ingame_menu: test_button("menu_button"),

    button_menu: {
        image: "menu_button_text",
        frames: [
            { x: 0, y: 0, width: 256, height: 64 },
            { x: 0, y: 64, width: 256, height: 64 },
            { x: 0, y: 128, width: 256, height: 64 },
            { x: 0, y: 192, width: 256, height: 64 },
        ]
    },

    button_info_box_close: {
        image: "info_box_button",
        frames: [
            { x: 0, y: 0, width: 300, height: 24 },
            { x: 0, y: 24, width: 300, height: 24 },
            { x: 0, y: 48, width: 300, height: 24 },
            { x: 0, y: 76, width: 300, height: 24 },
        ]
    },

    button_info_box_open: {
        image: "info_box_button",
        frames: [
            { x: 0, y: 76, width: 300, height: 24 },
            { x: 0, y: 76+24, width: 300, height: 24 },
            { x: 0, y: 76+48, width: 300, height: 24 },
            { x: 0, y: 76+76, width: 300, height: 24 },
        ]
    },

    icon_volume_mute: icon_def_from_image("icon_volume_mute"),
    icon_volume_unmute: icon_def_from_image("icon_volume_unmute"),
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
    icon_action_observe: icon_def_from_image("icon_observe"),


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
    highlight_gray : {
        image: "highlights",
        frames: [
            { x:320, y:0, width:64, height:64 },
            { x:320, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },

};


//////////////////////////////////////////////////////////////////////////////////////
// Sound events descriptions here.
// Describe here all the sounds of the game and how to play them (not when).
const sound_event_defs = {

    // SOUND EFFECTS //


    'newCycle': {
        source_type: 'audiobuffer',
        source_name: 'newCycle',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'buffertest': {
        source_type: 'audiobuffer',
        source_name: 'test',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'selectButton': {
        source_type: 'audiobuffer',
        source_name: 'select',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'clickButton': {
        source_type: 'audiobuffer',
        source_name: 'click',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'deleteAction': {
        source_type: 'audiobuffer',
        source_name: 'delete',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'destroyAction': {
        source_type: 'audiobuffer',
        source_name: 'destroy',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'errorAction': {
        source_type: 'audiobuffer',
        source_name: 'error',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'exit_bus': {
        source_type: 'audiobuffer',
        source_name: 'exitbus',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'jumpAction': {
        source_type: 'audiobuffer',
        source_name: 'jump',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'moveAction': {
        source_type: 'audiobuffer',
        source_name: 'move',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.7,
        unique: false,
    },

    'repairAction': {
        source_type: 'audiobuffer',
        source_name: 'repair',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'explode': {
        source_type: 'audiobuffer',
        source_name: 'destoryExplode',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.7,
        unique: false,
    },

    'hoverAction': {
        source_type: 'audiobuffer',
        source_name: 'hover',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'takeDamage': {
        source_type: 'audiobuffer',
        source_name: 'damage',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.7,
        unique: false,
    },

    'pushPull': {
        source_type: 'audiobuffer',
        source_name: 'push',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'bounce': {
        source_type: 'audiobuffer',
        source_name: 'push', // Trying this sound for this case, not sure if we'll keep it
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'item': {
        source_type: 'audiobuffer',
        source_name: 'takeItem',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.2,
        unique: false,
    },

    'wait': {
        source_type: 'audiobuffer',
        source_name: 'waitTurn',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'actionSelect': {
        source_type: 'audiobuffer',
        source_name: 'aSelect',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.3,
        unique: false,
    },

    'actionClick': {
        source_type: 'audiobuffer',
        source_name: 'aClick',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'actionCancel': {
        source_type: 'audiobuffer',
        source_name: 'aCancel',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.5,
        unique: false,
    },

    'lowerAction': {
        source_type: 'audiobuffer',
        source_name: 'lower',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.4,
        unique: false,
    },

    // MUSIC EVENTS //

    'streamtest': {
        source_type: 'audiostream',
        source_name: 'test',
        group_name: 'Music',
        loop: true,
        volume: 1,
        unique: true, // Will not create a new event instance if true
    },

    'GlitchyLife': {
        source_type: 'audiostream',
        source_name: 'glitchlife',
        group_name: 'Music',
        loop: true,
        volume: 0.5,
        unique: true, // Will not create a new event instance if true
    },

    'RandomAccessDream': {
        source_type: 'audiostream',
        source_name: 'radream',
        group_name: 'Music',
        loop: true,
        volume: 0.5,
        unique: true, // Will not create a new event instance if true
    }
}


