export {
    GameScreen,

}


import * as input from "./system/input.js";
import * as game_input from "./game-input.js";
import * as fsm from "./system/finite-state-machine.js";

import { KEY } from "./game-input.js";
import { GameView } from "./game-view.js";
import { Game } from "./game.js";
import { make_test_world } from "./testing/test-level.js";

import * as level1 from "./levels/level1.js";

import * as editor from "./editor.js";
import { ScreenFader } from "./system/screenfader.js";

class GameScreen extends fsm.State {
    fader = new ScreenFader();

    *enter(level){
        if(level === "test"){
            this.game = new Game(make_test_world());
        } else {
            this.game = new Game(level1.generate_world());
        }

        this.game_view = new GameView(this.game);
        this.game_view.update(0);

        yield* this.fader.generate_fade_in();

        game_input.begin_game(this.game, this.game_view);
    }

    *leave(){
        game_input.end_game();

        yield* this.fader.generate_fade_out();
        // ...
        delete this.game;
        delete this.game_view;
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(this.fader.is_fading) // No input handled until the fades are done.
            return;

        game_input.update(delta_time);
        this.game_view.update(delta_time);

        //// TEMPORARY: FIXME: should be a sub-state
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            editor.switch_editor(this.game, this.game_view);
        }

        const ongoing_target_selection = this.game_view.ui.is_selecting_action_target;
        if(!ongoing_target_selection
        && this.game_view.is_time_for_player_to_chose_action
        && !input.mouse.is_dragging
        )
            editor.update(delta_time);

        ////////////////////////////////
    }

    display(canvas_context){
        console.assert(canvas_context); // TODO: pass this canvas_context to the functions below and handle them.

        this.game_view.render_graphics();

        if(!this.fader.is_fading)
            editor.display(); // TODO: this is a hack, make it work better

        this.fader.display(canvas_context);
    }

};








