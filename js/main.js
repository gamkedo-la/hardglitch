// This file contains the main loop and initialization code for this game, and the global game state machine.

// save the canvas for dimensions, and its 2d context for drawing to it
import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import { load_all_assets } from "./game-assets.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";

import { LoadingGameScreen } from "./screen-loading-game.js";
import { MainMenuScreen } from "./screen-main-menu.js";
import { GameScreen } from "./screen-game.js";


let last_update_time = performance.now();
const max_delta_time = 1000 / 26; // Always assume at worst that we are at 26fps

// This describe the different states/screens the game can go through.
// There can be inner states too.
const game_state_machine = new class extends fsm.StateMachine{
  constructor(){
    super({
      loading_game: new LoadingGameScreen(),
      main_menu: new MainMenuScreen(),
      game: new GameScreen(),
    },{
      // This is the transition table, stating which action from one state leads to which other state.
      initial_state: "loading_game",
      loading_game: { game_ready: "main_menu" },
      main_menu: { new_game: "game" },
    });
  }

  update(delta_time){
    input.update(delta_time);
    super.update(delta_time); // Update the current state (and other details automatically handled, like transitions)
  }

  display(canvas_context){
    graphics.clear();
    this.current_state.display(canvas_context);
  }
};

// Loading...
window.onload = async function() {
  game_state_machine.start();
  game_state_machine.update(); // To display the first state at least once before starting loading...

  const assets = await load_all_assets();
  const canvas_context = graphics.initialize(assets);
  audio.initialize(assets);
  input.initialize(canvas_context);
  // OK now we're ready.
  start();
}

function start() { // Now we can start the game!
  window.requestAnimationFrame(update_cycle);
  game_state_machine.push_action("game_ready");
  console.log("GAME READY - STARTED");
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

  game_state_machine.update(delta_time);
  game_state_machine.display(graphics.screen_canvas_context);

  window.requestAnimationFrame(update_cycle);
}
