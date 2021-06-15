export {
    OptionsScreen,

}

import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import { KEY } from "./game-input.js";
import { ScreenFader } from "./system/screenfader.js";
import { AudioSettings } from "./game-ui.js";
import { sprite_defs } from "./game-assets.js";
import { Vector2 } from "./system/spatial.js";
import { invoke_on_members } from "./system/utility.js";

const particles_button_text = ()=> `Particles: ${window.game_config.enable_particles ? "On" : "Off"}`;
const status_bar_button_text = ()=> `Status Bar: ${window.game_config.enable_stats_bar_value_always_visible ? "Always" : "Auto"}`;
const cycle_message_button_text = ()=> `Cycle Message: ${window.game_config.enable_turn_message ? "On" : "Off"}`;
const timeline_button_text = ()=> `Timeline: ${window.game_config.enable_timeline ? "On" : "Off"}`;
const cycle_sound_button_text = ()=> `Cycle Sound: ${window.game_config.enable_turn_sound ? "On" : "Off"}`;
const infobox_button_text = ()=> `Infobox: ${window.game_config.enable_infobox ? "On" : "Off"}`;
const screens_fades_button_text = ()=> `Fade Screens: ${window.game_config.enable_screen_fades ? "On" : "Off"}`;

const button_text_font = "18px Space Mono";

class Options {
    constructor(on_back_button){

        this.title = new ui.Text({
            text: "OPTIONS",
            font: "60px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
        });

        this.title.position = {
                                x: graphics.canvas_center_position().translate({ x: -(this.title.width / 2), y: 8 }).x,
                                y: 8,
                              };

        this.back_button = new ui.TextButton({
            text: "Back To Title",
            action: on_back_button,
            position: {x:0, y:0},
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });
        this.back_button.position = {
                                        x: graphics.canvas_rect().width - this.back_button.width - 8,
                                        y: 8,
                                    };



        this.config_buttons = {
            particles_button: new ui.TextButton({
                text: particles_button_text(),
                font: button_text_font,
                action: (button)=>{
                    console.log("particles", window.game_config.enable_particles);
                    this.toggle_game_config('enable_particles');
                    button.text = particles_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            status_bar_button: new ui.TextButton({
                text: status_bar_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_stats_bar_value_always_visible');
                    button.text = status_bar_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            turn_message_button: new ui.TextButton({
                text: cycle_message_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_turn_message');
                    button.text = cycle_message_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            turn_sound_button: new ui.TextButton({
                text: cycle_sound_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_turn_sound');
                    button.text = cycle_sound_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            timeline_button: new ui.TextButton({
                text: timeline_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_timeline');
                    button.text = timeline_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            infobox_button: new ui.TextButton({
                text: infobox_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_infobox');
                    button.text = infobox_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            screens_fades_button: new ui.TextButton({
                text: screens_fades_button_text(),
                font: button_text_font,
                action: (button)=>{
                    this.toggle_game_config('enable_screen_fades');
                    button.text = screens_fades_button_text();
                },
                position: null,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),
            update: function(delta_time) {
                invoke_on_members(this, "update", delta_time);
            },

            draw: function(canvas_context) {
                invoke_on_members(this, "draw", canvas_context);
            },

            on_resize: function(){
                let button_pad_y = -200;
                let config_button_count = 0;

                const next_pad_y = () => button_pad_y += 80;
                Object.values(this).filter(element => element instanceof ui.Button)
                .forEach(button => {
                    const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                    if(config_button_count % 2 == 0) { // if config_button_count is even
                        button.position = center_pos.translate({ x:-150, y: next_pad_y() });
                    } else {
                        button.position = center_pos.translate({ x:+150, y: button_pad_y });
                    }
                    config_button_count++;
                });
            }


        }

        this.config_buttons.on_resize();

        this.audio_settings = new AudioSettings({ position: new Vector2({x: 0, y: graphics.canvas_rect().height/2 - 156}) });
    }

    toggle_game_config(param) {
        window.game_config[param] = !window.game_config[param];
    }

    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

    on_resize(){
        this.config_buttons.on_resize();
    }

}

class OptionsScreen extends fsm.State {
    fader = new ScreenFader();

    create_ui(){
        this.options = new Options(()=>this.go_back());
    }

    *enter(){
        this.create_ui();
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        delete this.options;
    }

    go_back(){
        this.state_machine.push_action("back");
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            this.go_back();
        }

        this.options.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        this.options.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








