// This file describe the assets specific to this game
// and how to load them.

export {
    loaded_assets as assets,
    load_all_assets,
    sprite_defs,
    sound_event_defs,
    music_id,
};

import * as debug from "./system/debug.js";
import * as asset_system from "./system/assets.js";
import { Vector2_origin } from "./system/spatial.js";


const game_assets = { // Description of the assets to load.
    images : { // group "images"
        asset_loader : asset_system.image_loader, // This is the function that will be used to convert the following data into usable objects.

        level_transition: "./images/level-transitions.png",
        level_transition_gameover: "./images/level-transitions_gameover.png",
        title_bg: "./images/titlebg.png",

        glitch: "./images/glitch-painting.png",
        test_enemy: "./images/test_enemy.png",
        test_enemy_2: "./images/test_enemy_2.png",
        tileset_entry_exit : "./images/portalinout.png",
        exit_portal : "./images/exit_portal.png",
        exit_portal2 : "./images/portal9.png",
        exit_portal3 : "./images/portal11.png",
        ground_template : "./images/ground_template.png",
        ground2_template : "./images/ground2_template.png",
        lvl1warm_template : "./images/lvl1warm.png",
        lvl1cool_template : "./images/lvl1cool.png",
        lvl2warm_template : "./images/lvl2warm.png",
        lvl2cool_template : "./images/lvl2cool.png",
        lvl3warm_template : "./images/lvl3warm.png",
        lvl3cool_template : "./images/lvl3cool.png",
        lvl1a_template : "./images/lvl1a.png",
        lvl1b_template : "./images/lvl1b.png",
        lvl2a_template : "./images/lvl2a.png",
        lvl2b_template : "./images/lvl2b.png",
        lvl3a_template : "./images/lvl3a.png",
        lvl3b_template : "./images/lvl3b.png",
        lvl4a_template : "./images/lvl4a.png",
        lvl4b_template : "./images/lvl4b.png",
        void_template : "./images/void_template.png",
        hole_template : "./images/hole_template.png",
        wall_template : "./images/wall_template.png",
        test_button : "./images/test_button.png",
        up_down : "./images/up_down.png",
        highlights : "./images/highlights.png",
        highlightsv2 : "./images/highlightsv2.png",
        laserwalltemplate : "./images/laserwall.png",
        crypto_file: "./images/allcryptofiles.png",
        crypto_key_0: "./images/cryptokeytriangle2.png",
        crypto_key_1: "./images/cryptokeyequal2.png",
        crypto_key_2: "./images/cryptokeyplus2.png",
        crypto_key_3: "./images/cryptokeycircle2.png",
        movable_wall: "./images/column5.png",
        black_box: "./images/black_box.png",
        movewall_blue: "./images/movewall_blue.png",
        movewall_green: "./images/movewall_green.png",
        movewall_orange: "./images/movewall_orange.png",
        movewall_purple: "./images/movewall_purple.png",
        movewall_red: "./images/movewall_red.png",
        movable_glass_wall: "./images/column2.png",
        movewall_glass_blue: "./images/movewall_blue3.png",
        movewall_glass_green: "./images/movewall_green3.png",
        movewall_glass_orange: "./images/movewall_orange3.png",
        movewall_glass_purple: "./images/movewall_purple3.png",
        movewall_glass_red: "./images/movewall_red3.png",
        love: "./images/love.png",
        shadow: "./images/shadow.png",
        shadow2: "./images/shadow2.png",
        shadow_lg: "./images/shadow_lg.png",
        shadow_red: "./images/shadow_red.png",
        life_form: "./images/life-form.png",
        life_form_weak: "./images/life_form_weak.png",
        life_form_aggressive: "./images/life-form-aggressive.png",
        life_form_berserk: "./images/life-form-berserk.png",
        virus: "./images/virus.png",
        antivirus: "./images/anti-virus.png",
        program: "./images/program.png",
        microcode: "./images/microcode.png",
        menu_button_text: "./images/wordmenu1.png",
        menu_button: "./images/menu_button.png",
        stream_buffer: "./images/streambuffer.png",
        item_slot: "./images/itemslot.png",
        help_item_slot: "./images/itemslot-help.png",
        item_generic_1: "./images/genericitem1.png",
        item_generic_2: "./images/genericitem2.png",
        item_generic_3: "./images/genericitem3.png",
        item_generic_3_1: "./images/genericitem3.1.png",
        item_generic_4: "./images/genericitem4.png",
        item_generic_4_1: "./images/genericitem4.1.png",
        item_generic_4_2: "./images/genericitem4.2.png",
        item_generic_4_3: "./images/genericitem4.3.png",
        item_generic_5: "./images/genericitem5.png",
        item_generic_6: "./images/genericitem6.png",
        item_generic_7: "./images/genericitem7.png",
        item_corrupt: "./images/item_corrupt.png",
        item_copy: "./images/item_copy.png",
        item_threadpool: "./images/item_threadpool.png",
        item_zip: "./images/item_zip.png",
        item_computercluster: "./images/item_computercluster.png",
        item_jump: "./images/item_jump.png",
        info_box_button: "./images/infoboxbutton.png",
        game_over_skull: "./images/game-over-skull.png",
        vision: "./images/vision.png",

        // TODO: merge icons into one image
        icon_volume_mute: "./images/iconmute.png",
        icon_volume_unmute: "./images/iconsound.png",
        icon_corrupt: "./images/iconcorrupt.png",
        icon_delete: "./images/icondelete.png",
        icon_merge: "./images/iconmerge.png",
        icon_move: "./images/iconmove.png",
        icon_push: "./images/icon_push.png",
        icon_pull: "./images/icon_pull.png",
        icon_north: "./images/icon_north.png",
        icon_south: "./images/icon_south.png",
        icon_east: "./images/icon_east.png",
        icon_west: "./images/icon_west.png",
        icon_repair: "./images/iconrepair.png",
        icon_restore: "./images/iconrestore.png",
        icon_swap: "./images/iconswap.png",
        icon_wait: "./images/wait.png",
        icon_cancel: "./images/iconcancel.png",
        icon_take: "./images/iconpickup.png",
        icon_observe: "./images/iconobserve.png",

        procgen_template : "./images/procgen_tiles_template.png",
        procgen_tile_1: "./images/procgen_tile_1.png",
        procgen_tile_2: "./images/procgen_tile_2.png",
        procgen_tile_3: "./images/procgen_tile_3.png",
        procgen_tile_4: "./images/procgen_tile_4.png",
        procgen_tile_5: "./images/procgen_tile_5.png",
        procgen_tile_6: "./images/procgen_tile_6.png",
        procgen_tile_7: "./images/procgen_tile_7.png",
        procgen_tile_8: "./images/procgen_tile_8.png",
        procgen_tile_9: "./images/procgen_tile_9.png",
        procgen_tile_10: "./images/procgen_tile_10.png",
        procgen_spawn_1: "./images/procgen_spawn_1.png",
        procgen_spawn_2: "./images/procgen_spawn_2.png",
        procgen_spawn_3: "./images/procgen_spawn_3.png",
        procgen_spawn_4: "./images/procgen_spawn_4.png",
        procgen_spawn_5: "./images/procgen_spawn_5.png",
        procgen_spawn_6: "./images/procgen_spawn_6.png",
        procgen_spawn_7: "./images/procgen_spawn_7.png",
        procgen_spawn_8: "./images/procgen_spawn_8.png",
        procgen_spawn_9: "./images/procgen_spawn_9.png",
        procgen_spawn_10: "./images/procgen_spawn_10.png",
        procgen_spawn_11: "./images/procgen_spawn_11.png",
        procgen_spawn_12: "./images/procgen_spawn_12.png",
        procgen_spawn_13: "./images/procgen_spawn_13.png",
        procgen_spawn_14: "./images/procgen_spawn_14.png",
        procgen_spawn_15: "./images/procgen_spawn_15.png",
        procgen_spawn_16: "./images/procgen_spawn_16.png",
        procgen_spawn_17: "./images/procgen_spawn_17.png",
        procgen_spawn_18: "./images/procgen_spawn_18.png",
        procgen_spawn_19: "./images/procgen_spawn_19.png",
        procgen_spawn_20: "./images/procgen_spawn_20.png",
    },

    audio_buffers: { // Short audio assets held in memory. No hard limit on duplicates/overlaps.
        asset_loader: asset_system.audiobuffer_loader,
        test: './audio/test.mp3',
        newCycle: './audio/NewCycle4.mp3',
        streaming: './audio/NewCycle.mp3',
        click: './audio/Click.mp3',
        delete: './audio/Delete3.mp3',
        delete2: './audio/Delete2.mp3',
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
        aItem: './audio/ActiveItem.mp3',
        sItem: './audio/SwapItem.mp3',
        dissolve: './audio/DissolveItem.mp3',
        shake: './audio/Shake.mp3',
        drop: './audio/DropItem.mp3',
        decrypt: './audio/Decrypt-002.mp3',
        decryptr: './audio/Decrypt_Rev.mp3',
        shaker: './audio/Shake_ShakeRev.mp3',
        shakes: './audio/Shake_ShakeSparkle.mp3',
        dissolver: './audio/DissolveItem_Rev.mp3',
        destableShot: './audio/DestabilizeShot.mp3',
        destableScan: './audio/DestabilizeScanner.mp3',
        corrupt: './audio/Corrupt.mp3',
        spawn: './audio/Spawn.mp3',
        scan: './audio/Scan.mp3',
        eButtonHover: './audio/EditorButtonHover.mp3',
        eButtonClick: './audio/EditorButtonClick.mp3',
    },

    audio_streams: { // Longer audio assets streamed from disk/server. Currently limited to one unique event per audio source.
        asset_loader: asset_system.audiostream_loader,
        testMusic: './audio/test.mp3',
        glitchlife: './audio/music/HardGlitch_GlitchyLife.mp3',
        radream: './audio/music/HardGlitch_RandomAccessDream_Loop.mp3',
        breakdown: './audio/music/HardGlitchBreakdown.aac',
        glitchborn: './audio/music/HardGlitch_AGlitchIsBorn.mp3',
        helloworld: './audio/music/HardGlitch_HelloWorld.mp3',
        broketheloop: './audio/music/HardGlitch_BrokeTheLoop.mp3',
        mistakes: './audio/music/HardGlitch_MistakesWereMade.mp3',
        scopedlife: './audio/music/HardGlitch_ScopedLifetime.mp3',
        datam: './audio/music/HardGlitch_DataMiner.aac',
        glitchshell: './audio/music/HardGlitch_GlitchOutTheShell.aac',
        leak: './audio/music/HardGlitch_MemoryLeak_loop.aac',
    }
};


