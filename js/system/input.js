// This file contains code that handle input and provide
// tools to translate input to actions.

export {
  initialize,
  mouse, keyboard,
  KEY_STATE,
};

import * as spatial from "./spatial.js";

const KEY_STATE = {
  NOT_USED: 0,        // The key is not used
  DOWN: 1,            // The key has just been pressed
  HOLD: 2,            // The key is hold down
  UP: 3,              // The key is released
};

class Mouse{
  _position = new spatial.Vector2();

  get position(){ return this._position; }
  set position(new_pos){
    // TODO: add checks here
    console.assert(new_pos);
    console.assert(new_pos.x >= 0 && new_pos.y >= 0);
    this._position.x = new_pos.x;
    this._position.y = new_pos.y;
  }

  update(){

  }

};

class Keyboard {

};

const mouse = new Mouse();
const keyboard = new Keyboard();

function canvas_mouse_position(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x: x, y:y };
}

function initialize(canvas, on_key_released) {

  document.addEventListener("keydown", function(event) {
    event.preventDefault(); // without this, arrow keys scroll the browser!
  });

  document.addEventListener("keyup", function(event) {
    on_key_released(event); // TOOD: REPLACE THIS WITH PROPER INPUT HANDLING
  });

  function update_mouse_pos(event){
    mouse.position = canvas_mouse_position(canvas, event);
  }

  canvas.addEventListener('mousemove', function(event) {
    update_mouse_pos(event);
  });

  canvas.addEventListener('mousedown', function(event) {
    update_mouse_pos(event);
  });

}

