// This file contains the main loop and initialization code for this game, and the global game state machine.

export {
  load_level,
  load_test_level,
  load_random_test_level,
}


// save the canvas for dimensions, and its 2d context for drawing to it
import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";

import { load_all_assets, sound_event_defs } from "./game-assets.js";
import { defs as tiledefs } from "./definitions-tiles.js";
import { initialize as tile_select_initialize } from "./view/tile-select.js";

import { LoadingGameScreen } from "./screen-loading-game.js";
import { TitleScreen } from "./screen-title.js";
import { GameScreen } from "./screen-game.js";
import { CreditsScreen } from "./screen-credits.js";
import { GameOverScreen_Success, GameOverScreen_Failure } from "./screen-gameover.js";
import * as level_screens from "./screen-levels.js";
import { MuteAudioButton } from "./game-ui.js";

let last_update_time = performance.now();
const max_delta_time = 1000 / 26; // Always assume at worst that we are at 26fps
let mute_button;

// This describe the different states/screens the game can go through.
// There can be inner states too.
const game_state_machine = new class extends fsm.StateMachine {
  constructor(){
    super({
      loading_game: new LoadingGameScreen(),
      title: new TitleScreen(),
      credits: new CreditsScreen(),
      game: new GameScreen(),
      gameover_success: new GameOverScreen_Success(),
      gameover_failure: new GameOverScreen_Failure(),
      intro_level_1: new level_screens.Level_1_IntroScreen(),
      intro_level_2: new level_screens.Level_2_IntroScreen(),
      intro_level_3: new level_screens.Level_3_IntroScreen(),
      intro_level_4: new level_screens.Level_4_IntroScreen(),
    },{
      // This is the transition table, stating which action from one state leads to which other state.
      initial_state: "loading_game",
      "*" : { // From any state - TODO: consider removing me before release?
        load_game: "game",
      },

      loading_game: {
        game_ready: "title"
      },
      title: {
        new_game: "intro_level_1",
        credits: "credits",
      },
      credits: {
        back: "title",
      },
      game: {
        exit: "title",
        escape: "gameover_success",
        died: "gameover_failure",
        level_1: "intro_level_2",
        level_2: "intro_level_3",
        level_3: "intro_level_4",
      },
      gameover_success: {
        ok: "credits",
      },
      gameover_failure: {
        back: "title",
        retry: "game",
      },
      intro_level_1: {
        continue: "game"
      },
      intro_level_2: {
        continue: "game"
      },
      intro_level_3: {
        continue: "game"
      },
      intro_level_4: {
        continue: "game"
      },
    });

  }

  display(canvas_context){
    graphics.clear();
    this.current_state.display(canvas_context);
  }

  update(delta_time){
    if(this.current_state.screen_size_change){ // The screen size changed in a different state, so we need to update the current one (which we just entered).
      this.current_state.on_canvas_resized();
      this.current_state.screen_size_change = false;
    }
    super.update(delta_time);
  }

  make_ready_for_canvas_resize(){
    console.assert(Object.values(this.states).every(state => state.on_canvas_resized instanceof Function));
    window.addEventListener('resize', ()=>{
      this.current_state.on_canvas_resized();
      Object.values(this.states).filter(state => state !== this.current_state)
        .forEach(state => state.screen_size_change = true); // Make the other states be aware the screen size changed if we switch to them.
    });
  }
};



// Loading...
window.onload = async function() {
  const canvas_context = graphics.initialize();

  game_state_machine.start();
  const loading_update = ()=>{
    if(!game_state_machine.game_is_ready){
      game_state_machine.update(0);
      game_state_machine.display(canvas_context);
    }
  };
  window.requestAnimationFrame(loading_update); // Launch the display of the loading screen.

  console.log("Loading assets...");
  const assets = await load_all_assets();
  console.log("Assets loaded...");
  graphics.set_loaded_assets(assets);
  tile_select_initialize(tiledefs);
  audio.initialize(assets, sound_event_defs);
  input.initialize(canvas_context);
  console.log("Systems Initialized");
  game_state_machine.make_ready_for_canvas_resize(); // This must be called after the rest is initialized as it's implem relies on graphics data etc.
  // OK now we're ready.
  start();
}

function start() { // Now we can start the game!
  mute_button = new MuteAudioButton();
  game_state_machine.game_is_ready = true;
  console.log("GAME READY - STARTING");
  window.requestAnimationFrame(update_cycle);
}


function get_delta_time(timestamp_now) {
  const delta_time = Math.min(max_delta_time, timestamp_now - last_update_time);
  last_update_time = timestamp_now;
  return delta_time;
}

function update_cycle(highres_timestamp){
  console.assert(typeof(highres_timestamp) === 'number');
  if(!highres_timestamp)
    return;
  const delta_time = get_delta_time(highres_timestamp);

  input.update(delta_time);
  mute_button.update(delta_time);
  game_state_machine.update(delta_time);
  game_state_machine.display(graphics.screen_canvas_context);

  graphics.camera.begin_in_screen_rendering();
  mute_button.draw(graphics.screen_canvas_context); // Always on screen
  graphics.camera.end_in_screen_rendering();

  window.requestAnimationFrame(update_cycle);
}


//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
// The following code allows us to use the console to load specific levels.

import * as random_test_level from "./testing/test-level.js";
import { deserialize_world, generate_empty_world } from "./levels/level-tools.js";

function load_level(level_number){
  console.assert(Number.isInteger(level_number) && level_number > 0);
  game_state_machine.push_action("load_game", level_number);
}

function load_test_level(width, height){
  console.assert(Number.isInteger(width) && width > 1);
  console.assert( Number.isInteger(height) && height > 1);
  game_state_machine.push_action("load_game", ()=> generate_empty_world("testing", width, height) );
}

function load_random_test_level(width, height){
  console.assert(width === undefined || (Number.isInteger(width) && width > 1));
  console.assert(height === undefined || (Number.isInteger(height) && height > 1));
  game_state_machine.push_action("load_game", () => random_test_level.make_test_world({ width: width ? width : 64, height:height ? height : 64 }));
}

function load_serialized_level(world_desc){
  console.assert(world_desc);
  game_state_machine.push_action("load_game", () => deserialize_world(world_desc));
}

window.load_level = load_level;
window.load_test_level = load_test_level;
window.load_random_test_level = load_random_test_level;
window.load_serialized_level = load_serialized_level;


