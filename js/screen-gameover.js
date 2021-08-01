export {
    GameOverScreen_Success,
    GameOverScreen_Failure,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";
import { Vector2_origin } from "./system/spatial.js";
import { auto_newlines, invoke_on_members } from "./system/utility.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { KEY } from "./game-input.js";
import { deserialize_entity } from "./levels/level-tools.js";
import { Character } from "./core/character.js";

const button_text_font = "22px Space Mono";
const button_text_align = undefined; // "center";


class GameOverScreen_Success extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,255,255);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);


// TODO: put this in the end screen
//"Will they start a romance with an attractive spreadsheet across town?\nMine bitcoin and buy a nice server\nto live in on the Cayman Islands?\nThe sky is truly the limit."

        this.ui = {
            message : new ui.Text({
                text: "Congratulations! You escaped the computer!",
                position: graphics.canvas_center_position().translate({x:-200, y:0}),
            }),
            button_back : new ui.TextButton({
                text: "Continue [SPACE]",
                font: button_text_font,
                text_align: button_text_align,
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.go_to_next_screen(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };
        // Center the buttons in the screen.
        let button_pad_y = 0;
        const next_pad_y = () => {
            const result = button_pad_y;
            button_pad_y += 80;
            return result;
        };
        Object.values(this.ui).forEach(button => {
            const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
            button.position = center_pos.translate({ x:0, y: next_pad_y() });
        });
    }

    *enter(){
        if(!this.ui){
            this._init_ui();
        }
        audio.playEvent(music_id.gameover_success);
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        // WE DON'T STOP THE MUSIC, ON PURPOSE.
    }

    go_to_next_screen(){
        this.state_machine.push_action("ok");
    }

    update(delta_time){

        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.SPACE)){
                this.go_to_next_screen();
            } else {
                invoke_on_members(this.ui, "update", delta_time);
            }
        }

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "white");

        invoke_on_members(this.ui, "draw", canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};


class GameOverScreen_Failure extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,0,0);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);

        this.ui = {
            message : new ui.Text({
                text: "Glitch no longer occupies the memory they once did.",
                position: graphics.canvas_center_position().translate({x:-200, y:0}),
            }),

            button_retry : new ui.TextButton({
                text: "Retry [SPACE]",
                font: button_text_font,
                position: Vector2_origin,
                text_align: button_text_align,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.retry_level(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                },
            }),
            button_restart : new ui.TextButton({
                text: "New Game [ENTER]",
                font: button_text_font,
                position: Vector2_origin,
                text_align: button_text_align,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.restart_game(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
            button_back : new ui.TextButton({
                text: "Back [ESC]",
                position: Vector2_origin,
                font: button_text_font,
                text_align: button_text_align,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.back_to_title_screen(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };


        this.skull_icon = new graphics.Sprite(sprite_defs.game_over_skull);
        this.skull_icon.position = graphics.canvas_center_position().translate({x:-100, y:-250});
        // TODO: animate skull

        // Center the buttons in the screen.
        let button_pad_y = 0;
        const next_pad_y = () => {
            const result = button_pad_y;
            button_pad_y += 80;
            return result;
        };
        Object.values(this.ui).forEach(button => {
            const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
            button.position = center_pos.translate({ x:0, y: next_pad_y() });
        });


        this.ui.button_retry.helptext = new ui.HelpText({
            text: auto_newlines("Back to the beginning of this level with the items you had when entering.\nThe level will be bit different...", 24),
            area_to_help: this.ui.button_retry.area,
            delay_ms: 0,
            position: this.ui.button_retry.position.translate({ x: this.ui.button_retry.width }),
        });

        this.ui.button_restart.helptext = new ui.HelpText({
            text: auto_newlines("Reboot the computer,\nretry from scratch!", 20),
            area_to_help: this.ui.button_restart.area,
            delay_ms: 0,
            position: this.ui.button_restart.position.translate({ x: this.ui.button_restart.width }),
        });

        this.ui.button_back.helptext = new ui.HelpText({
            text: "Back to title screen.",
            area_to_help: this.ui.button_back.area,
            delay_ms: 0,
            position: this.ui.button_back.position.translate({ x: this.ui.button_back.width }),
        });
    }

    *enter(level_to_play){
        debug.assertion(()=>Number.isInteger(level_to_play) || level_to_play !== undefined);
        this._level_to_play = level_to_play;
        if(!this.ui){
            this._init_ui();
        }

        audio.playEvent(music_id.gameover_failure);
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        audio.stopEvent(music_id.gameover_failure);
        yield* this.fader.generate_fade_out();
    }

    back_to_title_screen(){
        this.state_machine.push_action("back");
    }

    retry_level(){
        // this.state_machine.push_action("retry", () => deserialize_world(window.last_world_entered)); // exact same level

        const player_character = typeof window.last_player_character === "string" ? deserialize_entity(window.last_player_character) : window.last_player_character;
        debug.assertion(()=>player_character instanceof Character || player_character === undefined);
        this.state_machine.push_action("retry", Number.isInteger(window.last_level_played_idx) ? window.last_level_played_idx : window.last_level_played, player_character, { play_music: window.last_level_played_idx }) // regenerated version of the same level but keep the same character
    }

    restart_game(){
        this.state_machine.push_action("retry", 0);
    }

    update(delta_time){
        this.skull_icon.update(delta_time); //in update
        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.ESCAPE)){
                this.back_to_title_screen();
            } else if(input.keyboard.is_just_down(KEY.SPACE)){
                this.retry_level();
            } else if(input.keyboard.is_just_down(KEY.ENTER)){
                this.restart_game();
            } else{
                invoke_on_members(this.ui, "update", delta_time);
            }
        }
        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "red");
        invoke_on_members(this.ui, "draw", canvas_context);
        this.skull_icon.draw(canvas_context); //in display
        this.fader.display(canvas_context);
    }


    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};




