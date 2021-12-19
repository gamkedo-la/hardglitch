export {
    CreditsScreen,

}

import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import * as fsm from "./system/finite-state-machine.js";
import { KEY } from "./game-input.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { auto_newlines, invoke_on_members, no_linejumps } from "./system/utility.js";
import { ScreenFader } from "./system/screenfader.js";

const credits_text =
`Game made in HomeTeamGameDev.com Outpost Group - Join us!
<br><br>
Klaim (A. Joël Lamotte): <br>Project lead, core gameplay functionality, level generation, level design, turn system, animation code,
agents/actors system, FSM v2, actions framework, in-game editor, input handling, UI, optimizations, asset integration,
menus, original placeholder art, event debug display, NPCs behavior/AI (LifeForms, Virus, Anti-Virus, Programs, etc.),
game end, spawn code, actions (jump, pull, swap, void, take item, repair, copy, others), fog of war, field of view, shadows,
camera logic, main palette, many crash fixes and tuning tweaks, inventory, crypto key authoring, loading screen, help text,
credits screen v2, camera system, steering behaviors, tweening, dammage effects, items definitions and descs
<br><br>
Tylor Allison: <br>Particle systems (glitch, trace, scan, portal, spawn, missile, color, spark, repair, wait, hex spin,
lightning jump, fade, explosion swirl, blip edge pathing), procedural tile selection and wall generation, FX randomization,
wall tiles art, decrypt/triangle animations, mock ups (tile bg, walls, void, experimentation with negative space/holes,
perspective, color tests), color adjustments, moving wall v2, level design concepts art, floor art, NPC wait animation, warm and
cool level themes, lots of asset and code cleanup, additional tile type rules, seam fix, take/drop animations, move animations,
highlights art v2, laser walls, tile overlay, title screen background, block (transparent and not) items sprites
<br><br>
Roc Lee: <br>Soundtrack (in-game, levels, victory, game over, transitions), all sound effects (jump, gameplay, UI, movement,
explosions, decrypt, editor), audio normalization, assorted sound integration
<br><br>
Ashleigh M.: <br>Description animation and related background, level transitions, character art mock ups and final sprites and animations
(virus, slime, life-forms, glitches, program, microcode, anti-virus, virus, additional animations...),
detailed playtesting, palette tweaks, font selection, texts, game-over graphics
<br><br>
Cassidy Noble: <br>Crypto key and crypto file art, items art, Assorted docs images, action and item icons, additional UI
and menu art, color corrections, highlight art v1, moving wall art v1
<br><br>
Andrew Mushel: <br>Vector/math code improvements, audio system, one shot audio integration, music stream support,
poositional audio, volume controls, mute toggle, audio loopstart/loopend system, audio compression on sounds,
<br><br>
Andy King: <br>Cursor art, including variants and hand icons
<br><br>
Allan Regush: <br>State machine v1
<br><br>
Jonathan Peterson: <br>Pause menu options
<br><br>
Antonio Malafronte: <br>Special thanks (practice commit - welcome!), playtesting, game options (ingame and in main options)
<br><br>
Patrick McKeown: <br>Item sprites (Memory Trasher, Zip, Thread-Pool, Computer Cluster, Cloner), tool to check items sprites against levels contrasts
<br><br>
Chris DeLeon: <br>Compiled credits, HometeamGamedev.com
<br><br>`;

const initial_credits_y = 100;
let credits_y = initial_credits_y;
const scroll_speed = 100;

class Credits {
    constructor(on_back_button){
        const processed_credits_text = auto_newlines(no_linejumps(credits_text).replace(/<br>/g, "\n"), 60);

        this.credits_text = new ui.Text({
            text: processed_credits_text,
            font: "22px Space Mono",
            color: "orange",
            background_color: "#42359b",
            margin_vertical: 2,
        });
        this.credits_text.position = { x: graphics.centered_rectangle_in_screen(this.credits_text).position.x, y: credits_y};

        const update_credits_y = (y_translation) => {
            this.credits_text.position = this.credits_text.position.translate({ y: y_translation });
            if(this.credits_text.area.top_left.y > initial_credits_y)
                this.credits_text.position = { x: this.credits_text.position.x, y: initial_credits_y };
            else if(this.credits_text.area.bottom_right.y < graphics.canvas_rect().height - initial_credits_y)
                this.credits_text.position = { x: this.credits_text.position.x, y: graphics.canvas_rect().height - initial_credits_y - this.credits_text.height };
        };

        this.title = new ui.Text({
            text: "CREDITS",
            font: "48px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
            color: "white",
        });

        this.title.position = {
                                x: graphics.canvas_center_position().translate({ x: -(this.title.width / 2), y: 8 }).x,
                                y: 8,
                              };

        this.back_button = new ui.TextButton({
            text: "Back To Title",
            action: on_back_button,
            position: {x:0, y:0},
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });
        this.back_button.position = {
                                        x: graphics.canvas_rect().width - this.back_button.width - 8,
                                        y: 8,
                                    };

        this.button_up = new ui.Button({
            action: ()=> { update_credits_y(scroll_speed); },
            is_action_on_up: false,
            position: {},
            sprite_def: sprite_defs.button_up,
            sounds:{
                over: 'EditorButtonHover',
                down: 'EditorButtonClick',
            }
        });
        this.button_up.position = this.credits_text.position.translate({ x: this.credits_text.width });

        this.button_down = new ui.Button({
            action: ()=> { update_credits_y(-scroll_speed); },
            is_action_on_up: false,
            position: {},
            sprite_def: sprite_defs.button_down,
            sounds:{
                over: 'EditorButtonHover',
                down: 'EditorButtonClick',
            }
        });
        this.button_down.position = this.button_up.position.translate({ y: this.button_up.height });

    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class CreditsScreen extends fsm.State {
    fader = new ScreenFader();

    create_ui(){
        this.credits = new Credits(()=> this.go_back());
    }

    *enter(){
        credits_y = initial_credits_y;
        this.create_ui();
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        audio.stopEvent(music_id.gameover_success); // In case we came from the gameover-success screen.
    }

    go_back(){
        this.state_machine.push_action("back");
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE) || input.keyboard.is_just_down(KEY.SPACE)){
            this.go_back();
        }

        if(input.keyboard.is_just_down(KEY.DOWN_ARROW) || input.keyboard.is_just_down(KEY.S)){
            this.credits.button_down.action();
        }

        if(input.keyboard.is_just_down(KEY.UP_ARROW) || input.keyboard.is_just_down(KEY.W)){
            this.credits.button_up.action();
        }

        this.credits.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "#32258b");

        this.credits.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








