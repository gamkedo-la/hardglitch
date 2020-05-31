// This file contains code that handle input and provide
// tools to translate input to actions.

export {
  initialize, update,
  mouse, keyboard,
  KEY_STATE, KeyState,
};

import * as spatial from "./spatial.js";
import { is_number, duration, is_valid_duration } from "./utility.js";

const KEY_STATE = {
  NOT_USED: 0,        // The key is not used
  DOWN: 1,            // The key has just been pressed
  HOLD: 2,            // The key is hold down
  UP: 3,              // The key has just been released
};

// Record of the state of an key or button and since when it have been like this.
class KeyState{
  _state = KEY_STATE.NOT_USED;
  _since = 0;

  constructor(values){
    if(values){
      if(values.state != undefined)
        this._state = values.state;
      if(values.since != undefined)
        this._since = values.since;
    }
  }

  get state() { return this._state; }
  get since() { return this._since; }
  set state(new_state) {
    this._state = new_state;
    // Keep track of when the state of the key changed.
    if(this._state == KEY_STATE.UP || this._state == KEY_STATE.DOWN)
      this._since = Date.now();
  }
};



class Mouse{
  constructor(){
    this._position = new spatial.Vector2();
    this._last_position_update = Date.now();
  }

  get position(){ return this._position; }
  set position(new_pos){
    // TODO: add checks here
    console.assert(new_pos);
    console.assert(new_pos.x >= 0 && new_pos.y >= 0);
    this._position.x = new_pos.x;
    this._position.y = new_pos.y;
    this._last_position_update = Date.now();
  }

  // Return the time (milliseconds) since the mouse took the current position.
  get time_since_position_changed() { return duration(this._last_position_update, Date.now()); }

  update(delta_time){
    // update states so that
  }

};

const KEYCODES_COUNT = 256;

function is_valid_keycode(key_code){
  return is_number(key_code)
      && key_code >= 0
      && key_code < KEYCODES_COUNT;
}

class Keyboard {

  constructor(){
    this._last_update_time = Date.now();
    this._time_until_pressed_becomes_hold = 10; // Time (ms) it takes for a pressed key to switch from being "down" to "hold".
    this._time_until_released_becomes_not_used = 10; // Time (ms) it takes for a pressed key to switch from being "down" to "hold".
    this._keys_states = new Array(KEYCODES_COUNT);
    for(let idx = 0; idx < KEYCODES_COUNT; ++idx){
      this._keys_states[idx] = new KeyState(this._last_update_time); // We want a different state objects for each key.
    }
  }

  set time_until_pressed_becomes_hold(new_duration) {
    console.assert(is_valid_duration(new_duration));
    this._time_until_pressed_becomes_hold = new_duration;
  }

  set time_until_released_becomes_not_used(new_duration) {
    console.assert(is_valid_duration(new_duration));
    this._time_until_pressed_becomes_hold = new_duration;
  }

  // Return a copy of the complete keyboard state.
  get capture_keys_states(){
    return new Array.from(this._keys_states, (key_state)=> new KeyState(key_state)); // Forcing copies!
  }

  // Return the complete state of a key (as a KeyState)
  get_key_state(key_code){
    console.assert(is_valid_keycode(key_code));
    return this._keys_states[key_code];
  }

  set_key_state(key_code, new_state){
    const key_state = this.get_key_state(key_code);
    key_state.state = new_state;
  }

  // Return true if the key has just been pressed or have been hold down for at least the provided minimum time.
  is_down(key_code, min_duration=0) {
    return this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.DOWN, KEY_STATE.HOLD], min_duration: min_duration });
  }

  // Return true if the key has just been released or have not been pressed for at least the provided minimum time.
  is_up(key_code, min_duration=0){
    return this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.UP, KEY_STATE.NOT_USED], min_duration: min_duration });
  }

  // Return true if the key has been hold down for at least the provided minimum time.
  is_hold(key_code, min_duration=0) {
    return this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.HOLD], min_duration: min_duration });
  }

  // Return true if the key has not been pressed for at least the provided minimum time.
  is_used(key_code, min_duration=0){
    return !this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.NOT_USED], min_duration: min_duration });
  }

  // Return true if the key has just been pressed or have been hold down, for at least the provided minimum time.
  is_just_released(key_code, min_duration=0){
    return this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.UP], min_duration: min_duration });
  }

  is_just_down(key_code, min_duration=0){
    return this.keys_matches_pattern({ key_code: key_code, states: [KEY_STATE.DOWN], min_duration: min_duration });
  }

  // Return true if the provided combination (made of one or more patterns) are true.
  // The pattern object should look like this:
  //  {
  //    key_code: some_keycode,             // The keycode of the key to check.
  //    states: [ state_1, state_2, ... ],  // If any of these states matches the key's state, it's a match.
  //    min_duration: 1000,                 // (Optional) Minimum duration the key must have been in one of the specified states.
  //  }
  //
  // Example:
  //    if(keyboard.keys_matches_pattern(
  //       { key_code: KEYCODE_LCTRL, states: [KEY_STATE.DOWN, KEY_STATE.HOLD], min_duration: 500 },
  //       { key_code: KEYCODE_SPACE], states: [KEY_STATE.DOWN] }
  //    )) { do_something(); }
  keys_matches_pattern(...patterns){
    for(const pattern of patterns){
      const key_state = this.get_key_state(pattern.key_code);
      if(!pattern.states.some(state_to_match => key_state.state == state_to_match))
        return false; // The current keystate doesn't match any of the potential states to match.
      if(pattern.min_duration != undefined){
        const key_state_duration = this.key_state_duration(key_state);
        if(key_state_duration < pattern.min_duration)
          return false; // The key have not been in this state long enough to be matching.
      }
    }
    return true;
  }

  // Returns the time passed (up to last update) since the key was in it's current state.
  key_state_duration(key_state){
    console.assert(key_state instanceof KeyState);
    return duration(key_state.since, this._last_update_time);
  }

  update(delta_time){
    this._last_update_time = Date.now();

    for(const key_state of this._keys_states){
      switch(key_state.state){
        case KEY_STATE.UP:
          if(this.key_state_duration(key_state) >= this._time_until_released_becomes_not_used){
            key_state.state = KEY_STATE.NOT_USED;
          }
          break;
        case KEY_STATE.DOWN:
          if(this.key_state_duration(key_state) >= this._time_until_pressed_becomes_hold){
            key_state.state = KEY_STATE.HOLD;
          }
          break;
      }
    }
  }
};

const mouse = new Mouse();
const keyboard = new Keyboard();

function canvas_mouse_position(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x: x, y:y };
}

function initialize(canvas) {

  document.addEventListener("keydown", function(event) {
    event.preventDefault(); // without this, arrow keys scroll the browser!
    keyboard.set_key_state(event.keyCode, KEY_STATE.DOWN);
  });

  document.addEventListener("keyup", function(event) {
    keyboard.set_key_state(event.keyCode, KEY_STATE.UP);
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

function update(delta_time){
  mouse.update(delta_time);
  keyboard.update(delta_time);
}
