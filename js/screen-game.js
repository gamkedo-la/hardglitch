export {
    GameScreen,

}

import * as debug from "./system/debug.js";
import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as audio from "./system/audio.js";
import * as texts from "./definitions-texts.js";

import { KEY, cursors } from "./game-input.js";

import * as editor from "./editor.js";
import { ScreenFader } from "./system/screenfader.js";
import { GameSession } from "./game-session.js";
import { Color } from "./system/color.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { Vector2_origin, Vector2 } from "./system/spatial.js";
import { AnimationGroup, wait } from "./system/animation.js";
import { AudioSettings } from "./game-ui.js";

import { game_levels } from "./definitions-world.js";
import { tween, easing } from "./system/tweening.js";
import { auto_newlines, is_number, random_sample } from "./system/utility.js";
import { Character } from "./core/character.js";
import { serialize_entity } from "./levels/level-tools.js";
import { Entity } from "./core/concepts.js";

class PlayingGame extends fsm.State{

    *enter(){
        debug.assertion(()=>this.state_machine.game_session instanceof GameSession);
        this.game_session = this.state_machine.game_session;
        this._player_ready_to_leave = false;
        this.on_canvas_resized();
    }

    *leave(){
        delete this.game_session;
    }

    update(delta_time){

        if(this.game_session.is_game_finished){

            this.ui.is_visible = this.game_session.view.allow_exit;
            this.ui.update(delta_time);

            if(!this._player_ready_to_leave
            && (input.keyboard.is_just_down(KEY.SPACE))
            ){
                this.on_player_ready_to_leave();
            }

            this.game_session.update(delta_time, {
                is_player_action_allowed: false,
                is_camera_dragging_allowed: true,
            });

            input.set_cursor(cursors.pointer_cursor);

            return;
        }

        const ongoing_target_selection = this.game_session.view.ui.is_selecting_action_target;
        this.game_session.update(delta_time, {
            is_player_action_allowed: true,
            is_camera_dragging_allowed: true,
        });

        if(window.debug_tools_enabled){
            editor.update_debug_keys(this.game_session); // Debug action update // TODO: remove this later

            if(!ongoing_target_selection
            && this.game_session.view.is_time_for_player_to_chose_action
            && !input.mouse.is_dragging
            ){
                if(input.keyboard.is_just_down(KEY.F2)){
                    this.state_machine.push_action("edit", this.game_session);
                }

                if(input.keyboard.is_just_down(KEY.TAB) || input.keyboard.is_just_down(KEY.ESCAPE)){
                    this.state_machine.push_action("back");
                }
            }
        }
    }

    display(canvas_context){
        if(window.debug_tools_enabled)
            editor.display_debug_info(this.state_machine.game_session);
        this.ui.display(canvas_context);
    }

    on_player_ready_to_leave(){
        this._player_ready_to_leave = true;
        if(this.game_session.is_player_character_exiting){
            this.state_machine.player_escaped();
        } else {
            this.state_machine.player_failed();
        }
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);

        this.ui = {
            is_visible: false,
            continue_button: new ui.TextButton({
                text: "Continue [SPACE]",
                action: ()=>{ this.on_player_ready_to_leave(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
            }),

            update: function(delta_time) {
                if(!this.is_visible) return;
                Object.values(this)
                    .filter(member => member instanceof ui.UIElement)
                    .forEach(element => element.update(delta_time));
            },

            display: function (canvas_context){
                if(!this.is_visible) return;
                graphics.camera.begin_in_screen_rendering();
                Object.values(this)
                    .filter(member => member instanceof ui.UIElement)
                    .forEach(element => element.draw(canvas_context));
                graphics.camera.end_in_screen_rendering();
            },
        };

        this.ui.continue_button.position = graphics.centered_rectangle_in_screen(this.ui.continue_button).position.translate({ y: 220 });
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }
};

class EditorMode extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,0,255);
        this.fader.duration_ms = 300;
        this.fader._fade = 0;
    }

    *enter(game_session){
        debug.assertion(()=>game_session instanceof GameSession);
        this.game_session = game_session;
        editor.begin_edition(game_session);
        yield* this.fader.generate_fade_out(0.1);
    }

    *leave(){
        yield* this.fader.generate_fade_in();
        editor.end_edition(this.game_session);
        delete this.game_session;
    }

    update(delta_time){
        this.fader.update(delta_time);

        editor.update(this.game_session, delta_time);

        this.game_session.update(delta_time, {
            is_player_action_allowed: false,
            is_camera_dragging_allowed: !editor.is_editing,
        });


        if(input.keyboard.is_just_down(KEY.F2)
        || (input.keyboard.is_just_down(KEY.TAB) && !editor.is_editing)
        || (input.keyboard.is_just_down(KEY.ESCAPE) && !editor.is_editing)
        ){
            this.state_machine.push_action("back");
        }
    }

    display(canvas_context){
        editor.display(this.game_session);
        this.fader.display(canvas_context);
    }
};

