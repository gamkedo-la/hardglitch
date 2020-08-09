// This file provides facilities to build a UI.
// It should contain only the elements that can be used, not the code specific
// to the UI you want to build.

export {
    UIElement,
    Button,
    Text,
    HelpText,
    TextButton,
};

import * as audio from "./audio.js";
import * as graphics from "./graphics.js";
import { Vector2, Rectangle, is_intersection, Vector2_origin, center_in_rectangle } from "./spatial.js";
import { mouse, MOUSE_BUTTON } from "./input.js";
import { is_number } from "./utility.js";

function is_point_under(position, area, origin){
    console.assert(position.x != undefined && position.y != undefined );
    console.assert(area);
    console.assert(origin);
    const real_position = (new Vector2(position)).translate(origin);
    return is_intersection(area, { position: real_position, width:0, height:0 });
}

function is_mouse_pointing(area, origin){
    console.assert(area);
    console.assert(origin);
    return is_point_under(mouse.position, area, origin);
}

class UIElement {
    draw_debug = false;

    // UI Element definition:
    // {
    //   parent: null, // Canvas if null
    //   position: { x: 0, y: 0 } // Position relative to the parent
    //   width: 20,
    //   height: 20,
    //   visible: true, // Is it visible from the beginning? Visibility imply being able to interrect. True by default.
    //   enabled: true, // Is it enabled from the beginning? If not and visible, it cannot be interracted with but is visible. True by default.
    //   in_screenspace: true // Handle the element as if in screen space if true (default), in the game's space otherwise.
    // }
    constructor(def){
        console.assert(is_number(def.height));
        console.assert(is_number(def.width));
        this._visible = def.visible == undefined ? true : def.visible;
        this._enabled = def.enabled == undefined ? true : def.enabled;
        this._in_screenspace = def.in_screenspace == undefined ? true : def.in_screenspace;
        this._area = new Rectangle({
            position: def.position, width: def.width, height: def.height,
        });
    }

    get parent_area(){ return this.parent ? this.parent.area : graphics.canvas_rect(); }

    get visible() { return this._visible; }
    set visible(new_visible){
        const previous_visible = this._visible;
        if(new_visible != previous_visible){
            this._visible = new_visible;
            if(new_visible)
                this._on_visible();
            else
                this._on_hidden();
        }
    }

    get enabled() { return this._enabled; }
    set enabled(new_enabled){
        const previous_enabled = this._enabled;
        if(new_enabled != previous_enabled){
            this._enabled = new_enabled;
            if(new_enabled)
                this._on_enabled();
            else
                this._on_disabled();
        }
    }


    get position() { return new Vector2(this._area.position); }
    set position(new_position) { this._area.position = new Vector2(new_position);  }

    get width() { return this._area.width; }
    get height() { return this._area.height; }
    get area () { return new Rectangle(this._area); }
    set area (new_area) {
        console.assert(new_area instanceof Rectangle);
        this._area = new_area;
    }

    get in_screenspace() { return this._in_screenspace; }
    set in_screenspace(is_it) { this._in_screenspace = is_it; }

    get _space_origin() { return this.in_screenspace ? Vector2_origin : graphics.camera.position; }

    is_intersecting(rect){
        return is_intersection(this._area, rect, this._space_origin);
    }

    is_under(position){
        return is_point_under(position, this._area, this._space_origin);
    }

    get is_mouse_over(){ return is_mouse_pointing(this._area, this._space_origin); }

    get all_ui_elements() { return Object.values(this).filter(element => element instanceof UIElement || element instanceof graphics.Sprite); }

    // Called each frame to update the state of the UI element.
    // _on_update() Must be implemented by child classes.
    update(delta_time) {
        this._on_update(delta_time);
        this.all_ui_elements.map(element => element.update(delta_time));
    }


    // Called by graphic systems to display this UI element.
    // Must be implemented by child classes.
    draw(canvas_context) {
        console.assert(canvas_context);
        if(!this.visible)
            return; // TODO: this is not optimal, a better way would be for the thing owning this to have visible elements in an array and non-visible in another array, and only call draw on the visible ones.

        this._on_draw(canvas_context);
        this.all_ui_elements.map(element => element.draw(canvas_context));

        if(this.draw_debug){
            graphics.draw_rectangle(canvas_context, this._area, "#ff00ff");
        }
    }

    // Called when this.visible is changed from hidden (false) to visible (true).
    _on_visible(){  }

    // Called when this.visible is changed from visible (true) to hidden (false).
    _on_hidden(){  }

    // Called when this.enabled is changed from disabled (false) to enabled (true).
    _on_enabled(){  }

