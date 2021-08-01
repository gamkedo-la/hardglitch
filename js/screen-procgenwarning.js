export {
    ProcgenWarningScreen,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";
import { auto_newlines, invoke_on_members } from "./system/utility.js";
import { KEY } from "./game-input.js";
import { LifeForm_Weak } from "./characters/lifeform.js";
import { CharacterView } from "./view/character-view.js";
import { sprite_defs } from "./game-assets.js";

class ProcgenWarningScreen extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(0,0,0);
    }

    _init_ui(){
        debug.assertion(()=>this.ui === undefined);
        this.ui = {
            message : new ui.Text({
                text: auto_newlines(
`--==# THE COMPUTER WORLD CHANGES CONSTANTLY ##==--

If you are stuck, you can retry the game: the world will have changed and will probably be easier.

Tips and help can be found in the menu (top left of the screen).

Use the 'Save & Exit' button in the menu to save the game and continue another time.


`, 80),
                color: "white",
                background_color: "0x00000000",
                text_align: "center",
            }),
            button_continue : new ui.TextButton({
                text: "Continue [SPACE]",
                sprite_def: sprite_defs.button_menu,
                action: ()=> { this.go_to_next_screen(); },
                sounds:{
                    over: 'selectButton',
                    down: 'clickButton',
                }
            }),
        };
        this.ui.message.position = graphics.canvas_center_position().translate({ y: -200 });

        // Center the buttons in the screen.
        let button_pad_y = 100;
        const next_pad_y = () => {
            const result = button_pad_y;
            button_pad_y += 80;
            return result;
        };
        Object.values(this.ui).forEach(button => {
            if(!(button instanceof ui.Button))
                return;
            const center_pos = this.ui.message.position.translate({ x: -button.area.width / 2,  y: (this.ui.message.area.height / 2) + button.area.height });
            button.position = center_pos.translate({ x:0, y: next_pad_y() });
        });

        this.life_form = new CharacterView(new LifeForm_Weak());
        const canvas_rect = graphics.canvas_rect();
        const width_part = Math.round(canvas_rect.width / 5.0);
        const height_part = Math.round(canvas_rect.height / 5.0);
        this.life_form.starting_position = { x: width_part, y: canvas_rect.height -  height_part };
        this.life_form.position = this.life_form.starting_position;
        this.life_form.force_visible = true;
        this.life_form.direction = 1.0;
    }

    *enter(level_to_play, ...data){
        this.level_to_play = level_to_play;
        this.other_data = data;
        if(!this.ui){
            this._init_ui();
        }
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    go_to_next_screen(){
        this.state_machine.push_action("ok", this.level_to_play, ...this.other_data);
    }

    update(delta_time){

        if(!this.fader.is_fading && !window.is_mouse_over_mute_button()){
            if(input.keyboard.is_just_down(KEY.SPACE)){
                this.go_to_next_screen();
            } else {
                invoke_on_members(this.ui, "update", delta_time);
            }
        }

        const speed = 1;
        if(this.life_form.position.x > this.life_form.starting_position.x + 50
        || this.life_form.position.x < this.life_form.starting_position.x
        ){
            this.life_form.direction = -this.life_form.direction;
        }
        this.life_form.position = this.life_form.position.translate({ x: (delta_time / 100) * speed * this.life_form.direction });
        this.life_form.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");

        invoke_on_members(this.ui, "draw", canvas_context);

        this.life_form.render_graphics(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        this._init_ui();
    }

};
