export {
    GameScreen,

}


import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";

import { KEY } from "./game-input.js";

import * as editor from "./editor.js";
import { ScreenFader } from "./system/screenfader.js";
import { GameSession } from "./game-session.js";
import { Color } from "./system/color.js";

class PlayingGame extends fsm.State{

    *enter(){
        console.assert(this.state_machine.game_session instanceof GameSession);
        this.game_session = this.state_machine.game_session;
    }

    *leave(){
        delete this.game_session;
    }

    update(delta_time){

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
            if(input.keyboard.is_just_down(KEY.ESCAPE)){
                this.state_machine.push_action("edit", this.game_session);
            }

            if(input.keyboard.is_just_down(KEY.ENTER)){
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

        this.game_session.update(delta_time, {
            is_player_action_allowed: false,
            is_camera_dragging_allowed: true,
        });

        editor.update(this.game_session);

        if(input.keyboard.is_just_down(KEY.ESCAPE)){
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

    *enter(){
        yield* this.fader.generate_fade_out(0.3);
    }

    *leave(){
        yield* this.fader.generate_fade_in();
    }

    update(delta_time){
        this.fader.update(delta_time);

        if(input.keyboard.is_just_down(KEY.ENTER)){
            this.state_machine.push_action("back");
        }

        if(input.keyboard.is_just_down(KEY.F10)){
            console.assert(this.state_machine instanceof GameScreen);
            this.state_machine.exit();
        }
    }

    display(canvas_context){
        this.fader.display(canvas_context);
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
        this.game_session.stop();

        yield* this.fader.generate_fade_out();
        // ...
        delete this.game_session;

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

};








