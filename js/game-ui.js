// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
    MuteAudioButton,
    AudioSettings,
};

import { group_per_type } from "./system/utility.js";
import * as audio from "./system/audio.js"
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import { sprite_defs } from "./game-assets.js";
import * as concepts from "./core/concepts.js";
import * as texts from "./definitions-texts.js";
import { play_action, mouse_grid_position, KEY } from "./game-input.js";
import { keyboard, mouse, MOUSE_BUTTON } from "./system/input.js";
import { Vector2, center_in_rectangle, Rectangle } from "./system/spatial.js";
import { CharacterStatus } from "./ui/ui-characterstatus.js";
import { InventoryUI } from "./ui/ui-inventory.js";
import { InfoBox, show_info } from "./ui/ui-infobox.js";
import { Timeline } from "./ui/ui-timeline.js";

const action_button_size = 50;
const player_ui_top_from_bottom = 66;

const volume_buttons_font = "26px Space Mono";
const volume_buttons_name_font = "22px Space Mono";

function character_status_position() {
    return new Vector2({ x: 8, y: graphics.canvas_rect().height - player_ui_top_from_bottom });
}

function inventory_position() {
    return new Vector2({ x:0, y: character_status_position().y - 10 });
}

function timeline_position() {
    const canvas_rect = graphics.canvas_rect();
    return new Vector2({ x:canvas_rect.width - 80, y: 100 });
}

function infobox_rectangle() {
    const canvas_rect = graphics.canvas_rect();
    const width = 320;
    const height = 200;
    return new Rectangle({
        position: { x: canvas_rect.width - width, y: canvas_rect.height - height },
        width, height,
    });
}

class ActionButton extends ui.Button {
    constructor(position, icon_def, action_name, key_name, info_desc, on_clicked, on_begin_mouse_over, on_end_mouse_over){
        super({
            position: position,
            sprite_def: sprite_defs.button_select_action,
            action: on_clicked,
            sounds:{
                over: 'actionSelect',
            }
        });
        console.assert(typeof info_desc === "string");
        console.assert(on_begin_mouse_over instanceof Function);
        console.assert(on_end_mouse_over instanceof Function);
        this.on_begin_mouse_over = on_begin_mouse_over;
        this.on_end_mouse_over = on_end_mouse_over;

        this.icon = new graphics.Sprite(icon_def);
        this.icon.position = center_in_rectangle(this.icon, this.area).position;

        if(key_name !== ""){
            this.key_label = new ui.Text({
                text: key_name,
                font: "12px Space Mono",
            });
            this.key_label.position = this.position.translate({
                x: this.width - this.key_label.width,
                y: this.height - this.key_label.height,
            });
        }

        this.help_text = new ui.HelpText({
            area_to_help: this.area,
            text: action_name,
            delay_ms: 0, // Display the help text immediately when pointed.
        }, {
            on_mouse_over: ()=> { show_info(info_desc); }
        });
        this.help_text.position = this.position.translate({x:0, y: -this.help_text.height - 4 });
    }

    _on_begin_over(){
        super._on_begin_over();
        this.on_begin_mouse_over();
    }

    _on_end_over(){
        super._on_end_over();
        this.on_end_mouse_over();
    }
};


class CancelActionButton extends ui.Button {
    constructor(action){
        super({ // TODO: add a way to identify the action visually, text + icon
            position: { x: 0, y: 0 },
            sprite_def: sprite_defs.button_cancel_action_target_selection,
            visible: false,
            action: action,
        });

        this.icon = new graphics.Sprite(sprite_defs.icon_action_cancel);

        this.help_text = new ui.HelpText({
            area_to_help: this.area,
            text: "Cancel",
            delay_ms: 0,
        },{
            on_mouse_over: ()=> { if(this.visible) show_info(texts.ui.cancel_action) },
        });

    }

    set position(new_pos){
        super.position = new_pos;
        this.help_text.position = super.position.translate({x:0, y: -this.help_text.height - 4 });
        this.help_text.area_to_help = this.area;
        this.icon.position = center_in_rectangle(this.icon, this.area).position;
    }

    get position() { return super.position; }

};

class MuteAudioButton extends ui.Button {
    constructor() {
        super({
            sprite_def: sprite_defs.button_mute_audio,
            action: audio.toggleMute,
            position: {x: 0, y: 0},
            sounds:{
                over: 'actionSelect'
            }
        });

        this.icons = {
            mute: new graphics.Sprite(sprite_defs.icon_volume_mute),
            unmute: new graphics.Sprite(sprite_defs.icon_volume_unmute),
        };

        this.help_text = new ui.HelpText({
            position: { x: 0, y: this.height },
            width: this.width, height: this.height,
            area_to_help: this.area,
            text: "Mute",
            delay_ms: 0,
        },{
            on_mouse_over: ()=> show_info(texts.ui.mute_button),
        });

        this.position = { x: 0, y: 0 };
    }

