// This file contains code that handle input and provide
// tools to translate input to actions.

export {
  initialize, update,
  mouse, keyboard, MOUSE_BUTTON,
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

function is_valid_key_state(key_state){
  return Object.values(KEY_STATE).includes(key_state);
}

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

  set_state(new_state, new_time) {
    console.assert(is_valid_key_state(new_state));
    console.assert(is_valid_duration(new_time));
    if(new_state == this.state) return;
    this._state = new_state;
    this._since = new_time;
    // console.log(`KEY CHANGE : ${new_state}`);
  }
};

const MOUSE_BUTTON = {
  LEFT: 0, MIDDLE: 1, RIGHT: 2
};


class Mouse{

  constructor(){
    this.buttons = new Keyboard(3); // Yeah, the mouse buttons are like a 3 button keyboard...
    this._position = new spatial.Vector2();
    this._last_update_time = Date.now();

    this.buttons.time_until_pressed_becomes_hold = 8; // We'll use the hold state for dragging.
    this._dragging_radius = 32; // Pixels distance from the dragging start position where
  }

  // Returns the position in the canvas.
  get position(){ return this._position; }
  set position(new_pos){
    // TODO: add checks here
    console.assert(new_pos);
    console.assert(new_pos.x >= 0 && new_pos.y >= 0);
    this._position.x = new_pos.x;
    this._position.y = new_pos.y;
  }

  // Return the time (milliseconds) since the mouse took the current position.
  get time_since_position_changed() { return duration(this._last_update_time, Date.now()); }

  get is_dragging() {
    return this.buttons.is_hold(MOUSE_BUTTON.LEFT)
        && this._dragging_start_position.distance(this.position) >= this._dragging_radius;
  }

  get was_dragging() { return this._dragging_end_position !== undefined
                           && this._dragging_start_position.distance(this._dragging_end_position) >= this._dragging_radius; }

  get dragging_positions(){
    return {
      begin: this._dragging_start_position,
      end: this._dragging_end_position,
    };
  }

  update(delta_time){
    this._last_update_time = Date.now();

    this.buttons.update(delta_time);

    if(this._last_captured_position)
      this.position = this._last_captured_position;
    this._last_captured_position = undefined;

    const left_button_state = this.buttons.get_key_state(MOUSE_BUTTON.LEFT);
    switch(left_button_state.state){
      case(KEY_STATE.DOWN):
        this._dragging_start_position = new spatial.Vector2(this.position);
        break;
      case(KEY_STATE.UP):
        this._dragging_end_position = new spatial.Vector2(this.position);
        break;
      case(KEY_STATE.NOT_USED):
        delete this._dragging_start_position;
        delete this._dragging_end_position;
        break;
      default:
        break;
    }
  }

  on_mouse_move(new_pos){
    this._last_captured_position = new_pos;
  }

  on_mouse_button_down(button_id){
    this.buttons.on_key_down(button_id);
  }

  on_mouse_button_up(button_id){
    this.buttons.on_key_up(button_id);
  }

};

const KEYCODES_COUNT = 256;

function is_valid_keycode(key_code){
  return is_number(key_code)
      && key_code >= 0
      && key_code < KEYCODES_COUNT;
}

class Keyboard {

  constructor(key_count = KEYCODES_COUNT){
    this._last_update_time = Date.now();
    this._raw_states_changes = new Array(key_count); // Boolean state for each key: true == down, false == up, or undefined if nothing changed
    this._time_until_pressed_becomes_hold = 0; // Time (ms) it takes for a pressed key to switch from being "down" to "hold".
    this._time_until_released_becomes_not_used = 0; // Time (ms) it takes for a pressed key to switch from being "down" to "hold".
    this._keys_states = new Array(key_count);
    for(let idx = 0; idx < key_count; ++idx){
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
    key_state.set_state(new_state, this._last_update_time);
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

  is_any_key_down(){
    return this._keys_states.some(keystate => keystate.state == KEY_STATE.DOWN || keystate.state == KEY_STATE.HOLD);
  }

  is_any_key_just_down(){
    return this._keys_states.some(keystate => keystate.state == KEY_STATE.DOWN);
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
      if(pattern.min_duration !== undefined){
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

    for(let key_code = 0; key_code < this._raw_states_changes.length; ++key_code){
      const is_key_physically_down = this._raw_states_changes[key_code];
      const key_state = this._keys_states[key_code];

      // Only really change the value if it was changed physically
      if(is_key_physically_down == undefined){ // The real state didn't change

        // We only change the state for holing/not-used if it was not changed at this update cycle.
        switch(key_state.state){
          case KEY_STATE.UP:
            if(this.key_state_duration(key_state) >= this._time_until_released_becomes_not_used){
              key_state.set_state(KEY_STATE.NOT_USED, this._last_update_time);
            }
            break;
          case KEY_STATE.DOWN:
            if(this.key_state_duration(key_state) >= this._time_until_pressed_becomes_hold){
              key_state.set_state(KEY_STATE.HOLD, this._last_update_time);
            }
            break;
          default:
            break;
        }

      } else { // The real state did change

        switch(key_state.state)
        {
          case KEY_STATE.DOWN:
          case KEY_STATE.HOLD:
            if(!is_key_physically_down)
              key_state.set_state(KEY_STATE.UP, this._last_update_time);
            break;
          case KEY_STATE.UP:
          case KEY_STATE.NOT_USED:
            if(is_key_physically_down)
              key_state.set_state(KEY_STATE.DOWN, this._last_update_time);
            break;
          default:
            console.assert(false);
        }

      }
    }

    this._raw_states_changes.fill(undefined); // Reset until next update!
  }

  on_key_down(key_code){
    this._raw_states_changes[key_code] = true;
  }

  on_key_up(key_code){
    this._raw_states_changes[key_code] = false;
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

const input_update_queue = [];

function initialize(canvas_context) {
  console.assert(canvas_context);
  const canvas = canvas_context.canvas;
  console.assert(canvas);

  document.addEventListener("keydown", function(event) {
    event.preventDefault(); // without this, arrow keys scroll the browser!
    input_update_queue.push(()=> keyboard.on_key_down(event.keyCode, KEY_STATE.DOWN) );
  });

  document.addEventListener("keyup", function(event) {
    input_update_queue.push(()=> keyboard.on_key_up(event.keyCode) );
  });

  canvas.addEventListener('mousemove', function(event) {
    input_update_queue.push(()=> mouse.on_mouse_move(canvas_mouse_position(canvas, event)) );
  });

  canvas.addEventListener('mousedown', function(event) {
    input_update_queue.push(()=> mouse.on_mouse_button_down(event.button) );
  });

  canvas.addEventListener('mouseup', function(event) {
    input_update_queue.push(()=> mouse.on_mouse_button_up(event.button) );
  });

}

function update(delta_time){
  mouse.update(delta_time);
  keyboard.update(delta_time);
  while(input_update_queue.length != 0){
    const input_update = input_update_queue.shift();
    input_update();
  }
}
