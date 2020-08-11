export {
    GameSession
}

import * as game_input from "./game-input.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";
import { make_test_world } from "./testing/test-level.js";


import * as level1 from "./levels/level1.js";

// Gather all the data and systems that are needed to play a game level.
// This is manipulated by some other systems, like the screen state, the game-input system, the editor etc.
class GameSession {

    constructor(level, open_menu){
        if(level === "test"){
            this.game = new Game(make_test_world());
        } else {
            this.game = new Game(level1.generate_world());
        }

        this.view = new GameView(this.game, open_menu);
        this.view.update(0); // Update the camera state.
    }

    get is_game_finished() { return this.game.is_finished; }
    get is_any_player_character_alive() { return this.game.player_characters.length > 0; }

    get world() { return this.game.world; }

    start(){
        game_input.begin_game(this);
    }

    stop(){
        game_input.end_game();
    }

    update(delta_time, config){
        game_input.update(delta_time, config);

        this.view.update(delta_time);
    }

    display(canvas_context){
        this.view.render_graphics(canvas_context);
    }

    on_canvas_resized(){
        this.view.on_canvas_resized();
    }

};



