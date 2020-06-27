// This file provides facilities to build a UI.
// It should contain only the elements that can be used, not the code specific
// to the UI you want to build.

export {
    UIElement,
    Button,
};

import { Vector2, Rectangle, is_intersection } from "./spatial.js";
import { Sprite, draw_rectangle, canvas_rect } from "./graphics.js";
import { mouse, MOUSE_BUTTON } from "./input.js";
import { is_number } from "./utility.js";

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
    // }
    constructor(def){
        console.assert(is_number(def.height));
        console.assert(is_number(def.width));
        this._visible = def.visible == undefined ? true : def.visible;
        this._enabled = def.enabled == undefined ? true : def.enabled;
        this._area = new Rectangle({
            position: def.position, width: def.width, height: def.height,
        });
    }

    get parent_area(){ return this.parent ? this.parent.area : canvas_rect(); }

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

    is_under(position){
        console.assert(position.x != undefined && position.y != undefined );
        return is_intersection(this._area, { position:position, width:0, height:0 });
    }

    is_intersecting(rect){
        return is_intersection(this._area, rect);
    }

    get is_mouse_over(){ return this.is_under(mouse.position); }

    get all_ui_elements() { return Object.values(this).filter(element => element instanceof UIElement || element instanceof Sprite); }

    // Called each frame to update the state of the UI element.
    // _on_update() Must be implemented by child classes.
    update(delta_time) {
        if(!this.visible || !this.enabled)
            return;
        this._on_update(delta_time);
        this.all_ui_elements.map(element => element.update(delta_time));
    }


    // Called by graphic systems to display this UI element.
    // Must be implemented by child classes.
    draw() {
        if(!this.visible)
            return; // TODO: this is not optimal, a better way would be for the thing owning this to have visible elements in an array and non-visible in another array, and only call draw on the visible ones.

        this._on_draw();
        this.all_ui_elements.map(element => element.draw());

        if(this.draw_debug){
            draw_rectangle(this._area, "#ff00ff");
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

// Group of UI elements that must work together.
// We assume that the members which inherits from UIElement are the elements of the group.
class UIElementGroup extends UIElement {

    get all_ui_elements() { return Object.values(this).filter(element => element instanceof UIElement); }

    _on_update(delta_time){
        this.all_ui_elements.map(element => element.update(delta_time));
    }

    _on_draw(){
        this.all_ui_elements.map(element => element.draw());
    }

    _on_visible(){  }

    _on_hidden(){  }

    _on_enabled(){  }

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
    //   sprite_def: ..., // Sprite definition to use, with all the frames defined.
    //   frames: { up: 0, down: 1, over: 2, disabled:3 }, // Which sprite frame for which situation. Use 0 for any unspecified frame.
    //   is_action_on_up: false, // If true, the action is triggered on releasing the button, not on pressing it. False if not specified.
    //   action: ()=> {}, // Function to call when you press that button. Calls nothing if undefined.
    // }
    constructor(button_def){
        super(button_def);
        this._sprite = new Sprite(button_def.sprite_def);
        this._sprite.position = this.position;
        const frames = button_def.frames;
        if(frames != undefined){
            this._frames = {
                up: frames.up != undefined ? frames.up : 0,
                down: frames.down != undefined ? frames.down : 0,
                over: frames.over != undefined ? frames.over : 0,
                disabled: frames.disabled != undefined ? frames.disabled : 0,
            };
        } else {
            this._frames = { up:0, down:0, over:0, disabled:0 };
        }


        this.is_action_on_up = button_def.is_action_on_up != undefined? button_def.is_action_on_up : false;
        this.action = button_def.action;

        this._was_mouse_over = false;
        this._on_up();
    }

    get state() { return this._state; }

    _on_update(delta_time){
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

        this._sprite.position = this.position;
        this._sprite.update(delta_time);
    }

    _on_draw(){
        this._sprite.draw();
    }


    _on_up(){
        this._state = ButtonState.UP;
        this._sprite.force_frame(this._frames.up);
    }

    _on_down(){
        this._state = ButtonState.DOWN;
        this._sprite.force_frame(this._frames.down);
    }

    _on_begin_over(){
        this._was_mouse_over = true;
        if(this.state == ButtonState.UP)
            this._sprite.force_frame(this._frames.over);
    }

    _on_end_over(){
        this._was_mouse_over = false;
        if(this.state == ButtonState.UP)
            this._sprite.force_frame(this._frames.up);
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
        this._sprite.force_frame(this._frames.disabled);
    }

};

// Displays some text with a background.
class Text extends UIElement {
    constructor(text, font, color){
        super()
    }

    _on_draw(){

    }
};

class Pannel extends UIElement {

    constructor(panel_def){

    }
}

// Window with a background, can contain
class Window extends UIElement {
    background = new Pannel();

};

