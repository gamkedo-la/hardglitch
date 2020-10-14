export {
    Screen_Demo,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";
import { Vector2_origin } from "./system/spatial.js";
import { invoke_on_members } from "./system/utility.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { KEY } from "./game-input.js";
import { load_random_test_level } from "./main.js";


class Screen_Demo extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,0,0);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);
        this.ui = {
            message : new ui.Text({
                text: "End of the DEMO - More too come very soon!",
                font: "52px Space Mono",
                position: graphics.canvas_center_position().translate({x:-300, y:-200}),
            }),
            button_retry : new ui.TextButton({
                text: "Play Again [SPACE]",
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.retry_new_game(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
            button_random_level : new ui.TextButton({
                text: "Random Test Level",
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { load_random_test_level(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
            button_back : new ui.TextButton({
                text: "End Game [TAB]",
                position: Vector2_origin,
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.back_to_main_menu(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };
        // Center the buttons in the screen.
        let button_pad_y = 0;
        const next_pad_y = () => {
            const result = button_pad_y;
            button_pad_y += 80;
            return result;
        };
        Object.values(this.ui).forEach(button => {
            const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
            button.position = center_pos.translate({ x:0, y: next_pad_y() });
        });
    }

    *enter(level_to_play){
        debug.assertion(()=>Number.isInteger(level_to_play) || level_to_play !== undefined);
        this._level_to_play = level_to_play;
        if(!this.ui){
            this._init_ui();
        }

        audio.playEvent(music_id.gameover_failure);
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        audio.stopEvent(music_id.gameover_failure);
        yield* this.fader.generate_fade_out();
    }

    back_to_main_menu(){
        this.state_machine.push_action("back");
    }

    retry_new_game(){
        this.state_machine.push_action("retry", this._level_to_play);
    }


    update(delta_time){
        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.ESCAPE)){
                this.back_to_main_menu();
            } else if(input.keyboard.is_just_down(KEY.SPACE)){
                this.retry_new_game();
            } else{
                invoke_on_members(this.ui, "update", delta_time);
            }
        }
        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        invoke_on_members(this.ui, "draw", canvas_context);

        this.fader.display(canvas_context);
    }


    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};




