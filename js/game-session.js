export {
    GameSession
}

import * as game_input from "./game-input.js";
import * as editor from "./editor.js";

import { Game } from "./game.js";
import { GameView } from "./game-view.js";
import { make_test_world } from "./testing/test-level.js";


import * as level1 from "./levels/level1.js";

// Gather all the data and systems that are needed to play a game level.
// This is manipulated by some other systems, like the screen state, the game-input system, the editor etc.
class GameSession {

    constructor(level){
        if(level === "test"){
            this.game = new Game(make_test_world());
        } else {
            this.game = new Game(level1.generate_world());
        }

        this.view = new GameView(this.game);
        this.view.update(0); // Update the camera state.
    }

    start(){
        game_input.begin_game(this);
    }

    stop(){
        game_input.end_game();
    }

    update(delta_time){
        const is_player_action_allowed = !editor.is_enabled;
        const is_camera_dragging_allowed = !editor.is_editing;
        game_input.update(delta_time, is_player_action_allowed, is_camera_dragging_allowed);

        this.view.update(delta_time);
    }

    display(canvas_context){
        this.view.render_graphics(); // TODO: pass the canvas context.
    }

};



