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
import { invoke_on_members } from "./system/utility.js";
import { ScreenFader } from "./system/screenfader.js";

const credits_text =
`Klaim (A. Joël Lamotte): Project lead, core gameplay functionality, level generation, turn system, animation code,
agents/actors system, FSM, actions framework, in-game editor, input handling, UI, optimizations, asset integration,
menus, original placeholder art, event debug display, NPCs (LifeForms, Virus, Anti-Virus, Programs), game end handling,
spawn code, actions (jump, pull, swap, void, take item, repair, copy, others), fog of war, shadows, camera logic, main
palette, many crash fixes and tuning tweaks, inventory, crypto key authoring, loading screen, help text

Tylor Allison: Particle systems (glitch, trace, scan, portal, spawn, missile, color, spark, repair, wait, hex spin,
lightning jump, fade, explosion swirl, blip edge pathing), randomization, tile wall fixes, decrypt/triangle animations,
key systems, mock ups (tile bg, walls, void, experimentation with negative space/holes, perspective, color tests), color
adjustments, moving wall variants, level design concepts, floor art, NPC wait, warm and cool level themes, lots of asset
and code cleanup, additional tile type rules, seam fix, take/drop animations, move transitions, highlights, laser walls,
tile overlay

Roc Lee: Soundtrack (in-game levels victory, game over), most sound effects (jump, gameplay, UI, movement, explosions,
decrypt, editor), audio normalization, assorted sound integration

Ashleigh M.: Description animation and related background, level transition, mock ups (character, virus sprite, slime,
additional animations), glitches, detailed playtesting, program sprite, palette tweaks, font selection

Cassidy Noble: Crypto key and crypto file, Assorted docs images, icons, additional UI and menu art, color corrections

Andrew Mushel: Vector code, one shot audio integration, music stream support, poositional audio, volume controls, mute toggle

Andy King: Cursor art, including variants and hand icons

Allan Regush: State machine

Antonio Malafronte: Special thanks (practice commit - welcome!)

Chris DeLeon: Compiled credits

Game made in HomeTeamGameDev.com Outpost Group - Join us!`;

class Credits {
    constructor(on_back_button){

        this.title = new ui.Text({
            text: "",//"CREDITS", // worked better using screen space to fit bigger credits text
            font: "80px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
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

        // FOR CHRIS: this works but will end up overflowing the screen if too big text.
        // maybe we can add some way to move the text or something.
        this.credits_text = new ui.Text({
            text: credits_text,
            font: "12px Space Mono",
            background_color: "#ffffff00",
        });
        this.credits_text.position = graphics.centered_rectangle_in_screen(this.credits_text).position;
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
        if(!this.credits){
            this.create_ui();
        }
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

        this.credits.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "grey");

        this.credits.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








