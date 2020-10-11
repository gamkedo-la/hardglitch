// This file provides facilities to build a UI.
// It should contain only the elements that can be used, not the code specific
// to the UI you want to build.

export {
    UIElement,
    Pannel,
    Button,
    Text,
    HelpText,
    TextButton,
    Bar,
};

import * as audio from "./audio.js";
import * as graphics from "./graphics.js";
import {
    Vector2,
    Rectangle,
    is_intersection,
    Vector2_origin,
    center_in_rectangle,
    is_point_under,
} from "./spatial.js";
import { mouse, MOUSE_BUTTON } from "./input.js";
import { is_number } from "./utility.js";
import * as anim from "./animation.js";
import { tween } from "./tweening.js";
import { Color } from "./color.js";
import { sprite_defs } from "../game-assets.js";

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
    // ._on_update(delta_time) Must be implemented by child classes.
    update(delta_time) {
        this._on_update(delta_time);
        this.all_ui_elements.map(element => element.update(delta_time));
    }


    // Called by graphic systems to display this UI element.
    // ._on_draw(canvas_context) Must be implemented by child classes.
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
    allow_disabled_update = false; // Set true to allow updating this button when it is disabled.

    // Button parametters:
    // {
    //   (See UIElement constructor for more parametters.)
    //   sprite_def: ..., // graphics.Sprite definition to use, with all the frames defined.
    //   frames: { up: 0, down: 1, over: 2, disabled:3 }, // Which sprite frame for which situation. Use 0 for any unspecified frame.
    //   is_action_on_up: true, // If true, the action is triggered on releasing the button, not on pressing it. True if not specified.
    //   action: ()=> {}, // Function to call when you press that button. Calls nothing if undefined.
    //   sounds: { // Optional sounds to play when the state change.
    //      up: "sound_a", down: "sound_b", etc.
    //      action: "sound_x", // Sound to play before running the action associated with this button.
    //   },
    // }
    constructor(button_def){
        super(Object.assign(button_def, { width: 1, height: 1 })); // We ignore the width/height because it will be defined by the current frame of the sprite.
        console.assert(button_def.action instanceof Function);
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

        this.is_action_on_up = button_def.is_action_on_up !== undefined? button_def.is_action_on_up : true;

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
        if(!this.visible)
            return;
        if(!this.enabled && !this.allow_disabled_update)
            return;

        const mouse_is_over_now = this.is_mouse_over;

        if(this.enabled){
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
        }


        if(this._was_mouse_over != mouse_is_over_now){
            if(mouse_is_over_now)
                this._on_begin_over();
            else
                this._on_end_over();
        }

        if(this.enabled && mouse_is_over_now && !mouse.was_dragging){
            const is_time_to_trigger_action = this.is_action_on_up ? mouse.buttons.is_just_released(MOUSE_BUTTON.LEFT) : mouse.buttons.is_just_down(MOUSE_BUTTON.LEFT);
            if(is_time_to_trigger_action && this.action != undefined){
                this.action();
            }
        }

        this._sprite.update(delta_time);
    }

    action(){
        this._play_sound('action');
        this._action(this);
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
        this._play_sound(state_id);
        this._sprite.force_frame(this._frames[state_id]);
        super.area = this._sprite.area;
    }

    _on_draw(canvas_context){
        this._sprite.draw(canvas_context);
    }


    _on_up(){
        if(!this.enabled)
            return; // Ignore when disabled.
        this._state = ButtonState.UP;
        this._change_state('up');
    }

    _on_down(){
        if(!this.enabled)
            return; // Ignore when disabled.
        this._state = ButtonState.DOWN;
        this._change_state('down');
    }

    _on_begin_over(){
        this._was_mouse_over = true;
        if(!this.enabled)
            return; // Ignore when disabled.
        if(this.state == ButtonState.UP)
            this._change_state('over');
    }

    _on_end_over(){
        this._was_mouse_over = false;
        if(!this.enabled)
            return; // Ignore when disabled.
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


const line_jump = '\n';

// Displays some text with a background.
class Text extends UIElement {
    //
    //{
    //    text:"Blah blah", font: "Verdana 16pt", color:"#000000AA",
    //    background_color: "#11111111",
    //    margin_horizontal: 4, margin_vertical: 4
    //}
    constructor(text_def){
        console.assert(typeof(text_def.text)==="string");

        super(Object.assign(text_def, {
            width:1, height:1, // Width and height will be recalculated based on the real size of the text.
        }));
        this._text_lines = [];
        this._font_options = {
            font: text_def.font,
            color: text_def.color,
            stroke_color: text_def.stroke_color,
            text_align: text_def.text_align,
            text_baseline: text_def.text_baseline,
        };
        this._margin_horizontal = text_def.margin_horizontal ? text_def.margin_horizontal : 4;
        this._margin_vertical = text_def.margin_vertical ? text_def.margin_vertical : 4;
        this._background_color = text_def.background_color ? text_def.background_color : "#ffffffaa";

        this.text = text_def.text;

        this._reset();
    }

    get text(){ return this._text_lines; }
    set text(new_text){
        console.assert(typeof new_text === 'string' || new_text instanceof String);
        this._text_lines = new_text.split(line_jump).map(text_line => { return { text: text_line, line_height: 0 }; });
        this._request_reset = true;
    }

    get color() { return this._font_options.color; }
    set color(new_color) {
        console.assert(new_color instanceof Color || typeof new_color === "string");
        if(new_color instanceof Color){
            this._font_options.color = new_color.toString();
        } else {
            this._font_options.color = new_color;
        }
    }

    _reset(canvas_context = graphics.screen_canvas_context){
        console.assert(canvas_context);
        // Force resize to the actual size of the text graphically.
        // Also split the text according to max size if specified, and line jumps.

        const area_size = new Vector2();

        this._text_lines.forEach(text_line => {
            const text_metrics = graphics.measure_text(canvas_context, text_line.text, this._font_options );
            const actual_width = Math.abs(text_metrics.actualBoundingBoxLeft) + Math.abs(text_metrics.actualBoundingBoxRight);
            const actual_height = Math.abs(text_metrics.actualBoundingBoxAscent ) + Math.abs(text_metrics.actualBoundingBoxDescent);

            const line_height = actual_height + (this._margin_vertical * 2);
            const line_width = actual_width + (this._margin_horizontal * 2);
            area_size.x = Math.max(line_width, area_size.x);
            area_size.y += line_height;

            text_line.line_height = line_height;
        });

        this._area.size = area_size;

    }

    _on_update(delta_time){

    }

    _on_draw(canvas_context){
        if(this._request_reset)
            this._reset(canvas_context);

        if(this._text_lines.reduce((sum, text_line) => sum + text_line.text.length, 0) === 0){ // Draw nothing if there is no text to draw.
            return;
        }

        graphics.draw_rectangle(canvas_context, this.area, this._background_color);

        let line_position = this.position.translate({x:this._margin_horizontal, y:this._margin_vertical});
        this._text_lines.forEach(text_line => {
            if(text_line.text.length > 0)
                graphics.draw_text(canvas_context, text_line.text, line_position, this._font_options);
            line_position = line_position.translate({ y: text_line.line_height });
        });

    }
};


// Text that appear only when the parent is pointed.
class HelpText extends Text {

    // See Text, plus:
    // {
    //   area_to_help: rectangle  // The area that will display the helptext if pointed at
    //   delay_ms: 1000            // Time (default 1sec) before displaying the help-text once the area is being pointed.
    // }
    constructor(text_def, events){
        console.assert(text_def.area_to_help instanceof Rectangle);
        console.assert(text_def.delay_ms === undefined || Number.isInteger(text_def.delay_ms));
        super(text_def);
        this.visible = false;
        this._area_to_help = text_def.area_to_help;
        this._delay_ms = text_def.delay_ms !== undefined ? text_def.delay_ms : 1000;
        this._time_since_pointed = 0;
        this._events = events;
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
        const is_mouse_over_help_area = this.is_mouse_over_area_to_help;
        if(this.visible){
            if(!is_mouse_over_help_area || this._time_since_pointed < this._delay_ms){
                this.visible = false;
            }
        } else {
            if(is_mouse_over_help_area){
                if(this._time_since_pointed >= this._delay_ms)
                    this.visible = true;
                else
                    this._time_since_pointed += delta_time;
            } else {
                this._time_since_pointed = 0;
            }
        }

        if(this._events !== undefined && is_mouse_over_help_area){
            this._events.on_mouse_over(this);
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
        if (panel_def.width === undefined) panel_def.width = 0;
        if (panel_def.height === undefined) panel_def.height = 0;
        super(panel_def);
        if (panel_def.sprite) {
            let sprite_def = sprite_defs[panel_def.sprite];
            if (sprite_def) {
                this.sprite = new graphics.Sprite(sprite_def);
                if (panel_def.scale) {
                    this.sprite.transform.scale = panel_def.scale;
                }
            }
        }
    }

    _on_update(delta_time) {
        if (this.sprite) {
            this.sprite.update(delta_time);
        }
    }

    _on_draw(canvas_context) {
        if (this.sprite) {
            this.sprite.draw(canvas_context);
        }
    }
}

// Window with a background, can contain
class Window extends UIElement {
    background = new Pannel({
        width:0, 
        height:0, 
        position: Vector2_origin,
    });
};


class Bar extends UIElement {

    // example = new HorizontalBar({
    //     position: { x: 123, y: 123 },
    //     width: 123,
    //     height: 20,
    //     is_horizontal_bar: true,             // True if the bar behaves as horizontal, false for vertical
    //     bar_colors: {
    //         background: "#0000ff",       // Color used for values that are higher than the current value.
    //         change_positive: "#ffffff",           // Color used to mark the difference from before when the value changed.
    //         change_negative: "#ff0000",           // Color used to mark the difference from before when the value changed.
    //         preview: "#ff00ff",           // Color used to preview the cost of actions.
    //         value: "#00ff00",            // Color used for the values that are lower or equal to the current value.
    //     },
    //     min_value: 0, // Minimum value that can be represented by the bar (the value can go below, it'll just not be visible).
    //     max_value: 0, // Maximum value that can be represented by the bar (the value can go over, it'll just not be visible).
    //     value: 50,    // Current value
    //     bar_name: "Health", // Text to use when displaying the helptext.
    //     change_delay_ms: 0, // Milliseconds after a value change after which we start animation the change bar.
    //     change_duration_ms: 0, // Duration in milliseconds of the change bar animation.
    //     helptext: { ... } // Parameters for the helptext.
    // });
    constructor(bar_def){
        super(bar_def);

        const default_bar_colors = {
            background: "#0000ff",       // Color used for values that are higher than the current value.
            change_positive: "#ffffff",  // Color used to mark the difference from before when the value changed.
            change_negative: "#ff0000",  // Color used to mark the difference from before when the value changed.
            preview: "#ff00ff",          // Color used to preview the cost of actions.
            value: "#00ff00",            // Color used for the values that are lower or equal to the current value.
        };

        this.colors = Object.assign(default_bar_colors, bar_def.bar_colors);
        this.change_delay_ms = bar_def.change_delay_ms !== undefined ? bar_def.change_delay_ms : 500;
        console.assert(Number.isInteger(this.change_delay_ms));
        this.change_duration_ms = bar_def.change_duration_ms !== undefined ? bar_def.change_duration_ms : 800;
        console.assert(Number.isInteger(this.change_duration_ms));
        this._min_value = bar_def.min_value !== undefined ? bar_def.min_value : 0;
        console.assert(Number.isInteger(this._min_value));
        this._max_value = bar_def.max_value !== undefined ? bar_def.max_value : 100;
        console.assert(Number.isInteger(this._max_value));
        this._value = bar_def.value !== undefined ? bar_def.value : 50;
        console.assert(Number.isInteger(this._value));
        this._name = bar_def.bar_name;
        console.assert(typeof this._name === "string");
        this._is_horizontal_bar = bar_def.is_horizontal_bar ? bar_def.is_horizontal_bar : true;
        console.assert(typeof this._is_horizontal_bar === "boolean");
        this._animations = new anim.AnimationGroup();
        this._text_always_visible = false;

        if(this._is_horizontal_bar === false)
            throw "VERTICAL BARS NOT IMPLEMENTED YET";

        const center_position = this.area.center;
        this.helptext = new HelpText(Object.assign({
            text: this._name,
            area_to_help: this.area,
            delay_ms: 0,
            position: this.position,
        }, bar_def.help_text));

        this.short_text = new Text(Object.assign({
            text: this._name,
            position: this.position,
        }, bar_def.help_text));

        this._require_update = true;
    }

    get value() { return this._value; }
    set value(new_value){
        console.assert(typeof new_value === "number");
        if(new_value !== this._value){
            this._previous_value = this._value;
            this._value = new_value;
            this._require_update = true;
        }
    }

    get max_value() { return this._max_value; }
    set max_value(new_value){
        console.assert(typeof new_value === "number");
        if(new_value != this._max_value){
            console.assert(new_value >= this.min_value);
            this._max_value = new_value;
            this._require_update = true;
        }
    }

    get min_value() { return this._min_value; }
    set min_value(new_value){
        console.assert(typeof new_value === "number");
        if(new_value != this._min_value){
            console.assert(new_value <= this.max_value);
            this._min_value = new_value;
            this._require_update = true;
        }
    }

    get helptext_always_visible() { return this._text_always_visible; }
    set helptext_always_visible(must_be_visible) {
        console.assert(typeof must_be_visible === "boolean");
        this._text_always_visible = must_be_visible;
    }

    get range_length() { return this._max_value - this._min_value; }
    get value_ratio() { return this._ratio(this._value, this._min_value); }

    _ratio(value){
        return (value - this._min_value) / this.range_length;
    }

    _on_update(delta_time){

        this._animations.update(delta_time);

        if(!this._require_update)
            return;

        this._value_rect = new Rectangle(this.area);
        this._value_rect.width = Math.max(this.value_ratio, 0) * this._value_rect.width;

        // Check if we changed the value, if yes we have to udpate the change bar
        if(this._previous_value !== undefined){
            this._cancel_change_animation();
            this._current_change_animation_promise = this._animations.play(this._change_animation(this._previous_value, this.value));
            console.assert(this._current_change_animation_promise.cancel instanceof Function);
            this._current_change_animation_promise.then(()=>{
                this._cancel_change_animation();
            });
            delete this._previous_value;
        }

        this._update_text();

        // this._require_update = false; // FIXME: reactivating this will cause some graphic issues.
    }

    _replace_helptext(){
        this.helptext.position = center_in_rectangle(this.helptext.area, this.area).position;
        this.short_text.position = center_in_rectangle(this.short_text.area, this.area).position;
    }

    _update_text(){

        if(this.preview_value !== undefined){
            const difference = this.preview_value - this.value;
            const preview_text = ` (${difference}) ${this.preview_value} / ${this.max_value}`;
            this.helptext.text = `${this._name} ${preview_text}`;
            this.short_text.text = preview_text;
        } else {
            const value_text = `${this.value} / ${this.max_value}`;
            this.helptext.text =  `${this._name} ${value_text}`;
            this.short_text.text = value_text;
        }

        this._replace_helptext();
    }

    _cancel_change_animation(){
        delete this._change_rect;
        if(this._current_change_animation_promise){
            this._current_change_animation_promise.cancel();
            delete this._current_change_animation_promise;
        }
    }

    _clamp_to_visible(value){
        if(value < this.min_value)
            value = this.min_value;
        if(value > this.max_value)
            value = this.max_value;
        return value;
    }


    graphic_width(value){
        return this._ratio(value) * this.area.width;
    };

    *_change_animation(previous_value, current_value){
        previous_value = this._clamp_to_visible(previous_value);
        current_value = this._clamp_to_visible(current_value);

        if(previous_value === current_value)
            return;

        if(previous_value > current_value){
            this.colors.change = this.colors.change_negative;
        } else {
            this.colors.change = this.colors.change_positive;
        }


        const previous_x = this.graphic_width(previous_value);
        const current_x = this.graphic_width(current_value);
        const min_x = Math.min(previous_x, current_x);
        const max_x = Math.max(previous_x, current_x);
        const change_width = max_x - min_x;

        const change_rect = new Rectangle({
            position : this._value_rect.position.translate({ x: min_x, y: 0 }),
            width: change_width,
            height: this._value_rect.height,
        });
        this._change_rect = change_rect;

        yield* anim.wait(this.change_delay_ms);
        yield* tween(change_width, 0, this.change_duration_ms, (value) => {
            const previous_width = change_rect.width;
            change_rect.width = value;
            if(previous_x < current_x){
                const width_diff = previous_width - value;
                change_rect.position = change_rect.position.translate({ x: width_diff, y:0 });
            }
        });

        delete this._change_rect;
    }

    _on_draw(canvas_context) {
        graphics.draw_rectangle(canvas_context, this.area, this.colors.background);
        graphics.draw_rectangle(canvas_context, this._value_rect, this.colors.value);
        if(this._change_rect){
            graphics.draw_rectangle(canvas_context, this._change_rect, this.colors.change);
        } else if(this._preview_rect){
            graphics.draw_rectangle(canvas_context, this._preview_rect, this.colors.preview);
        }

        if(this._text_always_visible){
            this.short_text.visible = !this.helptext.visible; // Display the short text if we are not displaying the helptext already.
        }
    }

    show_preview_value(value){
        if(value === undefined || !this._value_rect)
            return;

        this.hide_preview_value();

        const current_value = this._clamp_to_visible(this.value);
        const preview_value = this._clamp_to_visible(value);

        if(current_value === preview_value)
            return;

        this.preview_value = value;

        const current_x = this.graphic_width(current_value);
        const preview_x = this.graphic_width(preview_value);
        const min_x = Math.min(current_x, preview_x);
        const max_x = Math.max(current_x, preview_x);
        const preview_width = max_x - min_x;

        this._preview_rect = new Rectangle({
            position : this._value_rect.position.translate({ x: min_x, y: 0 }),
            width: preview_width,
            height: this._value_rect.height,
        });

        this._require_update = true;
    }

    hide_preview_value(){
        delete this._preview_rect;
        delete this.preview_value;
        this._require_update = true;
    }

}

