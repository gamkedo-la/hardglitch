// This file contains the main loop and initialization code for this game.

export { current_game, current_game_view }

// save the canvas for dimensions, and its 2d context for drawing to it
import * as graphics from "./system/graphics.js";
import { load_all_assets } from "./game-assets.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";

import * as input from "./system/input.js";
import { on_player_input_in_game } from "./game-input.js";
import { make_test_world } from "./test-level.js";

import * as debug from "./debug.js";

let current_game = null;
let current_game_view = null;
let last_update_time = Date.now();

window.onload = async function() {
  const assets = await load_all_assets();
  graphics.initialize(assets);


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

  input.initialize(on_player_input_in_game); // TODO: change that so that when we have different screens with different input situations

  console.log("GAME READY - STARTED");
}

function update_everything() {
  const now = Date.now();
  const delta_time = now - last_update_time;
  last_update_time = now;
  current_game_view.update(delta_time);
}

function draw_everything() {
  graphics.clear();
  current_game_view.render_graphics();
  debug.display();
}

function new_game() {
  current_game = new Game(make_test_world());
  current_game_view = new GameView(current_game);
}
