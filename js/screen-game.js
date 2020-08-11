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
            if(input.keyboard.is_just_down(KEY.SPACE)){
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
            }),
            exit_button: new ui.TextButton({
                text: "Exit Game",
                action: ()=>{ this.exit_game(); },
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
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
    }

    *leave(){
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
    }

    *enter(level){
        graphics.reset();

        if(!this.game_session){
            this.game_session = new GameSession(level);
        } else {
            console.assert(level === undefined);
        }
        yield* this.fader.generate_fade_in();

        this.game_session.start();
    }

    *leave(){

        yield* this.fader.generate_fade_out();
        this.game_session.stop();
        // ...
        delete this.game_session;
        editor.clear()
        graphics.reset();
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(this.fader.is_fading) // No input handled until the fades are done.
            return;

        super.update(delta_time); // Updates the sub-states
    }

    display(canvas_context){
        console.assert(canvas_context);

        this.game_session.display(canvas_context);
        this.current_state.display(canvas_context);

        this.fader.display(canvas_context);
    }

    exit(){
        this.state_machine.push_action("exit");
    }

    escape(){
        // TODO, pass the next level
        const next_level = undefined;
        this.state_machine.push_action("escape", next_level);
    }

    horrible_death(){
        this.state_machine.push_action("died");
    }

    on_canvas_resized(){
        if(this.current_state.on_canvas_resized){
            this.this.current_state.on_canvas_resized();
        }
        this.game_session.on_canvas_resized();
    }

};








