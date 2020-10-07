export {
    LoadingGameScreen,
}


import * as fsm from "./system/finite-state-machine.js";
import * as input from "./system/input.js";

// TODO: add some kind of animation so that we know it's still loading.

class LoadingGameScreen extends fsm.State {
    title = "######## HARD GLITCH ########";
    loading_status = "Loading ...";
    message = "Enjoy! :D"
    instructions = "Click To Start";

    *enter(){
    }

    *leave(){
    }

    update(){
    }

    display(canvas_context){
        canvas_context.save();
        canvas_context.fillStyle = 'black';
        canvas_context.fillRect(0,0, canvas_context.canvas.width, canvas_context.canvas.height);
        canvas_context.font = '48px Space Mono';
        canvas_context.fillStyle = 'white';

        let y = 0;
        const next_line = ()=> y += 80;

        canvas_context.fillText(this.title, 20, next_line());
        next_line();
        canvas_context.fillText(this.loading_status, 20, next_line());

        if(this.state_machine.game_is_ready === true){
            this.loading_status = "Loading - DONE";
            canvas_context.fillText(this.message, 20, next_line());
            next_line();
            canvas_context.fillText(this.instructions, 20, next_line());

            if(input.mouse.buttons.is_any_key_just_down() || input.keyboard.is_any_key_just_down()){
                this.state_machine.push_action("game_ready");
            }
        }

        canvas_context.restore();
    }

    on_canvas_resized(){

    }

};




