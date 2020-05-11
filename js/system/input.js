// This file contains code that handle input and provide
// tools to translate input to actions.


export {
  initialize
};

// keyboard keycode constants, determined by printing out evt.keyCode from a key handler
const KEY_LEFT_ARROW = 37;
const KEY_UP_ARROW = 38;
const KEY_RIGHT_ARROW = 39;
const KEY_DOWN_ARROW = 40;
const KEY_LETTER_W = 87;
const KEY_LETTER_A = 65;
const KEY_LETTER_S = 83;
const KEY_LETTER_D = 68;

function initialize(on_key_released) {

  function keyPressed(evt) {
    evt.preventDefault(); // without this, arrow keys scroll the browser!
  }

  function keyReleased(evt) {
    on_key_released(evt);
  }

  document.addEventListener("keydown", keyPressed);
  document.addEventListener("keyup", keyReleased);

}

