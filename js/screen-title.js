export {
    TitleScreen,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import * as audio from "./system/audio.js";

import { music_id, sprite_defs } from "./game-assets.js";
import { auto_newlines, invoke_on_members } from "./system/utility.js";
import { Vector2, Vector2_origin } from "./system/spatial.js";
import { ScreenFader } from "./system/screenfader.js";

import { HARD_GLITCH_VERSION } from "./version.js";
import { save_names } from "./game-config.js";

const buttons_font = "22px Space Mono";
const button_text_color = "#32258b";

class MainMenu {

    constructor(state_machine, position){
        debug.assertion(()=>state_machine instanceof fsm.StateMachine);
        debug.assertion(()=>position instanceof Vector2);


        this.position = position;

        this.background = {
            sprite: new graphics.Sprite({
                    image: "title_bg",
            }),
        };

        this.background.draw = (canvas_context)=>{ // We want to make sure the background is always filling the whole screen even with very big screens.
            const horizontal_times = Math.ceil(graphics.canvas_rect().width / this.background.sprite.size.width);
            const vertical_times = Math.ceil(graphics.canvas_rect().height / this.background.sprite.size.height);
            const max_x = horizontal_times * this.background.sprite.size.width;
            const max_y = vertical_times * this.background.sprite.size.height;
            for(let y = 0; y < max_y; y += this.background.sprite.size.height){
                for(let x = 0; x < max_x; x += this.background.sprite.size.width){
                    this.background.sprite.position = {x, y};
                    this.background.sprite.draw(canvas_context);
                }
            }

        };

        const last_save = window.localStorage.getItem(save_names.last_exit_save);
        const last_save_music = window.localStorage.getItem(save_names.last_exit_save_music);
        // Deactivated continu button upon death
        const last_level = undefined;
        // const last_level = window.localStorage.getItem(save_names.last_level_reached);
        // const last_level_idx = window.localStorage.getItem(save_names.last_level_reached_idx);
        // const last_character = window.localStorage.getItem(save_names.last_level_reached_character);
        // const level_reached_idx = last_level_idx ? JSON.parse(last_level_idx) : undefined;

        if(last_save || (last_level && level_reached_idx > 0)){
            this.button_continue = new ui.TextButton({
                text: last_save ? "Continue" : `Retry LVL ${last_level_idx}`,
                color: button_text_color,
                font: buttons_font,
                action: ()=> {
                    if(last_save){
                        const level_world_desc = JSON.parse(last_save);
                        const options = last_save_music ? { play_music: JSON.parse(last_save_music) } : undefined;
                        state_machine.push_action('continue', ()=>window.deserialize_world(level_world_desc), undefined, options);
                    } else {
                        const player_character = last_character ? window.deserialize_entity(last_character) : undefined;
                        const options = level_reached_idx ? { play_music: level_reached_idx } : undefined;
                        debug.assertion(()=> Number.isInteger(level_reached_idx) && (player_character instanceof Object || player_character == null));
                        state_machine.push_action('continue', Number.isInteger(level_reached_idx) ? level_reached_idx : last_level, player_character, options);
                    }
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                },
            });

            this.button_continue.helptext = new ui.HelpText({
                text: auto_newlines(last_save ? "Continue exactly where you were last time you 'Saved & Exit' the game." : `You died (or quit without saving) last time you played Level ${last_level_idx}.\nRetry a variation of this level with the same character and items you had when entering it the first time.`, 24),
                area_to_help: this.button_continue.area,
                delay_ms: 0,
                position: this.button_continue.position.translate({ x: this.button_continue.width }),
            });

        }

        this.button_new_game = new ui.TextButton({
            text: "New Game",
            color: button_text_color,
            font: buttons_font,
            action: ()=> {
                window.localStorage.removeItem(save_names.last_exit_save);
                window.localStorage.removeItem(save_names.last_level_reached);
                window.localStorage.removeItem(save_names.last_level_reached_character);
                state_machine.push_action("new_game", 0);
            },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            },
        });

        if(this.button_continue != null){
            this.button_new_game.helptext = new ui.HelpText({
                text: auto_newlines("Start a new game. Deletes previous saved games.", 24),
                area_to_help: this.button_new_game.area,
                delay_ms: 0,
                position: this.button_new_game.position.translate({ x: this.button_new_game.width }),
            });
        }

        this.button_options = new ui.TextButton({
            text: "Options",
            color: button_text_color,
            font: buttons_font,
            action: ()=> { state_machine.push_action("options"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            },
        });

        if(window.debug_tools_enabled){

            this.button_empty_level = new ui.TextButton({
                text: "Empty Small Level",
                font: buttons_font,
                action: ()=> { load_test_level(9, 9); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            });

            this.button_test_level = new ui.TextButton({
                text: "Random Test Level",
                font: buttons_font,
                action: ()=> { load_random_test_level(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            });

        }

        this.button_credits = new ui.TextButton({
            text: "Credits",
            font: buttons_font,
            action: ()=> { state_machine.push_action("credits"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });


        const space_between_buttons = this.button_new_game.height + 6;
        let next_button_y_drift = 40;
        const button_y_drift = () => next_button_y_drift += space_between_buttons;
        const bottom_y = graphics.canvas_rect().bottom_right.y;
        Object.values(this).filter(element => element instanceof ui.Button)
            .reverse()
            .forEach(button => {
                const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                button.position = { x: center_pos.x, y: bottom_y - button_y_drift() };
                if(button.helptext != null) {
                    button.helptext.area_to_help = button.area;
                    button.helptext.position = button.position.translate({ x: button.width });
                }
            });



    }

    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

};


class TitleScreen extends fsm.State {
    fader = new ScreenFader();

    _init_ui(){
        debug.assertion(()=>this.main_menu === undefined);
        debug.assertion(()=>this.title === undefined);

        this.ui = {};
        this.ui.title = new ui.Text({
            text: "HARD GLITCH",
            font: "120px ZingDiddlyDooZapped",
            color: "white",
            background_color: "#ffffff00",
            stroke_color: "purple",
            line_width: 4,
            position: Vector2_origin
        });
        this.ui.title.position = {
            x: graphics.centered_rectangle_in_screen(this.ui.title.area).position.x,
            y: 100,
        };

        this.ui.demo = new ui.Text({
            text: "(DEMO 2)",
            font: "52px Space Mono",
            color: "white",
            background_color: "#ffffff00",
            stroke_color: "black",
            line_width: 2,
            position: Vector2_origin
        });
        this.ui.demo.position = {
            x: graphics.centered_rectangle_in_screen(this.ui.demo.area).position.x,
            y: 250,
        };

        this.ui.demo.visible = false;

        this.ui.main_menu = new MainMenu(this.state_machine, this.ui.title.position.translate({ x:0, y: 100 }));

        this.ui.version = new ui.Text({
            text: HARD_GLITCH_VERSION,
            font: "20px Space Mono",
            color: "white",
            background_color: "#ffffff00",
            position: Vector2_origin
        });
        const canvas_rect = graphics.canvas_rect();
        this.ui.version.position = {
            x: canvas_rect.width - this.ui.version.width - 16,
            y: canvas_rect.height - this.ui.version.height - 16,
        };

    }

    *enter(){
        if(!this.main_menu){
            this._init_ui();
        }
        audio.playEvent(music_id.title);
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        // audio.stopEvent(music_id.title); // The next screen will decide if they need to stop the title sceeen music or not.
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(!this.fader.is_fading)
            this.ui.main_menu.update(delta_time);
        this.ui.title.update(delta_time);
        this.ui.demo.update(delta_time);
    }

    display(canvas_context){

        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        if(!this.is_fading){
            this.ui.main_menu.draw(canvas_context);
        }

        this.ui.title.draw(canvas_context);
        this.ui.demo.draw(canvas_context);
        this.ui.version.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }
};




