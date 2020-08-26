export {
    GameScreen,

}


import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";

import { KEY } from "./game-input.js";

import * as editor from "./editor.js";
import { ScreenFader } from "./system/screenfader.js";
import { GameSession } from "./game-session.js";
import { Color } from "./system/color.js";
import { sprite_defs } from "./game-assets.js";
import { Vector2_origin } from "./system/spatial.js";
import { AnimationGroup, wait } from "./system/animation.js";

import { game_levels } from "./definitions-world.js";
import { tween, easing } from "./system/tweening.js";
import { is_number } from "./system/utility.js";

class PlayingGame extends fsm.State{

    *enter(){
        console.assert(this.state_machine.game_session instanceof GameSession);
        this.game_session = this.state_machine.game_session;
    }

    *leave(){
        delete this.game_session;
    }

    update(delta_time){

        if(this.game_session.is_game_finished){
            if(input.keyboard.is_any_key_down() || input.mouse.buttons.is_any_key_down()){
                if(this.game_session.is_any_player_character_alive){
                    this.state_machine.escape();
                } else {
                    this.state_machine.horrible_death();
                }
            }
            this.game_session.update(delta_time, {
                is_player_action_allowed: false,
                is_camera_dragging_allowed: true,
            });
            return;
        }

        const ongoing_target_selection = this.game_session.view.ui.is_selecting_action_target;
        this.game_session.update(delta_time, {
            is_player_action_allowed: true,
            is_camera_dragging_allowed: true,
        });

        editor.update_debug_keys(this.game_session); // Debug action update // TODO: remove this later

        if(!ongoing_target_selection
        && this.game_session.view.is_time_for_player_to_chose_action
        && !input.mouse.is_dragging
        ){
            if(input.keyboard.is_just_down(KEY.F2)){
                this.state_machine.push_action("edit", this.game_session);
            }

            if(input.keyboard.is_just_down(KEY.TAB)){
                this.state_machine.push_action("back");
            }
        }
    }

    display(canvas_context){
        editor.display_debug_info(this.state_machine.game_session); // Display debug info // TODO: remove this later
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
        console.assert(game_session instanceof GameSession);
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
    }

    _init_ui(){
        console.assert(this.ui === undefined);

        this.ui = {
            resume_button: new ui.TextButton({
                text: "Resume Game",
                action: ()=>{ this.go_back(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
            exit_button: new ui.TextButton({
                text: "Exit Game",
                action: ()=>{ this.exit_game(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
            update: function(delta_time){
                this.resume_button.update(delta_time);
                this.exit_button.update(delta_time);
            },
            display: function(canvas_context){
                graphics.camera.begin_in_screen_rendering();
                this.resume_button.draw(canvas_context);
                this.exit_button.draw(canvas_context);
                graphics.camera.end_in_screen_rendering();
            }
        };

        // Center the buttons in the screen.
        let button_pad_y = 0;
        const next_pad_y = () => button_pad_y += 80;
        Object.values(this.ui).filter(element => element instanceof ui.Button)
            .forEach(button => {
                const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                button.position = center_pos.translate({ x:0, y: next_pad_y() });
            });

    }

    go_back(){
        this.state_machine.push_action("back");
    }

    exit_game(){
        console.assert(this.state_machine instanceof GameScreen);
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

    update(delta_time){
        this.fader.update(delta_time);
        if(this.fader.is_fading)
            return;

        this.ui.update(delta_time);

        if(input.keyboard.is_just_down(KEY.SPACE) || input.keyboard.is_just_down(KEY.TAB)){
            this.go_back();
        }

        if(input.keyboard.is_just_down(KEY.ENTER)){
            console.assert(this.state_machine instanceof GameScreen);
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

    *enter(level_to_play){
        console.assert(Number.isInteger(level_to_play) || level_to_play !== undefined);

        this._level_to_play = level_to_play;

        graphics.reset();

        const level_generator = (level_idx) => {
            const level = game_levels[level_idx];
            console.assert(level);
            return level.generate_world;
        };

        var level_world_generator;
        if(is_number(level_to_play)){
            console.assert(Number.isInteger(level_to_play) && level_to_play < game_levels.length);
            this.current_level_idx = level_to_play;
            level_world_generator = level_generator(level_to_play);
        }
        else {

            level_world_generator = level_to_play;
        }



        console.assert(!this.game_session);
        console.assert(!this.level_title);
        this.game_session = new GameSession(level_world_generator, ()=>{ this.ingame_menu(); });
        this.level_title = new ui.Text({
            text: this.game_session.world.name,
            font: "64px ZingDiddlyDooZapped",
            color: "white",
            background_color: "#ffffff00",
        });

        console.assert(this.game_session);
        console.assert(this.level_title);
        this._replace_title();

        this.animations.play(this._title_fade());

        this.ready = false;
        yield* wait(1000);
        yield* this.fader.generate_fade_in();

        this.game_session.start();
        this.ready = true;
    }

    *leave(){
        console.assert(this.game_session);
        console.assert(this.level_title);
        this.ready = false;
        yield* this.fader.generate_fade_out();
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
            return;

        super.update(delta_time); // Updates the sub-states
    }

    display(canvas_context){
        console.assert(canvas_context);

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

    escape(){
        const next_level = Number.isInteger(this.current_level_idx) ? this.current_level_idx + 1 : undefined;
        if(next_level == undefined || next_level >= game_levels.length){
            this.state_machine.push_action("escape");
        }
        else {
            this.state_machine.push_action(`level_${next_level}`);
        }
    }

    horrible_death(){
        this.state_machine.push_action("died", this._level_to_play);
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
        console.assert(this.level_title);
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
        console.assert(this.level_title);
        const color = new Color(255, 255, 255);

        const update_fade = (fade_value)=>{
            // console.log( `title fade = ${fade_value}`);
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








