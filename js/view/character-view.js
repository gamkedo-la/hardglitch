// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import * as debug from "../system/debug.js";
import { config, fov_view_styles } from "../game-config.js";
import { EntityView, graphic_position, PIXELS_PER_HALF_SIDE, PIXELS_PER_TILES_SIDE } from "./entity-view.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super(character.id, character.position, character.assets);
        this._character = character;
        this.is_floating = character.is_floating ? true : false;
    }

    get is_player() { return this._character.is_player_actor; }

    get is_virus() { return this._character.is_virus; }


    render_graphics(canvas_context){
        if(this.is_virus && !this._has_infected_shadow){
            this._has_infected_shadow = true;
            this.set_shadow(sprite_defs.shadow_red);
        }
        super.render_graphics(canvas_context);
    }

    draw_fov(canvas_context){
        canvas_context.save();

        canvas_context.lineWidth = 0;

        const draw_square = (gfx_pos)=>{
            canvas_context.fillStyle = "#ffffff55";
            canvas_context.fillRect(gfx_pos.x, gfx_pos.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);
        }

        const draw_eye = (gfx_pos) => {
            canvas_context.fillStyle = "#ffffff55";
            canvas_context.beginPath();
            canvas_context.arc(gfx_pos.x + PIXELS_PER_HALF_SIDE, gfx_pos.y + PIXELS_PER_HALF_SIDE, PIXELS_PER_HALF_SIDE/2, 0, 360);
            canvas_context.fill();

            canvas_context.fillStyle = "#00000055";
            canvas_context.beginPath();
            canvas_context.arc(gfx_pos.x + PIXELS_PER_HALF_SIDE, gfx_pos.y + PIXELS_PER_HALF_SIDE, PIXELS_PER_HALF_SIDE/4, 0, 360);
            canvas_context.fill();
        }


        let draw_func;
        switch(config.fov_view_style){

            case fov_view_styles.EYE:
                draw_func = draw_eye;
                break;

            case fov_view_styles.WHITE_SQUARE:
                draw_func = draw_square;
                break;

            case fov_view_styles.EYE_ON_SQUARE:
                draw_func = (gfx_pos)=>{
                    draw_square(gfx_pos);
                    draw_eye(gfx_pos);
                };
                break;

            default:
                draw_func = draw_square;
        }

        this._character.field_of_vision.visible_walkable_positions.forEach(position => {
            if(position.equals(this._character.position)) // Ignore the square where this entity is.
                return;
            const gfx_pos = graphic_position(position);
            draw_func(gfx_pos);
        });
        canvas_context.restore();
    }

};



