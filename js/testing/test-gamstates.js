
import * as fsm from "../system/finite-state-machine.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as gameinput from "../game-input.js";
import * as ui from "../system/ui.js";

class MainMenu extends fsm.State {


    *enter(){
        this.state_machine.textbox.text = "Main Menu";
        this.state_machine.move_text_up();
    }

}

class Credits extends fsm.State {
    *enter(){
        this.state_machine.textbox.text = "Credits";
        this.state_machine.move_text_up();
    }
}

class GameSession extends fsm.State {
    *enter(){
        this.state_machine.textbox.text = "Game!";
        this.state_machine.move_text_up();
    }
}

class InGameMenu extends fsm.State {
    *enter(){
        this.state_machine.textbox.text = "Game Menu";
        this.state_machine.move_text_up();
    }
}

class Editor extends fsm.State {
    *enter(){
        this.state_machine.textbox.text = "Editor";
        this.state_machine.move_text_up();
    }
}


class GameStateMachine extends fsm.StateMachine {

    textbox = new ui.Text({
        text: "READY",
        font: "20px arial",
        position: graphics.canvas_center_position(),
    });

    constructor(canvas_context){
        super({
            main_menu: new MainMenu(),
            credits: new Credits(),
            game: new GameSession(),
            game_menu: new InGameMenu(),
            editor: new Editor(),
        },
        {
            initial_state: "main_menu",
            main_menu: {
                next : "game"
            },
            game: {
                next : "game_menu"
            },
        });

        this.canvas_context = canvas_context;
    }

    move_text_up(){
        this.textbox.position = this.textbox.position.translate({x:0, y: -20});
    }

    update(delta_time){
        super.update(delta_time);

        Object.values(this).filter(member => member instanceof Object && member.update instanceof Function)
            .map(member=> member.update(delta_time));

    }

    render_graphics(){
        this.textbox.draw(this.canvas_context);

    }

};

const max_delta_time = 1000 / 26; // Always assume at worst that we are at 26fps
let game_statemachine;
let last_update_time = performance.now();
function get_delta_time(timestamp_now) {
    const delta_time = Math.min(max_delta_time, timestamp_now - last_update_time);
    last_update_time = timestamp_now;
    return delta_time;
}

function update(highres_timestamp){

    const delta_time = get_delta_time(highres_timestamp);

    input.update(delta_time);

    if(input.keyboard.is_just_down(gameinput.KEY.SPACE)){
        game_statemachine.push_action("next");
    }

    game_statemachine.update(delta_time);

    graphics.clear();
    game_statemachine.render_graphics();

    window.requestAnimationFrame(update);
}

window.onload = async function() {
    const canvas_context = graphics.initialize({ images: {} });
    input.initialize(canvas_context); // TODO: change that so that when we have different screens with different input situations

    game_statemachine = new GameStateMachine(canvas_context);
    game_statemachine.start();

    window.requestAnimationFrame(update);
}