    _on_update(delta_time){
        if(audio.is_muted())
            this.icon = this.icons.mute;
        else
            this.icon = this.icons.unmute;
        super._on_update(delta_time);
    }


    get position() { return super.position; }
    set position(new_pos){
        super.position = new_pos;
        const icon_position = center_in_rectangle(this.icons.mute, this.area).position;

        this.icons.mute.position = icon_position;
        this.icons.unmute.position = icon_position;
        this.help_text.area_to_help = this.area;
    }

}

class AudioSettings extends ui.UIElement {
    constructor(def) {
        super({
            width: 192,
            height: 312,
            position: def.position,
        });

        let yOffset = 24;
        this.master_volume = new VolumeControl({
            position: new Vector2({x: this.position.x, y: this.position.y + yOffset}),
            mix_group: "Master",
            name: "Master Volume",
        });
        yOffset += 96;
        this.music_volume = new VolumeControl({
            position: new Vector2({x: this.position.x, y: this.position.y + yOffset}),
            mix_group: "Music",
            name: "Music Volume",
        });
        yOffset += 96;
        this.sfx_volume = new VolumeControl({
            position: new Vector2({x: this.position.x, y: this.position.y + yOffset}),
            mix_group: "SoundEffects",
            name: "FX Volume",
        });
    }

    _on_update(delta_time) {}
    _on_draw(canvas_context) {
        graphics.draw_rectangle(canvas_context, this.area, '#FFAD49');
    }
}

class VolumeControl extends ui.UIElement {
    constructor(def) {
        super({
            position: def.position,
            height: 104,
            width: 192,
        });

        this.label = new ui.Text( {
            position: new Vector2({x: 0, y: -42}),
            background_color: "#FFAD49",
            color: 'white',
            font: volume_buttons_name_font,
            text: def.name,
        });

        this.mix_group = def.mix_group;
        this.plus_button = new ui.TextButton({
            background: "#FFAD49",
            color: "#ffffff",
            text: "+",
            font: volume_buttons_font,
            action: () => {
                audio.setVolume(def.mix_group, null, 0.1)
                this._update_value(); // "this" is the VolumeControl class
            },
            position: new Vector2({x: 52, y: 0}),
            sprite_def: sprite_defs.button_audio_minus,
            sounds: {
                over: 'actionSelect',
                down: 'buffertest',
            }
        });

        this.minus_button = new ui.TextButton({
            background: "#FFAD49",
            color: "#ffffff",
            text: "-",
            font: volume_buttons_font,
            action: () => {
                audio.setVolume(def.mix_group, null, -0.1)
                this._update_value(); // "this" is the VolumeControl class
            },
            position: new Vector2({x: -52, y: 0}),
            sprite_def: sprite_defs.button_audio_minus,
            sounds: {
                over: 'actionSelect',
                down: 'buffertest',
            }
        });

        this.value = new ui.Text({
            position: new Vector2(),
            background_color: "#FFAD49",
            color: 'white',
            text: "100",
            text_align: 'center',
        });

        //ui.Text class currently does not handle text aligment or text baseline correctly
        this.value._margin_horizontal = this.value.area.size.x/2;
        this.value._request_reset = false; //Prevent ui.Text from resizing background area

        for (let element of Object.values(this).filter(e => e instanceof ui.UIElement)) {
            element.position = center_in_rectangle(element.area, this.area).position.translate(element.position);
        }

        this._update_value(); // Make sure we display the right values at the beginning.
    }

    _update_value() {
        this.value.text = Math.round(audio.getVolume(this.mix_group) * 100).toString();
        this.value._request_reset = false; //Prevent ui.Text from resizing background area
    }

    _on_update(delta_time) {}
    _on_draw(canvas_context) {}
}

class AutoFocusButton extends ui.Button {
    constructor(toggle_autofocus, is_autofocus_enabled) {
        super({
            sprite_def: sprite_defs.button_mute_audio,
            action: toggle_autofocus,
            sounds:{
                over: 'actionSelect',
                down: 'actionClick',
            }
        });

        this.is_autofocus_enabled = is_autofocus_enabled;

        this.icons = {
            on: new graphics.Sprite(sprite_defs.icon_action_observe),
        };

        this.help_text = new ui.HelpText({
            position: { x: 0, y: this.height },
            width: this.width, height: this.height,
            area_to_help: this.area,
            text: "Auto-Focus ([F] to focus manually)",
            delay_ms: 0,
        },{
            on_mouse_over: ()=> show_info(texts.ui.autofocus_button),
        });
    }

