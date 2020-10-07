
import * as fsm from "../system/finite-state-machine.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as gameinput from "../game-input.js";
import * as ui from "../system/ui.js";
import * as anim from "../system/animation.js";
import { random_int } from "../system/utility.js";

function shaky_position(){
    return graphics.canvas_center_position()
        .translate({ x: random_int(0,10), y: random_int(0, 10)});
}

class MyStates extends fsm.State {

    constructor(name){
        super();
        this.name = name;
        this._yop = 0;
    }

    *enter(){
        this.state_machine.textbox.text = `Entering ${this.name} ...`;
        yield* anim.wait(500);
        this.state_machine.textbox.text = this.name;
    }

    update(delta_time){
        this._yop += delta_time;

        const change_frequency = 300;
        if(this._yop > change_frequency){
            this.state_machine.textbox.position = shaky_position();
            this._yop -= change_frequency;
        }
    }

    *leave(){
        this.state_machine.textbox.text = `Exiting ${this.name} ...`;
        yield* anim.wait(500);
    }
}

class MainMenu extends MyStates {
    color = "pink";
    constructor(){ super("Main Menu"); }
}

class Credits extends MyStates {
    color = "grey";
    constructor(){ super("Credits"); }
}

class GameSession extends MyStates {
    color = "orange";
    constructor(){ super("Game"); }
}

class InGameMenu extends MyStates {
    color = "red";
    constructor(){ super("Game Menu"); }
}

class Editor extends MyStates {
    color = "purple";
    constructor(){ super("Editor"); }
}


class GameStateMachine extends fsm.StateMachine {

    textbox = new ui.Text({
        text: "READY",
        font: "20px Space Mono",
        position: graphics.canvas_center_position(),
    });

    constructor(canvas_context){
        super({ // States: state_id: state_object
            main_menu: new MainMenu(),
            credits: new Credits(),
            game: new GameSession(),
            game_menu: new InGameMenu(),
            editor: new Editor(),
        },
        { // Transition table
            initial_state: "main_menu",
            main_menu: {
                down : "game",
                left : "credits",
            },
            credits: { right : "main_menu" },
            game: {
                up : "main_menu",
                down: "game_menu",
                right: "editor",
            },
            editor: { left: "game" },
            game_menu: {
                up: "game",
                right: "main_menu",
            }
        });

        this.canvas_context = canvas_context;
    }

    update(delta_time){

        if(input.keyboard.is_just_down(gameinput.KEY.UP_ARROW)){
            game_statemachine.push_action("up");
        }
        if(input.keyboard.is_just_down(gameinput.KEY.RIGHT_ARROW)){
            game_statemachine.push_action("right");
        }
        if(input.keyboard.is_just_down(gameinput.KEY.DOWN_ARROW)){
            game_statemachine.push_action("down");
        }
        if(input.keyboard.is_just_down(gameinput.KEY.LEFT_ARROW)){
            game_statemachine.push_action("left");
        }

        Object.values(this).filter(member => member instanceof Object && member.update instanceof Function)
            .map(member=> member.update(delta_time));


        super.update(delta_time);
    }

    render_graphics(){
        const current_state = this.current_state;
        if(current_state){
            graphics.draw_rectangle(this.canvas_context, graphics.canvas_rect(), current_state.color);
        }


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





