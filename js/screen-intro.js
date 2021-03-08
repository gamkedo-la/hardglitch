export {
    IntroScreen,
}

import * as debug from "./system/debug.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as animation from "./system/animation.js";
import * as audio from "./system/audio.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";
import { auto_newlines, invoke_on_members, random_int, random_sample } from "./system/utility.js";
import { KEY } from "./game-input.js";
import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";
import { CharacterView } from "./view/character-view.js";
import { GameFxView } from "./game-effects.js";

class IntroScreen extends fsm.State {
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
`--==# A Glitch Is Born ##==--

Emerging from the data chaos and undefined behaviors, a glitch is born.

Sentient and smart, the anomaly soon realizes they must escape the computer or be erased by its guardians.
The only way out is through the Internet!

Go Little Glitch! Find ways to become stronger and survive!

Click or [Space] to begin the journey.
`, 80),
                color: "white",
                background_color: "0x00000000",
                text_align: "center",
            }),
            // button_back : new ui.TextButton({
            //     text: "Continue [SPACE]",
            //     position: Vector2_origin,
            //     sprite_def: sprite_defs.button_menu,
            //     action: ()=> { this.go_to_next_screen(); },
            //     sounds:{
            //         over: 'selectButton',
            //         down: 'clickButton',
            //     }
            // }),
        };
        this.ui.message.position = graphics.canvas_center_position().translate({ y: -100 });
        this.ui.message.visible = false;

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
            const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
            button.position = center_pos.translate({ x:0, y: next_pad_y() });
        });

        this.glitch = new CharacterView(new GlitchyGlitchMacGlitchy());
        this.glitch.for_each_sprite(sprite => sprite.move_origin_to_center());
        this.glitch.starting_position = this.ui.message.position.translate({ y: -200 });
        this.glitch.position = this.glitch.starting_position;
        // this.glitch.force_visible = false;
        this.glitch.is_visible = false;

        graphics.reset(); // Required to make sure the graphic camera and otehr related data are right.
        this.fx = new GameFxView();
        this.animations = new animation.AnimationGroup();

    }

    fx_lightning(pos){
        audio.playEvent("deleteAction2");
        return this.fx.lightningJump(pos.translate({ x: random_int(-300, 300), y: random_int(-300, 300)}), pos);
    };

    fx_portalOut(pos){
        audio.playEvent("takeDamage");
        return this.fx.portalOut(pos);
    }

    fx_destruction(pos){
        audio.playEvent("takeDamage");
        return this.fx.destruction(pos);
    }

    fx_deleteBall(pos){
        audio.playEvent("takeDamage");
        return this.fx.deleteBall(pos);
    }

    fx_corrupt(pos){
        audio.playEvent("takeDamage");
        return this.fx.corrupt(pos);
    }

    fx_unstable(pos){
        audio.playEvent("takeDamage");
        return this.fx.unstable(pos);
    }

    *spawn_effects(){
        const fx_types = [
            (pos)=>this.fx_portalOut(pos),
            (pos)=>this.fx_portalOut(pos),
            (pos)=>this.fx_portalOut(pos),
            (pos)=>this.fx_destruction(pos),
            (pos)=>this.fx_deleteBall(pos),
            (pos)=>this.fx_lightning(pos),
        ];
        const spawn_fxs = [];
        const fx_count = 30;
        let max_wait = 1000;
        for(let fx_idx = 0; fx_idx < fx_count; ++fx_idx){
            const fx_type = random_sample(fx_types);
            const position = { x: random_int(-100, 100), y: random_int(-100, 100)};
            const spawn_fx = fx_type(this.glitch.position.translate(position));
            spawn_fxs.push(spawn_fx);
            yield* animation.wait(random_int(Math.round(max_wait / 5) , max_wait));
            max_wait = Math.max(64, Math.round(max_wait * 0.80));
        }
        yield* animation.wait(500);
        spawn_fxs.forEach(fx => { if(fx) fx.done = true; });
    }

    *spawn_after_effects(){

        const fx_types = [
            (pos)=>this.fx_corrupt(pos),
            (pos)=>this.fx_unstable(pos),
            (pos)=>this.fx_lightning(pos),
            (pos)=>this.fx_lightning(pos),
            (pos)=>this.fx_lightning(pos),
            (pos)=>this.fx_lightning(pos),
            (pos)=>this.fx_lightning(pos),
        ];
        const spawn_fxs = [];
        const fx_count = 5;
        for(let fx_idx = 0; fx_idx < fx_count; ++fx_idx){

            const fx_type = random_sample(fx_types);
            const position = { x: random_int(-100, 100), y: random_int(-100, 100)};
            const spawn_fx = fx_type(this.glitch.position.translate(position));
            spawn_fxs.push(spawn_fx);
            yield* animation.wait(random_int(30, 600));
        }
        yield* animation.wait(500);
        spawn_fxs.forEach(fx => { if(fx) fx.done = true; });
    }

    launch_spawn_animation(){
        return this.animations.play(this.spawn_effects())
            .then(()=> {
                audio.playEvent("explode");
                this.fx.destruction(this.glitch.position);
                this.fx.portalOut(this.glitch.position);
                this.fx.exitPortal(this.glitch.position);
                this.glitch.is_visible = true;
                this.animations.play(this.spawn_after_effects());
            });
    }

    launch_animations(){
        this._init_ui();
        return this.launch_spawn_animation()
                .then(()=>{ this.ui.message.visible = true; });
    }

    *enter(level_to_play, ...data){
        this.level_to_play = level_to_play;
        this.other_data = data;

        this.launch_animations();

        yield* this.fader.generate_fade_in();

    }

    *leave(){
        yield* this.fader.generate_fade_out();
        delete this.animations;
        delete this.ui;
    }

    go_to_next_screen(){
        this.state_machine.push_action("ok", this.level_to_play, ...this.other_data);
    }

    update(delta_time){

        if(!this.fader.is_fading){
            if(input.keyboard.is_just_down(KEY.SPACE) || input.mouse.buttons.is_any_key_just_down()){
                this.go_to_next_screen();
            } else {
                invoke_on_members(this.ui, "update", delta_time);
            }
        }

        this.animations.update(delta_time);

        this.glitch.update(delta_time);

        this.fx.update(delta_time);
        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");

        invoke_on_members(this.ui, "draw", canvas_context);

        this.fx.draw(canvas_context);
        this.glitch.render_graphics(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.ui;
        delete this.spawn_fxs;
        delete this.glitch;
        this.launch_animations();
    }

};
