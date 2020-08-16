// This file contains the main loop and initialization code for this game, and the global game state machine.

// save the canvas for dimensions, and its 2d context for drawing to it
import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import { load_all_assets, sound_event_defs } from "./game-assets.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";

import { LoadingGameScreen } from "./screen-loading-game.js";
import { MainMenuScreen } from "./screen-main-menu.js";
import { GameScreen } from "./screen-game.js";
import { CreditsScreen } from "./screen-credits.js";
import { GameOverScreen_Success, GameOverScreen_Failure } from "./screen-gameover.js";
import { MuteAudioButton } from "./game-ui.js";


let last_update_time = performance.now();
const max_delta_time = 1000 / 26; // Always assume at worst that we are at 26fps
let mute_button;

// This describe the different states/screens the game can go through.
// There can be inner states too.
const game_state_machine = new class extends fsm.StateMachine{
  constructor(){
    super({
      loading_game: new LoadingGameScreen(),
      main_menu: new MainMenuScreen(),
      credits: new CreditsScreen(),
      game: new GameScreen(),
      gameover_success: new GameOverScreen_Success(),
      gameover_failure: new GameOverScreen_Failure(),
    },{
      // This is the transition table, stating which action from one state leads to which other state.
      initial_state: "loading_game",
      loading_game: {
        game_ready: "main_menu"
      },
      main_menu: {
        new_game: "game",
        credits: "credits",
      },
      credits: {
        back: "main_menu",
      },
      game: {
        exit: "main_menu",
        escape: "gameover_success",
        died: "gameover_failure",
      },
      gameover_success: {
        ok: "credits",
      },
      gameover_failure: {
        back: "main_menu",
        retry: "game",
      }
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
  game_state_machine.start();
  game_state_machine.update(); // To display the first state at least once before starting loading...

  const assets = await load_all_assets();
  game_state_machine.update();
  const canvas_context = graphics.initialize(assets);
  game_state_machine.update();
  audio.initialize(assets, sound_event_defs);
  game_state_machine.update();
  input.initialize(canvas_context);
  game_state_machine.update();
  game_state_machine.make_ready_for_canvas_resize(); // This must be called after the rest is initialized as it's implem relies on graphics data etc.
  // OK now we're ready.
  start();
}

function start() { // Now we can start the game!
  mute_button = new MuteAudioButton();
  window.requestAnimationFrame(update_cycle);
  game_state_machine.push_action("game_ready");
  console.log("GAME READY - STARTING");
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
