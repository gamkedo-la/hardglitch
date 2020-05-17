// This file contains the main loop and initialization code for this game.

export { current_game, current_view }

// save the canvas for dimensions, and its 2d context for drawing to it
import * as graphics from "./system/graphics.js";
import { load_all_assets } from "./game-assets.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";

import * as input from "./system/input.js";

import { make_test_world, next_update } from "./scratchpad.js";

let current_game = null;
let current_view = null;

window.onload = async function() {
  graphics.initialize();
  await load_all_assets();

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

  input.initialize(next_update);

  console.log("GAME READY - STARTED");
}

function update_everything() {
  current_view.update();
}

function draw_everything() {
  graphics.clear();
  current_view.render_graphics();
}

function new_game() {
  current_game = new Game(make_test_world());
  current_view = new GameView(current_game);
}