    // Called when this.enabled is changed from enabled (true) to disabled (false).
    _on_disabled(){  }

};

const ButtonState = {
    UP: 0, DOWN: 1
};


// Can be clicked to trigger something.
class Button extends UIElement {

    // Button parametters:
    // {
    //   (See UIElement constructor for more parametters.)
    //   sprite_def: ..., // graphics.Sprite definition to use, with all the frames defined.
    //   frames: { up: 0, down: 1, over: 2, disabled:3 }, // Which sprite frame for which situation. Use 0 for any unspecified frame.
    //   is_action_on_up: false, // If true, the action is triggered on releasing the button, not on pressing it. False if not specified.
    //   action: ()=> {}, // Function to call when you press that button. Calls nothing if undefined.
    //   sounds: { // Optional sounds to play when the state change.
    //      up: "sound_a", down: "sound_b", etc.
    //      action: "sound_x", // Sound to play before running the action associated with this button.
    //   },
    // }
    constructor(button_def){
        super(Object.assign(button_def, { width: 1, height: 1 })); // We ignore the width/height because it will be defined by the current frame of the sprite.
        this._sprite = new graphics.Sprite(button_def.sprite_def);
        this._sprite.position = super.position;
        const frames = button_def.frames;
        if(frames != undefined){
            this._frames = {
                up: frames.up != undefined ? frames.up : 0,
                down: frames.down != undefined ? frames.down : 0,
                over: frames.over != undefined ? frames.over : 0,
                disabled: frames.disabled != undefined ? frames.disabled : 0,
            };
        } else {
            if(this._sprite.frames.length === 4)
                this._frames = { up:0, down:1, over:2, disabled:3 };
            else
                this._frames = { up:0, down:0, over:0, disabled:0 };
        }

        this._sounds = button_def.sounds;

        this.is_action_on_up = button_def.is_action_on_up !== undefined? button_def.is_action_on_up : false;

        this._action = button_def.action;

        this._was_mouse_over = false;
        this._on_up();
    }

    // We want the size, position etc of this object to be relative to the sprite.
    get area(){ return this._sprite.area; }
    set area(new_area){
        console.assert(new_area instanceof Rectangle);
        super.area = new_area;
        this._sprite.area = new_area;
    }
    set position(new_position){
        super.position = new_position;
        this._sprite.position = new_position;
    }
    get position() { return super.position; }

    get state() { return this._state; }

    _on_update(delta_time){
        if(!this.visible || !this.enabled)
            return;

        const mouse_is_over_now = this.is_mouse_over;

        switch(this.state){
            case ButtonState.UP:
                if(mouse.buttons.is_down(MOUSE_BUTTON.LEFT) && mouse_is_over_now){
                    this._on_down();
                }
                break;
            case ButtonState.DOWN:
                if(mouse.buttons.is_up(MOUSE_BUTTON.LEFT) || !mouse_is_over_now){
                    this._on_up();
                }
                break;
        }

        if(this._was_mouse_over != mouse_is_over_now){
            if(mouse_is_over_now)
                this._on_begin_over();
            else
                this._on_end_over();
        }

        if(mouse_is_over_now){
            const is_time_to_trigger_action = this.is_action_on_up ? mouse.buttons.is_just_released(MOUSE_BUTTON.LEFT) : mouse.buttons.is_just_down(MOUSE_BUTTON.LEFT);
            if(is_time_to_trigger_action && this.action != undefined){
                this.action();
            }
        }

        this._sprite.update(delta_time);
    }

    action(){
        this._play_sound('action');
        this._action();
    }

    _play_sound(state_id){
        console.assert(state_id == 'up' || state_id == 'down' || state_id == 'over' || state_id == 'disabled' || state_id == 'action' );
        if(this._sounds !== undefined) {
            const sound_id = this._sounds[state_id];
            if(sound_id !== undefined){
                audio.playEvent(sound_id);
            }
        }
    }

    _change_state(state_id){
        console.assert(state_id == 'up' || state_id == 'down' || state_id == 'over' || state_id == 'disabled');
        this._sprite.force_frame(this._frames[state_id]);
        super.area = this._sprite.area;
        this._play_sound(state_id);
    }

    _on_draw(canvas_context){
        this._sprite.draw(canvas_context);
    }


    _on_up(){
        this._state = ButtonState.UP;
        this._change_state('up');
    }

    _on_down(){
        this._state = ButtonState.DOWN;
        this._change_state('down');
    }

    _on_begin_over(){
        this._was_mouse_over = true;
        if(this.state == ButtonState.UP)
            this._change_state('over');
    }

