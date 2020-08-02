export {
    GameScreen,

}

import * as fsm from "./system/finite-state-machine.js";

import * as game_input from "./game-input.js";
import { GameView } from "./game-view.js";
import { Game } from "./game.js";
import { make_test_world } from "./testing/test-level.js";

class GameScreen extends fsm.State {

    *enter(){
        this.game = new Game(make_test_world());
        this.game_view = new GameView(this.game);
        game_input.begin_game(this.game, this.game_view);
    }

    *leave(){
        // ...
        game_input.end_game();
        delete this.game;
        delete this.game_view;
    }

    update(delta_time){
        game_input.update(delta_time);
        this.game_view.update(delta_time);
    }

    display(){
        this.game_view.render_graphics();
    }

};