    _on_update(delta_time){
        if(this.is_autofocus_enabled())
            this.icon = this.icons.on;
        else
            this.icon = this.icons.off;
        super._on_update(delta_time);
    }

    get position() { return super.position; }
    set position(new_pos){
        super.position = new_pos;
        this.icons.on.position = center_in_rectangle(this.icons.on, this.area).position;
        this.help_text.area_to_help = this.area;
    }

}


class MenuButton extends ui.Button {
    constructor(open_menu) {
        super({
            sprite_def: sprite_defs.button_ingame_menu,
            action: open_menu,
            sounds:{
                over: 'actionSelect',
                down: 'clickButton',
            }
        });

        this.help_text = new ui.HelpText({
            area_to_help: this.area,
            text: "Menu [TAB]",
            delay_ms: 0,
        },{
            on_mouse_over: ()=> show_info(texts.ui.menu_button),
        });
    }

    get position() { return super.position; }
    set position(new_pos){
        super.position = new_pos;
        // this.icons.on.position = center_in_rectangle(this.icons.on, this.area).position;
        this.help_text.position = { x: graphics.canvas_rect().width - this.help_text.width, y: this.height };
        this.help_text.area_to_help = this.area;
    }
}



// The interface used by the player when inside the game.
// NOTE: it's a class instead of just globals because we need to initialize and destroy it
//       at specific times in the life of the game, and it's easier to do if its just an object.
class GameInterface {

    button_cancel_action_selection = new CancelActionButton(()=>{
            console.log("CANCEL ACTION BUTTON");
            this.cancel_action_target_selection();
            this.button_cancel_action_selection.visible = false;

    });

    character_status = new CharacterStatus(character_status_position());

    info_box = new InfoBox(infobox_rectangle());

    constructor(config){
        console.assert(config instanceof Object);
        console.assert(config.on_action_selection_begin instanceof Function);
        console.assert(config.on_action_selection_end instanceof Function);
        console.assert(config.on_action_pointed_begin instanceof Function);
        console.assert(config.on_action_pointed_end instanceof Function);
        console.assert(config.toggle_autofocus instanceof Function);
        console.assert(config.is_autofocus_enabled instanceof Function);
        console.assert(config.open_menu instanceof Function);
        console.assert(config.on_item_dragging_begin instanceof Function);
        console.assert(config.on_item_dragging_end instanceof Function);
        console.assert(config.view_finder instanceof Function);
        console.assert(config.visibility_predicate instanceof Function);
        this._action_buttons = [];
        this.config = config;

        this.on_canvas_resized();
    }

    get elements(){
        return [ // BEWARE: the order of the elements determine the order of update and DRAWING!
            this.inventory, this.character_status,
            ...Object.values(this).filter(element => element instanceof ui.UIElement),
            ...this._action_buttons,
            this.timeline,
            this.info_box, // Must always be last!
        ];
    }

    is_under(position){
        return this.elements.some(element => element.visible && element.is_under(position));
    }

    get is_mouse_over(){
        return this.elements.some(element => element.visible && element.is_mouse_over);
    }

    get is_selecting_action_target(){
        return this._selected_action !== undefined;
    }

    update(delta_time, current_character, world){
        this.elements.forEach(element => element.update(delta_time, current_character, world));
        this._handle_action_target_selection(delta_time);
    }

    display() {
        graphics.camera.begin_in_screen_rendering();
        this.elements.forEach(element => element.draw(graphics.screen_canvas_context));
        graphics.camera.end_in_screen_rendering();
    }

