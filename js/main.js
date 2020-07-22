// This file contains the main loop and initialization code for this game.

export { current_game, current_game_view }

// save the canvas for dimensions, and its 2d context for drawing to it
import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import { load_all_assets } from "./game-assets.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";
import { state, GameState as StateMachine } from "./game-states.js";

import * as input from "./system/input.js";
import * as game_input from "./game-input.js";
import { make_test_world } from "./testing/test-level.js";

import * as editor from "./editor.js";

let current_game = null;
let current_game_view = null;
let last_update_time = performance.now();
let game_state_machine = new StateMachine(state.running);
const max_delta_time = 1000 / 26; // Always assume at worst that we are at 26fps

window.onload = async function() {
  const assets = await load_all_assets();
  const canvas = graphics.initialize(assets);
  audio.initialize(assets);
  input.initialize(canvas); // TODO: change that so that when we have different screens with different input situations

  new_game(); // TODO : call this function only once we start a new game.

  start();
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
  update_everything(delta_time);
  draw_everything();
  window.requestAnimationFrame(update_cycle);
}

function start() {
  window.requestAnimationFrame(update_cycle);
  console.log("GAME READY - STARTED");
}



function update_everything(delta_time) {

  // switch(gameState.getState()) {
  //   case state.menu:
  //     break;
  //   case state.running: {
  //     runningUpdate(delta_time);
  //     break;
  //   }
  //   case state.editor:
  //     runningUpdate(delta_time);
  //     editor.update(delta_time);
  //     break;
  //   default:
  //     console.log(`Error Updating ${gameState.getState()}`);

  // }

  // function runningUpdate(delta_time) {
    game_input.update(delta_time);
    const ongoing_target_selection = current_game_view.ui.is_selecting_action_target;
    current_game_view.update(delta_time);
  // }


  if(!ongoing_target_selection  // TODO: REPLACE THIS MECHANISM BY A FINITE STATE MACHINE: MENU <-> GAME <-> EDITOR MODE
  && current_game_view.is_time_for_player_to_chose_action
  && !input.mouse.is_dragging
  )
    editor.update(delta_time);

}

function draw_everything() {
  graphics.clear()
  switch(game_state_machine.getState()) {
    case state.menu:
      break;
    case state.running:
      current_game_view.render_graphics();
      editor.display();
      break;
    case state.editor: {
      current_game_view.render_graphics();
      editor.display();
      break;
    }
    default:
      console.log(`Error Drawing ${game_state_machine.getState()}`);
  }
}

function new_game() {
  current_game = new Game(make_test_world());
  current_game_view = new GameView(current_game);
}
