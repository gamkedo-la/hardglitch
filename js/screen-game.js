export {
    GameScreen,

}


import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";

import { KEY } from "./game-input.js";

import * as editor from "./editor.js";
import { ScreenFader } from "./system/screenfader.js";
import { GameSession } from "./game-session.js";

class GameScreen extends fsm.State {
    fader = new ScreenFader();

    *enter(level){
        if(!this.game_session){
            this.game_session = new GameSession(level);
        }

        yield* this.fader.generate_fade_in();

        this.game_session.start();
    }

    *leave(){
        this.game_session.stop();

        yield* this.fader.generate_fade_out();
        // ...
        delete this.game_session;
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(this.fader.is_fading) // No input handled until the fades are done.
            return;

        this.game_session.update(delta_time);

        //// TEMPORARY: FIXME: should be a sub-state
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            editor.switch_editor(this.game_session);
        }

        const ongoing_target_selection = this.game_session.view.ui.is_selecting_action_target;
        if(!ongoing_target_selection
        && this.game_session.view.is_time_for_player_to_chose_action
        && !input.mouse.is_dragging
        )
            editor.update(delta_time);

        ////////////////////////////////

    }

    display(canvas_context){
        console.assert(canvas_context); // TODO: pass this canvas_context to the functions below and handle them.

        this.game_session.display(canvas_context);

        if(!this.fader.is_fading)
            editor.display(); // TODO: this is a hack, make it work better

        this.fader.display(canvas_context);
    }

};








