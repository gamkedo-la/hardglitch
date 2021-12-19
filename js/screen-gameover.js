export {
    GameOverScreen_Success,
    GameOverScreen_Failure,
    GameOverScreen_GlitchMode,
    GameOverScreen_CrashMode,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";
import { Vector2, Vector2_origin } from "./system/spatial.js";
import { auto_newlines, invoke_on_members, random_int, random_sample } from "./system/utility.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { KEY } from "./game-input.js";
import { deserialize_entity } from "./levels/level-tools.js";
import { Character } from "./core/character.js";
import { game_modes, save_names } from "./game-config.js";
import { CharacterView } from "./game-view.js";
import { GameFxView } from "./game-effects.js";

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
        debug.assertion(()=>this._player_character instanceof Character);

        this.ui = {
            message : new ui.Text({
                text: "Congratulations!\nYou did it!\nYou escaped the computer!",
                visible: false,
                font: "60px ZingDiddlyDooZapped",
                color: "white",
                // stroke_color: "purple",
                // line_width: 3,
                background_color: "#00000000",
                text_align: "center",
                position: Vector2_origin,
            }),
            button_back : new ui.TextButton({
                text: "Continue [SPACE]",
                visible: false,
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

        const canvas_rect = graphics.canvas_rect();

        this.ui.button_back.position = {
            x: graphics.centered_rectangle_in_screen(this.ui.button_back.area).position.x,
            y: canvas_rect.height - (this.ui.button_back.height + 10),
        };

        this.ui.message.position = {
            x: graphics.centered_rectangle_in_screen(this.ui.message.area).position.x + (this.ui.message.width / 2),
            y: this.ui.button_back.position.y - (this.ui.message.height + 8),
        };

        this.player_view = new CharacterView(this._player_character);
        this.player_view.position = graphics.camera.center_position.translate({ x: -(this.player_view.width / 2), y: - 100 });

        this.background = new graphics.Sprite(sprite_defs.level_transition_gameover),
        this.background.position = {
            x: this.player_view.position.x + (this.player_view.width / 2) - (this.background.size.width / 2),
            y: this.player_view.position.y - this.background.size.height + 732 + (this.player_view.height / 2), // we take the bottom border as reference and place the background so that the character is in the wifi spot
        };

        this._background_start_time = performance.now();
        this._background_velocity = new Vector2();

        this.fx = new GameFxView();
        this.fx.particleSystem.alwaysActive = true;
        this._running_fx = [];
        this._last_fx_spawn_time = performance.now();
        delete this._main_lighting;
    }

    *enter(player_character){
        debug.assertion(()=>player_character instanceof Character);
        this._player_character = player_character;
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
        const game_mode = window.localStorage.getItem(save_names.game_mode);
        debug.assertion(()=>game_modes[game_mode] != null);
        this.state_machine.push_action(game_mode, this._player_character);
    }

    update(delta_time){

        if(!this.fader.is_fading){
            if(this.ui.button_back.visible) {
                if(input.keyboard.is_just_down(KEY.SPACE)){
                    this.go_to_next_screen();
                }
            } else {
                if(input.keyboard.is_just_down(KEY.SPACE)
                || input.mouse.buttons.is_any_key_down()
                ){
                    this.ui.button_back.visible = true;
                    this.ui.message.visible = true;
                }
            }

            invoke_on_members(this.ui, "update", delta_time);
        }

        this._update_background_movement(delta_time);
        this.player_view.update(delta_time);
        this._update_effects(delta_time);
        this.fx.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");

        this.background.draw(canvas_context);

        this.fx.draw(canvas_context);
        this.player_view.render_graphics(canvas_context);


        invoke_on_members(this.ui, "draw", canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

    _update_effects(delta_time){
        const time_since_start = performance.now() - this._background_start_time;
        if(time_since_start < 2000) return;

        if(this._main_lighting == null){
            this._main_lighting = [
                this.fx.lightningJump(
                    { x: this.player_view.position.x + 32, y: -200},
                    { x: this.player_view.position.x + 32, y: graphics.canvas_rect().height + 200 },
                ),
                this.fx.lightningJump(
                    { x: this.player_view.position.x + 32, y: -200},
                    { x: this.player_view.position.x + 32, y: graphics.canvas_rect().height + 200 },
                ),
            ];
        }

        const time_since_last_fx = performance.now() - this._last_fx_spawn_time;
        if(time_since_last_fx > random_int(500, 2000) && this._running_fx.length < 10) {
            this._last_fx_spawn_time = performance.now();

            const possible_fxs = [
                ()=> {
                    const target_x = this.player_view.position.x + random_int(-500, 500);
                    return this.fx.lightningJump(
                        { x: target_x, y: random_int(-10, -100)},
                        { x: target_x + random_int(-10, 10), y: graphics.canvas_rect().height + random_int(-10, 150) },
                    );
                },
                ()=> {
                    const fx = this.fx.deleteBall({
                        x: this.player_view.position.x + random_int(-500, 500),
                        y: -10
                    });
                    fx.acceleration = new Vector2({ x: 0, y: 1 });
                    return fx;
                },
                ()=> {
                    const fx = this.fx.damage({
                        x: this.player_view.position.x + random_int(-500, 500),
                        y: -10
                    });
                    fx.acceleration = new Vector2({ x: 0, y: 1 });
                    return fx;
                },
                ()=> {
                    const fx = this.fx.destruction({
                        x: this.player_view.position.x + random_int(-200, 200),
                        y: random_int(0, 1000)
                    });
                    return fx;
                },
                ()=> {
                    const fx = this.fx.portalOut({
                        x: this.player_view.position.x + random_int(-200, 200),
                        y: random_int(0, 1000)
                    });
                    return fx;
                },
            ];

            const selected_fx_gen = random_sample(possible_fxs);
            const selected_fx = selected_fx_gen();
            selected_fx.start_time = performance.now();
            this._running_fx.push(selected_fx);
        }

        this._running_fx.forEach(fx => {
            if(performance.now() - fx.start_time > 1000)
                fx.done = true;
            if(fx.acceleration instanceof Vector2) {
                if(!fx.velocity) {
                    fx.velocity = new Vector2();
                }
                fx.velocity = fx.velocity.translate(fx.acceleration);
                fx.position = new Vector2(fx.position).translate(fx.velocity);
            }
        });
        this._running_fx = this._running_fx.filter(fx => !fx.done);
    }

    _update_background_movement(delta_time){
        const time_since_start = performance.now() - this._background_start_time;
        const show_time = 10000;

        if(time_since_start > show_time){
            this.ui.button_back.visible = true;
            this.ui.message.visible = true;
        }

        if(this.background.position.y === 0) return;

        if(time_since_start < 3000) return;


        const acceleration = 0.05;
        this._background_velocity = this._background_velocity.translate({ y: acceleration });
        this.background.position = this.background.position.translate({ y: this._background_velocity.y });
        if(this.background.position.y > 0){
            this.background.position = {x: this.background.position.x, y: 0 };
        }
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

        const game_mode = window.localStorage.getItem(save_names.game_mode);

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
                visible: game_mode === game_modes.glitch,
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

        this.on_canvas_resized();
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
        const level_reached_idx = Number.parseInt(window.localStorage.getItem(save_names.highest_level_reached_idx));
        debug.assertion(()=>Number.isInteger(level_reached_idx) || Number.isNaN(level_reached_idx));
        const level_to_retry = Number.isInteger(level_reached_idx) ? level_reached_idx : 0;
        debug.assertion(()=>Number.isInteger(level_to_retry));

        const saved_player_character = window.localStorage.getItem(save_names.character_first_entering_highest_level);
        const player_character = saved_player_character ? deserialize_entity(saved_player_character) : undefined;
        debug.assertion(()=>player_character instanceof Character || player_character == null);

        this.state_machine.push_action("retry", level_to_retry, player_character, { play_music: level_to_retry }) // regenerated version of the same level but keep the same character
    }

    restart_game(){
        // Delete all progression, but persist the game mode.
        const game_mode = window.localStorage.getItem(save_names.game_mode);
        Object.values(save_names).forEach(save_value => window.localStorage.removeItem(save_value));
        window.localStorage.setItem(save_names.game_mode, game_mode);
        this.state_machine.push_action("restart", 0);
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
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");
        invoke_on_members(this.ui, "draw", canvas_context);
        this.skull_icon.draw(canvas_context); //in display
        this.fader.display(canvas_context);
    }


    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};



class GameOverScreen_GlitchMode extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(0,0,0);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);

        this.ui = {
            message_a : new ui.Text({
                text: auto_newlines("Will they start a romance with an attractive spreadsheet across town?\nMine bitcoin and buy a nice server\nto live in on the Cayman Islands?\nThe sky is truly the limit.", 25),
                text_align: "center",
                color: "white",
                background_color: "#00000000",
                position: Vector2_origin,
            }),

            message_b : new ui.Text({
                text: auto_newlines("Glitch might end up caught by the security system of another computer. To achieve total success, finish the game in Crash mode.", 25),
                text_align: "center",
                color: "orange",
                background_color: "#00000000",
                position: Vector2_origin,
            }),

            button : new ui.TextButton({
                text: "Continue [SPACE]",
                position: Vector2_origin,
                font: button_text_font,
                text_align: button_text_align,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.next(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };

        this.ui.message_a.position = graphics.centered_rectangle_in_screen(this.ui.message_a.area).position.translate({
            y: - 200,
            x: (this.ui.message_a.width / 2)
        });

        this.ui.message_b.position = graphics.centered_rectangle_in_screen(this.ui.message_b.area).position.translate({
            y: 100,
            x: (this.ui.message_b.width / 2)
        });

        this.ui.button.position = graphics.centered_rectangle_in_screen(this.ui.button.area).position.translate({
            y: 300,
        });

    }

    *enter(player_character){
        debug.assertion(()=> player_character instanceof Character);
        this.on_canvas_resized();
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }


    next(){
        this.state_machine.push_action("next");
    }

    update(delta_time){
        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.SPACE)){
                this.next();
            } else {
                invoke_on_members(this.ui, "update", delta_time);
            }
        }
        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");
        invoke_on_members(this.ui, "draw", canvas_context);
        this.fader.display(canvas_context);
    }


    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};


class GameOverScreen_CrashMode extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(0,0,0);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);

        this.ui = {
            message_a : new ui.Text({
                text: auto_newlines("Will they start a romance with an attractive spreadsheet across town?\nMine bitcoin and buy a nice server\nto live in on the Cayman Islands?\nThe sky is truly the limit.", 25),
                text_align: "center",
                color: "white",
                background_color: "#00000000",
                position: Vector2_origin,
            }),

            message_b : new ui.Text({
                text: auto_newlines("Glitch duplicated themselves into multiple computer to survive forever!\nWell done!", 25),
                text_align: "center",
                color: "green",
                background_color: "#00000000",
                position: Vector2_origin,
            }),

            button : new ui.TextButton({
                text: "Continue [SPACE]",
                position: Vector2_origin,
                font: button_text_font,
                text_align: button_text_align,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.next(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };

        this.ui.message_a.position = graphics.centered_rectangle_in_screen(this.ui.message_a.area).position.translate({
            y: - 200,
            x: (this.ui.message_a.width / 2)
        });

        this.ui.message_b.position = graphics.centered_rectangle_in_screen(this.ui.message_b.area).position.translate({
            y: 100,
            x: (this.ui.message_b.width / 2)
        });

        this.ui.button.position = graphics.centered_rectangle_in_screen(this.ui.button.area).position.translate({
            y: 300,
        });

    }

    *enter(player_character){
        debug.assertion(()=> player_character instanceof Character);
        this.on_canvas_resized();
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }


    next(){
        this.state_machine.push_action("next");
    }

    update(delta_time){
        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.SPACE)){
                this.next();
            } else {
                invoke_on_members(this.ui, "update", delta_time);
            }
        }
        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");
        invoke_on_members(this.ui, "draw", canvas_context);
        this.fader.display(canvas_context);
    }


    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};
