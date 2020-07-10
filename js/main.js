// This file contains the main loop and initialization code for this game.

export { current_game, current_game_view }

// save the canvas for dimensions, and its 2d context for drawing to it
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
let last_update_time = Date.now();
let game_state_machine = new StateMachine(state.running);

window.onload = async function() {
  const assets = await load_all_assets();
  const canvas = graphics.initialize(assets);
  input.initialize(canvas); // TODO: change that so that when we have different screens with different input situations

  new_game(); // TODO : call this function only once we start a new game.

  start();
}

function start() {
  // these next few lines set up our game logic and render cycle.
  var framesPerSecond = 60;
  setInterval(function() {
      update_everything();
      draw_everything();
    }, 1000/framesPerSecond);


  console.log("GAME READY - STARTED");
}

function get_delta_time() {
  const now = Date.now();
  const delta_time = now - last_update_time;
  last_update_time = now;
  return delta_time;
}

function update_everything() {
  const delta_time = get_delta_time();

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
  current_game_view.center_on_player();
}