    show_action_buttons(possible_actions){
        console.assert(possible_actions instanceof Array);
        console.assert(possible_actions.every(action => action instanceof concepts.Action));

        this._action_buttons = []; // Clear the previous set of buttons.

        // We need to have 1 button per action type, then show targets when it's selected.
        // So first we gather these actions per types...
        const actions_per_types = group_per_type(possible_actions);

        // ... then we build the buttons with the associated informations.
        const action_entries = Object.entries(actions_per_types);
        const space_between_buttons = action_button_size;
        const canvas_rect = graphics.canvas_rect();
        const max_buttons_per_lines = Math.ceil(Math.ceil(canvas_rect.width / 4) / space_between_buttons);
        const base_line_y = canvas_rect.height - space_between_buttons;
        const base_line_x = graphics.centered_rectangle_in_screen(new Rectangle({
            size: {
                x: space_between_buttons * Math.min(action_entries.length, max_buttons_per_lines),
                y: space_between_buttons
            }
        })).position.x - space_between_buttons;

        this.action_buttons_top = base_line_y;
        let line_y = base_line_y;
        let line_x = base_line_x;
        const next_x = ()=> line_x += space_between_buttons;

        let key_number = 0;
        for(const [action_name, actions] of action_entries){
            if(key_number > 0 && key_number % max_buttons_per_lines === 0){
                line_y -= space_between_buttons;
                this.action_buttons_top = line_y;
                line_x = base_line_x;
            }
            const position = { x: next_x(), y: line_y };
            const first_action = actions[0];
            const action_range = first_action.range;
            console.assert(first_action instanceof concepts.Action);
            const key_name = key_number <= 10 ? `${key_number === 0 ? "SPACE" : (key_number === 10 ? 0 : key_number) }` : "";
            const action_description = texts.action_description(first_action);
            const action_button = new ActionButton(position, first_action.icon_def, action_name, key_name, action_description,
                (clicked_button)=>{ // on clicked
                    if(actions.length == 1 && first_action.target_position === undefined){ // No need for targets
                        play_action(first_action); // Play the action immediately
                    } else {
                        // Need to select an highlited target!
                        this.button_cancel_action_selection.position = clicked_button.cancel_button_position;
                        this._begin_target_selection(action_name, actions);
                    }
                    audio.playEvent('actionClick');
                    this.lock_actions(); // Can be unlocked by clicking somewhere there is no action target.
                },
                ()=> this.config.on_action_pointed_begin(action_range, actions.map(action=>action.target_position)),
                ()=> {
                    if(!this.is_mouse_over)
                        this.config.on_action_pointed_end();
                });
            this._action_buttons.push(action_button);
            ++key_number;
        }

        this._action_buttons.forEach(action_button => {
            action_button.help_text.position = { x: action_button.position.x, y: line_y - action_button.help_text.height };
            action_button.cancel_button_position = { x: action_button.position.x, y: line_y - this.button_cancel_action_selection.width };;
        });

    }

    play_action_button(action_key_number){
        console.assert(Number.isInteger(action_key_number));
        console.assert(!this.is_selecting_action_target);
        const action = this._action_buttons[action_key_number];
        if(action){
            action.action();
        }
    }

    lock_actions(){
        this._action_buttons.forEach(button => button.enabled = false);
        this.inventory.dragging_enabled = false;
    }

    unlock_actions(){
        this._action_buttons.forEach(button => button.enabled = true);
        this.inventory.dragging_enabled = true;
    }

    get selected_action() { return this._selected_action; }

    _begin_target_selection(action_name, actions){
        this._selected_action = { action_name, actions };
        this.config.on_action_selection_begin(this._selected_action);
        this.button_cancel_action_selection.visible = true;
    }

    _end_target_selection(action){
        console.assert(!action || action instanceof concepts.Action);
        this._selected_action = undefined;
        this.config.on_action_selection_end(action);
        this.button_cancel_action_selection.visible = false;
    }

    _handle_action_target_selection(delta_time){
        if(keyboard.is_just_down(KEY.ESCAPE) && this.is_selecting_action_target){
            this.cancel_action_target_selection();
            return;
        }

        if(this.is_selecting_action_target
         && mouse.buttons.is_just_down(MOUSE_BUTTON.LEFT)
         && !this.is_mouse_over
         ){
            const target_position = mouse_grid_position();
            if(target_position) {
                const selected_action_with_target = this.selected_action.actions.find(action=>action.target_position.equals(target_position));
                if(selected_action_with_target){
                    console.assert(selected_action_with_target instanceof concepts.Action);
                    this._end_target_selection(selected_action_with_target);
                    play_action(selected_action_with_target);
                }
            }
        }
    }

    cancel_action_target_selection(play_sound = true){
        // Cancel selection.
        if(play_sound)
            audio.playEvent('actionCancel');
        this.unlock_actions();
        this._end_target_selection();
    }

    on_canvas_resized(){
        // TODO: check if we need to do more.
        this.button_main_menu = new MenuButton(this.config.open_menu);
        this.button_main_menu.position = { x: graphics.canvas_rect().width - this.button_main_menu.width, y: 0 },
        this.button_auto_focus = new AutoFocusButton(this.config.toggle_autofocus, this.config.is_autofocus_enabled);
        this.button_auto_focus.position = this.button_auto_focus.position.translate({ x: this.button_auto_focus.width }); // Assuming the mute button is the same size as the auto-focus button
        this.character_status = new CharacterStatus(character_status_position());
        this.inventory = new InventoryUI(inventory_position(), this.character_status, this.config);
        this.timeline = new Timeline(timeline_position(), this.config.view_finder, this.config.visibility_predicate);
        this.info_box = new InfoBox(infobox_rectangle());
    }

};



