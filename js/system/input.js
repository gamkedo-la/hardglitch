// This file contains code that handle input and provide
// tools to translate input to actions.


export {
  initialize
};

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