class InGameMenu extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,255,255);
        this.fader.duration_ms = 300;
        this.fader._fade = 0;
        this.menu_screen = "main";
        // valid menu_screen values: "main", "instructions", "config"
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);

        this.ui = {

            instructions_button: new ui.TextButton({
                text: "How To Play",
                action: ()=>{
                    this.state_machine.hide_title();
                    this.set_menu_screen("instructions");
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "main",
            }),
            config_button: new ui.TextButton({
                text: "Game Options",
                action: ()=>{ this.set_menu_screen("config"); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "main",
            }),
            exit_button: new ui.TextButton({
                text: "Exit Game",
                action: ()=>{ this.exit_game(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "main",
            }),

            // Instructions Menu Screen
            text_instructions: new ui.Text({
                text: auto_newlines(texts.help_info, 52),
                font: "20px Space Mono",
                color: "white",
                background_color: "#222222dd",
                visible: this.menu_screen == "instructions",
            }),

            // Config Menu Screen
            particles_button: new ui.TextButton({
                text: "Particles: " + (
                    window.game_config.enable_particles ? "On" : "Off"
                ),
                action: ()=>{
                    this.toggle_game_config('enable_particles');
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),
            status_bar_button: new ui.TextButton({
                text: "Status Bar: " + (
                    window.game_config.enable_stats_bar_value_always_visible ? "Always" : "Auto"
                ),
                action: ()=>{
                    this.toggle_game_config(
                        'enable_stats_bar_value_always_visible'
                    );
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),
            turn_message_button: new ui.TextButton({
                text: "Cycle Message: " + (
                    window.game_config.enable_turn_message ? "On" : "Off"),
                action: ()=>{
                    this.toggle_game_config('enable_turn_message');
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),
            turn_sound_button: new ui.TextButton({
                text: "Cycle Sound: " + (
                    window.game_config.enable_turn_sound ? "On" : "Off"),
                action: ()=>{
                    this.toggle_game_config('enable_turn_sound');
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),
            timeline_button: new ui.TextButton({
                text: "Timeline: " + (
                    window.game_config.enable_timeline ? "On" : "Off"),
                action: ()=>{
                    this.toggle_game_config('enable_timeline');
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),
            infobox_button: new ui.TextButton({
                text: "Infobox: " + (
                    window.game_config.enable_infobox ? "On" : "Off"),
                action: ()=>{
                    this.toggle_game_config('enable_infobox');
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "config",
            }),

            resume_button: new ui.TextButton({
                text: "Resume Game",
                action: ()=>{ this.go_back(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen == "main",
            }),
            // Back Button ( for all non-main menu screens )
            menu_back_button: new ui.TextButton({
                text: "Back",
                action: ()=>{
                    this.set_menu_screen("main");
                    this.state_machine.show_title();
                },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'EditorButtonHover',
                    down: 'EditorButtonClick',
                },
                visible: this.menu_screen != "main",
            }),

            audio_settings: new AudioSettings({
                position: new Vector2({x: 0, y: graphics.canvas_rect().height/2 - 156}),
            }),

            update: function(delta_time) {
                Object.values(this)
                    .filter(member => member instanceof ui.UIElement)
                    .forEach(element => element.update(delta_time));
            },

            display: function (canvas_context){
                graphics.camera.begin_in_screen_rendering();
                Object.values(this)
                    .filter(member => member instanceof ui.UIElement)
                    .forEach(element => element.draw(canvas_context));
                graphics.camera.end_in_screen_rendering();
            },
        };

        // Center the buttons in the screen.
        let button_pad_y = -160; // default
        let config_button_count = 0;
        let is_config_screen = false;

        if(this.ui.text_instructions.visible) { // instructions screen
            button_pad_y = 160;
        } else if (this.ui.particles_button.visible) { // config screen
            button_pad_y = -200;
            is_config_screen = true;
        }
        const next_pad_y = () => button_pad_y += 80;
        if(!is_config_screen) {
            Object.values(this.ui).filter(element => element instanceof ui.Button)
                .forEach(button => {
                    if(button.visible) {
                        const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                        button.position = center_pos.translate({ x:0, y: next_pad_y() });
                    }
                });
        } else {
            Object.values(this.ui).filter(element => element instanceof ui.Button)
                .forEach(button => {
                    if(button.visible) {
                        const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                        if(config_button_count % 2 == 0) {
                            button.position = center_pos.translate({ x:-150, y: next_pad_y() });
                        } else {
                            button.position = center_pos.translate({ x:+150, y: button_pad_y });
                        }
                    }
                    config_button_count++;
                });
        }

        this.ui.text_instructions.position = graphics.centered_rectangle_in_screen(this.ui.text_instructions).position;
        this.ui.menu_back_button.position = graphics.centered_rectangle_in_screen(this.ui.menu_back_button).position
            .translate({ y: Math.round((this.ui.text_instructions.height / 2) + (this.ui.menu_back_button.height / 2)) });
    }

    go_back(){
        this.state_machine.push_action("back");
    }

    exit_game(){
        debug.assertion(()=>this.state_machine instanceof GameScreen);
        this.state_machine.exit();
    }

    *enter(){
        if(!this.ui){
            this._init_ui();
        }

        yield* this.fader.generate_fade_out(0.3);
        this.state_machine.show_title();
    }

    *leave(){
        this.state_machine.hide_title();
        yield* this.fader.generate_fade_in();
    }

    set_menu_screen(new_menu_screen){
        this.menu_screen = new_menu_screen;
        this.on_canvas_resized();
    }

    toggle_game_config(param) {
        window.game_config[param] = !window.game_config[param];
        this.on_canvas_resized();
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(this.fader.is_fading)
            return;

        this.ui.update(delta_time);

        if(input.keyboard.is_just_down(KEY.TAB) || input.keyboard.is_just_down(KEY.ESCAPE)){
            this.go_back();
        }

        if(input.keyboard.is_just_down(KEY.ENTER)){
            debug.assertion(()=>this.state_machine instanceof GameScreen);
            this.exit_game();
        }

    }

    display(canvas_context){
        this.fader.display(canvas_context);
        if(this.fader.is_fading)
            return;

        // Draw the UI OVER the fader:
        this.ui.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};


class GameScreen extends fsm.StateMachine {
    fader = new ScreenFader();
    animations = new AnimationGroup();

    constructor(){
        super({
            playing: new PlayingGame(),
            editor: new EditorMode(),
            menu: new InGameMenu(),
        }, {
            initial_state: "playing",
            playing: {
                edit: "editor",
                back: "menu",
            },
            menu: {
                back: "playing",
            },
            editor: {
                back: "playing",
            },
        });

        this.fader.duration_ms = 2000;
    }

    *enter(level_to_play, player_character, options){
        debug.assertion(()=>Number.isInteger(level_to_play) || level_to_play !== undefined);
        debug.assertion(()=>player_character === undefined || player_character instanceof Character);

        audio.stopEvent(music_id.level_transition);
        audio.stopEvent(music_id.title);

        delete this.music;
        if(Number.isInteger(level_to_play)){
            this.music = music_id[`level_${level_to_play}`];
        }
        if(options instanceof Object && Number.isInteger(options.play_music)){
            this.music = music_id[`level_${level_to_play}`];
        }
        if(this.music){
            audio.playEvent(this.music);
        }
        // Otherwise don't play music at all. (for the sanity of the devs)

        delete this.current_level_idx;
        this._level_to_play = level_to_play;

        graphics.reset();

        const level_generator = (level_idx) => {
            const level = game_levels[level_idx];
            debug.assertion(()=>level);
            return level.generate_world;
        };

        var level_world_generator;
        if(is_number(level_to_play)){
            debug.assertion(()=>Number.isInteger(level_to_play) && level_to_play < game_levels.length);
            this.current_level_idx = level_to_play;
            level_world_generator = level_generator(level_to_play);
        }
        else {

            level_world_generator = level_to_play;
        }



        debug.assertion(()=>!this.game_session);
        debug.assertion(()=>!this.level_title);
        this.game_session = new GameSession(level_world_generator, ()=>{ this.ingame_menu(); }, player_character);
        this.level_title = new ui.Text({
            text: this.game_session.world.name,
            font: "64px ZingDiddlyDooZapped",
            color: "white",
            background_color: "#ffffff00",
        });

        debug.assertion(()=>this.game_session instanceof GameSession);
        debug.assertion(()=>this.level_title instanceof ui.Text);
        this._replace_title();

        this.animations.play(this._title_fade());

        this.ready = false;
        yield* wait(1000);
        yield* this.fader.generate_fade_in();

        this.game_session.start();
        this.ready = true;

        // Save the state of the world once beginning so that when the player dies they can come back at that exact point.
        window.last_world_entered = editor.export_world(this.game_session.world, true); // Complete save for when the player dies.
        window.last_level_played = level_to_play;
        window.last_player_character = player_character instanceof Entity ? serialize_entity(player_character) : player_character;
    }

    *leave(){
        debug.assertion(()=>this.game_session);
        debug.assertion(()=>this.level_title);
        this.ready = false;
        yield* this.fader.generate_fade_out();

        if(this.music) audio.stopEvent(this.music);

        this.game_session.stop();
        // ...
        delete this.level_title;
        delete this.game_session;
        editor.clear()
        graphics.reset();
        this.animations.clear();
    }

    update(delta_time){
        this.animations.update(delta_time);
        this.fader.update(delta_time);
        this.level_title.update(delta_time);
        if(!this.ready) // No input handled until the fades are done.
        {
            // Just make sure that the game ui is working correctly.
            this.game_session.view.update(delta_time);
            return;
        }

        super.update(delta_time); // Updates the sub-states
    }

    display(canvas_context){
        debug.assertion(()=>canvas_context);

        this.game_session.display(canvas_context);
        this.current_state.display(canvas_context);

        this.fader.display(canvas_context);

        if(this.level_title.visible){
            graphics.camera.begin_in_screen_rendering();
            this.level_title.draw(canvas_context);
            graphics.camera.end_in_screen_rendering();
        }
    }

    exit(){
        this.state_machine.push_action("exit");
    }

    ingame_menu(){
        this.push_action("back");
    }

    player_escaped(){
        const next_level = Number.isInteger(this.current_level_idx) ? this.current_level_idx + 1 : undefined;
        if(next_level == undefined || next_level >= game_levels.length){
            this.state_machine.push_action("escape");
        }
        else {
            // DEMO MODE: we just jump to the demo scren
            // this.state_machine.push_action("demo", this._level_to_play, this.game_session.world.exiting_character);

            // Pass on the player's character that exited, to continue in the next level.
            this.state_machine.push_action(`level_${next_level}`, this.game_session.world.exiting_character);
        }
    }

    player_failed(){
        this.state_machine.push_action("failed", this._level_to_play);
    }

    on_canvas_resized(){
        Object.values(this.states)
            .forEach(state => {
                if(state.on_canvas_resized)
                    state.on_canvas_resized();
            });
        this.game_session.on_canvas_resized();
        this._replace_title();
    }

    _replace_title(){
        debug.assertion(()=>this.level_title);
        this.level_title.position = this.ready ? this._menu_title_position : this._entry_title_position;
    }

    get _entry_title_position(){
        return graphics.centered_rectangle_in_screen(this.level_title.area).position;
    }

    get _menu_title_position(){
        return {
                x: graphics.centered_rectangle_in_screen(this.level_title.area).position.x,
                y: 60,
            };
    }

    *_title_fade() {
        debug.assertion(()=>this.level_title);
        const color = new Color(255, 255, 255);

        const update_fade = (fade_value)=>{
            // debug.log( `title fade = ${fade_value}`);
            color.a = fade_value;
            this.level_title.color = color;
        };

        this.level_title.visible = true;
        yield* tween(0, 1, 500, update_fade, easing.in_out_quad);
        yield* wait(3000);
        yield* tween(1, 0, 2000, update_fade, easing.in_out_quad);
        this.level_title.visible = false;
    }

    show_title(){
        this._replace_title();
        this.animations.clear();
        this.level_title.color = new Color(255, 255, 255);
        this.level_title.visible = true;
    }

    hide_title(){
        this.level_title.visible = false;
    }

};