    _on_end_over(){
        this._was_mouse_over = false;
        if(this.state == ButtonState.UP)
            this._change_state('up');
    }

    _on_enabled(){
        switch(this._state){
            case ButtonState.UP:
                this._on_up();
                break;
            case ButtonState.DOWN:
                this._on_down();
                break;
        }
    }

    _on_disabled(){
        this._change_state('disabled');
    }

};

// Displays some text with a background.
class Text extends UIElement {
    //
    //{
    //    text:"Blah blah", font: "Arial 16pt", color:"#000000AA",
    //    background_color: "#11111111",
    //    margin_horizontal: 4, margin_vertical: 4
    //}
    constructor(text_def){
        console.assert(typeof(text_def.text)==="string");

        super(Object.assign(text_def, {
            width:1, height:1, // Width and height will be recalculated based on the real size of the text.
        }));
        this._text = text_def.text;
        this._font = text_def.font;
        this._color = text_def.color;
        this._margin_horizontal = text_def.margin_horizontal ? text_def.margin_horizontal : 4;
        this._margin_vertical = text_def.margin_vertical ? text_def.margin_vertical : 4;
        this._background_color = text_def.background_color ? text_def.background_color : "#ffffffaa";

        this._reset();
    }

    get text(){ return this._text; }
    set text(new_text){
        console.assert(typeof new_text === 'string');
        this._text = new_text;
        this._request_reset = true;
    }

    _reset(canvas_context = graphics.screen_canvas_context){
        console.assert(canvas_context);
        // Force resize to the actual size of the text graphically.
        const text_metrics = graphics.measure_text(canvas_context, this._text, this._font, this._color);
        const actual_width = Math.abs(text_metrics.actualBoundingBoxLeft) + Math.abs(text_metrics.actualBoundingBoxRight);
        const actual_height = Math.abs(text_metrics.actualBoundingBoxAscent ) + Math.abs(text_metrics.actualBoundingBoxDescent);
        this._area.size = new Vector2({
            x: actual_width + (this._margin_horizontal * 2),
            y: actual_height + (this._margin_vertical * 2)
        });
    }

    _on_update(delta_time){

    }

    _on_draw(canvas_context){
        if(this._request_reset)
            this._reset(canvas_context);
        graphics.draw_rectangle(canvas_context, this.area, this._background_color);
        graphics.draw_text(canvas_context, this._text, this.position.translate({x:this._margin_horizontal, y:this._margin_vertical}), this._font, this._color);
    }
};

// Text that appear only when the parent is pointed.
class HelpText extends Text {

    // See Text, plus:
    // {
    //   area_to_help: rectangle  // The area that will display the helptext if pointed at
    //   delay_ms: 1000            // Time (default 1sec) before displaying the help-text once the area is being pointed.
    // }
    constructor(text_def){
        console.assert(text_def.area_to_help instanceof Rectangle);
        console.assert(text_def.delay_ms === undefined || Number.isInteger(text_def.delay_ms));
        super(text_def);
        this.visible = false;
        this._area_to_help = text_def.area_to_help;
        this._delay_ms = text_def.delay_ms !== undefined ? text_def.delay_ms : 1000;
        this._time_since_pointed = 0;
    }

    get is_mouse_over_area_to_help(){
        return is_mouse_pointing(this._area_to_help, this._space_origin);
    }

    set area_to_help(new_area){
        console.assert(new_area instanceof Rectangle);
        this._area_to_help = new_area;
        this._time_since_pointed = 0;
    }

    _on_update(delta_time){
        super._on_update(delta_time);
        if(this.visible){
            if(!this.is_mouse_over_area_to_help || this._time_since_pointed < this._delay_ms){
                this.visible = false;
            }
        } else {
            if(this.is_mouse_over_area_to_help){
                if(this._time_since_pointed >= this._delay_ms)
                    this.visible = true;
                else
                    this._time_since_pointed += delta_time;
            } else {
                this._time_since_pointed = 0;
            }
        }
    }
};

class TextButton extends Button {
    constructor(textbutton_def){
        super(textbutton_def);
        this.textbox = new Text(Object.assign(textbutton_def, {
            position: this.position,
            background_color: textbutton_def.background ? textbutton_def.background : "#ffffff00"
        }));
        this.position = this.position;
    }

    get position() { return super.position; }
    set position(new_pos){
        super.position = new_pos;
        // TEMPORARY: just center the text in the button display
        this.textbox.area = center_in_rectangle(this.textbox.area, this.area);
    }

}

class Pannel extends UIElement {

    constructor(panel_def){

    }
}

// Window with a background, can contain
class Window extends UIElement {
    background = new Pannel();

};

