export {
    LoadingGameScreen,
}


import * as fsm from "./system/finite-state-machine.js";
import * as anim from "./system/animation.js";

// TODO: add some kind of animation so that we know it's still loading.

class LoadingGameScreen extends fsm.State {
    text_to_display = "Loading ...";

    *enter(){
        const canvas = document.getElementById('gameCanvas');
        this.screen_canvas_context = canvas.getContext('2d');
    }

    *leave(){
        this.text_to_display = "Loading Done - Enjoy!"
        yield* anim.wait(500);
    }

    update(){
        this.display();
    }

    display(){
        this.screen_canvas_context.save();
        this.screen_canvas_context.font = '48px serif';
        this.screen_canvas_context.fillStyle = 'black';
        this.screen_canvas_context.fillRect(0,0, this.screen_canvas_context.canvas.width, this.screen_canvas_context.canvas.height);
        this.screen_canvas_context.fillStyle = 'white';
        this.screen_canvas_context.fillText(this.text_to_display, 20, 100);
        this.screen_canvas_context.restore();
    }

    on_canvas_resized(){

    }

};