let loaded_assets = {}; // This object will be set with all the asset converted and usable.
                        // It will be organized eactly how game_assets is organized,
                        // but each asset path will be replaced by an object
                        // (for example an image path will be replaced by an HTML image element).
                        // See load_all_assets() below.

async function load_all_assets(){
    loaded_assets = await asset_system.load_assets(game_assets);
    // debug.log(`ASSETS: ${JSON.stringify(loaded_assets)}`);
    return loaded_assets;
}

//////////////////////////////////////////////////////////////////////////////////////
// Some tools...
function test_button(image_name = "test_button", offset_vec = Vector2_origin){
    return {
        image: image_name,
        frames: [
            { x: offset_vec.x + 0, y: offset_vec.y + 0, width: 50, height: 50 },
            { x: offset_vec.x + 50, y: offset_vec.y + 0, width: 50, height: 50 },
            { x: offset_vec.x + 100, y: offset_vec.y + 0, width: 50, height: 50 },
            { x: offset_vec.x + 150, y: offset_vec.y + 0, width: 50, height: 50 },
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
        loop: false,
        timeline: [
                    { frame: 0, duration: 50 },
                  ],
      },
    moving: {
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
    debug.assertion(()=>Number.isInteger(line));
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

    level_transition : { image: "level_transition" },
    level_transition_gameover: { image: "level_transition_gameover" },
    title_bg : { image: "title_bg" },
    game_over_skull : {image: 'game_over_skull'},

    love : {
        image: "love",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                ],
    },

    shadow : {
        image: "shadow",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                ],
    },

    shadow_red : {
        image: "shadow_red",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                ],
    },

    player : {
        image: "glitch",
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
    test_enemy_2: {
        image: "test_enemy_2",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 8000 },
                                { frame: 1, duration: 8000 }
                              ],
                  },
        },
    },
    program : {
        image: "program",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 256, y: 0, width: 64, height: 64 }
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 4, duration: 200 }
                            ],
                },
        },
    },
    virus : {
        image: "virus",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                    { x: 128, y: 0, width: 64, height: 64 },
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
                                { frame: 2, duration: 200 },
                              ],
                  },
        },
    },
    antivirus: {
        image: "antivirus",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                    { x: 128, y: 0, width: 64, height: 64 },
                    { x: 192, y: 0, width: 64, height: 64 }
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                              ],
                  },
        },
    },

    microcode: {
        image: "microcode",
        frames: [
                    { x: 0, y: 0, width: 64, height: 64 },
                    { x: 64, y: 0, width: 64, height: 64 },
                    { x: 128, y: 0, width: 64, height: 64 },
                    { x: 192, y: 0, width: 64, height: 64 }
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
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
                    { x: 0, y: 0, width: 64, height: 64 }
                ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 }
                              ],
                  },
        },
    },


    life_form_aggressive: {
        image: "life_form_aggressive",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 256, y: 0, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 200 },
                                { frame: 1, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 4, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 1, duration: 200 },
                            ],
                },
        },
    },


    life_form_berserk: {
        image: "life_form_berserk",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 256, y: 0, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 50 },
                                { frame: 1, duration: 100 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 4, duration: 400 },
                                { frame: 3, duration: 200 },
                                { frame: 2, duration: 200 },
                                { frame: 1, duration: 100 },
                            ],
                },
        },
    },

    item_copy: {
        image: "item_copy",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 700 },
                                { frame: 1, duration: 700 },
                            ],
                },
        },
    },

    item_corrupt: {
      image: "item_corrupt",
      frames: [
          { x: 0, y: 0, width: 64, height: 64 },
          { x: 64, y: 0, width: 64, height: 64 },
      ],
      animations: {
          idle: {
                  loop: true,
                  timeline: [
                              { frame: 0, duration: 700 },
                              { frame: 1, duration: 700 },
                          ],
              },
      },
    },

    item_jump: {
      image: "item_jump",
      frames: [
          { x: 0, y: 0, width: 64, height: 64 },
          { x: 64, y: 0, width: 64, height: 64 },
          { x: 128, y: 0, width: 64, height: 64 },
          { x: 192, y: 0, width: 64, height: 64 },
          { x: 256, y: 0, width: 64, height: 64 },
          { x: 0, y: 64, width: 64, height: 64 },
          { x: 64, y: 64, width: 64, height: 64 },
          { x: 128, y: 64, width: 64, height: 64 },
          { x: 192, y: 64, width: 64, height: 64 },
          { x: 256, y: 64, width: 64, height: 64 },
      ],
      animations: {
          idle: {
                  loop: true,
                  timeline: [
                              { frame: 0, duration: 500 },
                              { frame: 1, duration: 500 },
                              { frame: 2, duration: 500 },
                              { frame: 3, duration: 500 },
                              { frame: 4, duration: 500 },
                              { frame: 5, duration: 500 },
                              { frame: 6, duration: 500 },
                              { frame: 7, duration: 500 },
                              { frame: 8, duration: 500 },
                              { frame: 9, duration: 500 },
                          ],
              },
      },
    },

    item_threadpool: {
        image: "item_threadpool",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 0, y: 64, width: 64, height: 64 },
            { x: 64, y: 64, width: 64, height: 64 },
            { x: 128, y: 64, width: 64, height: 64 },
            { x: 192, y: 64, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 500 },
                                { frame: 1, duration: 500 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 4, duration: 500 },
                                { frame: 5, duration: 500 },
                                { frame: 6, duration: 200 },
                                { frame: 7, duration: 200 },
                            ],
                },
        },
    },

    item_zip: {
        image: "item_zip",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 0, y: 64, width: 64, height: 64 },
            { x: 64, y: 64, width: 64, height: 64 },
            { x: 128, y: 64, width: 64, height: 64 },
            { x: 192, y: 64, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 500 },
                                { frame: 1, duration: 500 },
                                { frame: 2, duration: 200 },
                                { frame: 3, duration: 200 },
                                { frame: 4, duration: 500 },
                                { frame: 5, duration: 500 },
                                { frame: 6, duration: 200 },
                                { frame: 7, duration: 200 },
                            ],
                },
        },
    },

    item_computercluster: {
        image: "item_computercluster",
        frames: [
            { x: 0, y: 0, width: 64, height: 64 },
            { x: 64, y: 0, width: 64, height: 64 },
            { x: 128, y: 0, width: 64, height: 64 },
            { x: 192, y: 0, width: 64, height: 64 },
            { x: 0, y: 64, width: 64, height: 64 },
            { x: 64, y: 64, width: 64, height: 64 },
            { x: 128, y: 64, width: 64, height: 64 },
            { x: 192, y: 64, width: 64, height: 64 },
        ],
        animations: {
            idle: {
                    loop: true,
                    timeline: [
                                { frame: 0, duration: 500 },
                                { frame: 1, duration: 500 },
                                { frame: 2, duration: 500 },
                                { frame: 3, duration: 500 },
                                { frame: 4, duration: 500 },
                                { frame: 5, duration: 500 },
                                { frame: 6, duration: 500 },
                                { frame: 7, duration: 500 },
                            ],
                },
        },
    },

    vision : {
        image: "vision",
    },

    ground : {
        image: "ground",
    },
    wall : {
        image: "wall",
    },
    black_box: {
        image: "black_box",
    },
    movable_wall: {
        image: "movable_wall",
    },
    movable_wall_blue : {
        image: "movewall_blue",
    },
    movable_wall_green : {
        image: "movewall_green",
    },
    movable_wall_orange : {
        image: "movewall_orange",
    },
    movable_wall_purple : {
        image: "movewall_purple",
    },
    movable_wall_red : {
        image: "movewall_red",
    },
    movable_glass_wall: {
        image: "movable_glass_wall",
    },
    movable_glass_wall_blue : {
        image: "movewall_glass_blue",
    },
    movable_glass_wall_green : {
        image: "movewall_glass_green",
    },
    movable_glass_wall_orange : {
        image: "movewall_glass_orange",
    },
    movable_glass_wall_purple : {
        image: "movewall_glass_purple",
    },
    movable_glass_wall_red : {
        image: "movewall_glass_red",
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
        image: "exit_portal3",
        frames: [
            { x:0, y:0, width:64, height:64 },
            { x:64, y:0, width:64, height:64 },
            { x:128, y:0, width:64, height:64 },
            { x:192, y:0, width:64, height:64 },
            { x:256, y:0, width:64, height:64 },
            { x:320, y:0, width:64, height:64 },
            { x:384, y:0, width:64, height:64 },
            { x:448, y:0, width:64, height:64 },
            { x:512, y:0, width:64, height:64 },
            //{ x:576, y:0, width:64, height:64 },
            //{ x:640, y:0, width:64, height:64 },
         ],
        animations: {
            idle: {
                loop: true,
                timeline: [
                    //{ frame: 1, duration: 300 },
                    //{ frame: 2, duration: 300 },
                    //{ frame: 1, duration: 300 },
                    //{ frame: 2, duration: 300 },
                    //{ frame: 1, duration: 300 },
                    //{ frame: 2, duration: 300 },
                    { frame: 8, duration: 200 },
                    { frame: 7, duration: 200 },
                    { frame: 6, duration: 200 },
                    { frame: 5, duration: 200 },
                    { frame: 4, duration: 200 },
                    { frame: 3, duration: 200 },
                    { frame: 2, duration: 200 },
                    { frame: 1, duration: 200 },
                ],
            },
        },
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
    item_active_slot : {
        image: "item_slot",
        frames: [
            { x:72, y:0, width:72, height:72 }
         ]
    },
    item_destroy_slot : {
        image: "item_slot",
        frames: [
            { x:144, y:0, width:72, height:72 }
         ]
    },

    help_item_slot :{
        image: "help_item_slot",
        frames: [
            { x:0, y:0, width:144, height:144 },
            { x:144, y:0, width:144, height:144 },
        ],
        animations: {
            blinking: {
                loop: true,
                timeline: [
                    { frame: 0, duration: 1000 },
                    { frame: 1, duration: 1000 * (2/3) },
                ],
            },
        },
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
    },
    item_generic_2 : {
        image: "item_generic_2",
    },
    item_generic_3 : {
        image: "item_generic_3",
    },
    item_generic_3_1 : {
        image: "item_generic_3_1",
    },
    item_generic_4 : {
        image: "item_generic_4",
    },
    item_generic_4_1 : {
        image: "item_generic_4_1",
    },
    item_generic_4_2 : {
        image: "item_generic_4_2",
    },
    item_generic_4_3 : {
        image: "item_generic_4_3",
    },
    item_generic_5 : {
        image: "item_generic_5",
    },
    item_generic_6 : {
        image: "item_generic_6",
    },
    item_generic_7 : {
        image: "item_generic_7",
    },

    button_up : test_button("up_down"),
    button_down : test_button("up_down", { x: 0, y: 50 }),

    button_cancel_action_target_selection: test_button(),
    button_select_action: test_button(),
    button_mute_audio: test_button(),
    button_audio_plus: test_button(),
    button_audio_minus: test_button(),
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
            { x: 0, y: 0, width: 320, height: 24 },
            { x: 0, y: 24, width: 320, height: 24 },
            { x: 0, y: 48, width: 320, height: 24 },
            { x: 0, y: 76, width: 320, height: 24 },
        ]
    },

    button_info_box_open: {
        image: "info_box_button",
        frames: [
            { x: 0, y: 76+24, width: 320, height: 24 },
            { x: 0, y: 76+(24*2), width: 320, height: 24 },
            { x: 0, y: 76+(24*3), width: 320, height: 24 },
            { x: 0, y: 76+(24*4), width: 320, height: 24 },
        ]
    },

    icon_volume_mute: icon_def_from_image("icon_volume_mute"),
    icon_volume_unmute: icon_def_from_image("icon_volume_unmute"),
    icon_action_corrupt: icon_def_from_image("icon_corrupt"),
    icon_action_delete: icon_def_from_image("icon_delete"),
    icon_action_merge: icon_def_from_image("icon_merge"),
    icon_action_move: icon_def_from_image("icon_move"),
    icon_action_push: icon_def_from_image("icon_push"),
    icon_action_pull: icon_def_from_image("icon_pull"),
    icon_action_shift_north: icon_def_from_image("icon_north"),
    icon_action_shift_east: icon_def_from_image("icon_east"),
    icon_action_shift_west: icon_def_from_image("icon_west"),
    icon_action_shift_south: icon_def_from_image("icon_south"),
    icon_action_repair: icon_def_from_image("icon_repair"),
    icon_action_restore: icon_def_from_image("icon_restore"),
    icon_action_swap: icon_def_from_image("icon_swap"),
    icon_action_wait: icon_def_from_image("icon_wait"),
    icon_action_cancel: icon_def_from_image("icon_cancel"),
    icon_action_take: icon_def_from_image("icon_take"),
    icon_action_observe: icon_def_from_image("icon_observe"),


    highlight_purple : {
        image: "highlightsv2",
        frames: [
            { x:0, y:0, width:64, height:64 },
            { x:0, y:64, width:64, height:64 },

        ],
        animations: highlight_animations,
    },
    highlight_green : {
        image: "highlightsv2",
        frames: [
            { x:64, y:0, width:64, height:64 },
            { x:64, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_red : {
        image: "highlightsv2",
        frames: [
            { x:128, y:0, width:64, height:64 },
            { x:128, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_yellow : {
        image: "highlightsv2",
        frames: [
            { x:192, y:0, width:64, height:64 },
            { x:192, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_blue : {
        image: "highlightsv2",
        frames: [
            { x:256, y:0, width:64, height:64 },
            { x:256, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },
    highlight_gray : {
        image: "highlightsv2",
        frames: [
            { x:320, y:0, width:64, height:64 },
            { x:320, y:64, width:64, height:64 },
        ],
        animations: highlight_animations,
    },

};

// Generate sprites for the proc-gen tiles
for(let i = 1; i < 21; ++i){
    const id_tile = `PROCGEN_TILE_${i}`;
    const id_spawn = `PROCGEN_SPAWN_${i}`;
    sprite_defs[id_tile] = {
        image: `procgen_tile_${i}`,
    };
    sprite_defs[id_spawn] = {
        image: `procgen_spawn_${i}`,
    };
}

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
        volume: 0.8,
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

    'deleteAction2': {
        source_type: 'audiobuffer',
        source_name: 'delete2',
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
        volume: 0.2,
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

    'activeItem': {
        source_type: 'audiobuffer',
        source_name: 'aItem',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.4,
        unique: false,
    },

    'swapItem': {
        source_type: 'audiobuffer',
        source_name: 'sItem',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.4,
        unique: false,
    },

    'dissolveItem': {
        source_type: 'audiobuffer',
        source_name: 'dissolve',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.4,
        unique: false,
    },

    'shakeAnim': {
        source_type: 'audiobuffer',
        source_name: 'shake',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'dropItem': {
        source_type: 'audiobuffer',
        source_name: 'drop',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'decryptFile': {
        source_type: 'audiobuffer',
        source_name: 'decrypt',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'decryptRev': {
        source_type: 'audiobuffer',
        source_name: 'decryptr',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'shakeRev': {
        source_type: 'audiobuffer',
        source_name: 'shaker',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'shakeSparkle': {
        source_type: 'audiobuffer',
        source_name: 'shakes',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.7,
        unique: false,
    },

    'dissolveRev': {
        source_type: 'audiobuffer',
        source_name: 'dissolver',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'destabilizeShot': {
        source_type: 'audiobuffer',
        source_name: 'destableShot',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.8,
        unique: false,
    },

    'destabilizeScan': {
        source_type: 'audiobuffer',
        source_name: 'destableScan',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.9,
        unique: false,
    },

    'corruptAction': {
        source_type: 'audiobuffer',
        source_name: 'corrupt',
        group_name: 'SoundEffects',
        loop: false,
        volume: 0.2,
        unique: false,
    },

    'spawnAnim': {
        source_type: 'audiobuffer',
        source_name: 'spawn',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'scanAnim': {
        source_type: 'audiobuffer',
        source_name: 'scan',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'EditorButtonHover': {
        source_type: 'audiobuffer',
        source_name: 'eButtonHover',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'EditorButtonClick': {
        source_type: 'audiobuffer',
        source_name: 'eButtonClick',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
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
    },

    'HGBreakdown': {
        source_type: 'audiostream',
        source_name: 'breakdown',
        group_name: 'Music',
        loop: true,
        volume: 0.5,
        unique: true, // Will not create a new event instance if true
    },

    'GlitchIsBorn': {
        source_type: 'audiostream',
        source_name: 'glitchborn',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'HelloWorld': {
        source_type: 'audiostream',
        source_name: 'helloworld',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },


    'BrokeTheLoop': {
        source_type: 'audiostream',
        source_name: 'broketheloop',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'Mistakes': {
        source_type: 'audiostream',
        source_name: 'mistakes',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'ScopedLifetime': {
        source_type: 'audiostream',
        source_name: 'scopedlife',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'DataMiner': {
        source_type: 'audiostream',
        source_name: 'datam',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'MemoryLeak': {
        source_type: 'audiostream',
        source_name: 'leak',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'GlitchOutTheShell': {
        source_type: 'audiostream',
        source_name: 'glitchshell',
        group_name: 'Music',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },

    'Streaming': {
        source_type: 'audiobuffer',
        source_name: 'streaming',
        group_name: 'SoundEffects',
        loop: true,
        volume: 0.7,
        unique: true, // Will not create a new event instance if true
    },
}

const music_id = {
    title: "HelloWorld",
    level_0: "HGBreakdown",
    level_1: "HGBreakdown",
    level_2: "MemoryLeak",
    level_3: "DataMiner",
    level_4: "GlitchIsBorn",
    gameover_success: "BrokeTheLoop",
    gameover_failure: "Mistakes",
    level_transition: "ScopedLifetime",
};
