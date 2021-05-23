// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import * as debug from "../system/debug.js";
import * as graphics from "../system/graphics.js";
import * as ui from "../system/ui.js";
import { config, fov_view_styles } from "../game-config.js";
import { EntityView, graphic_position, PIXELS_PER_HALF_SIDE, PIXELS_PER_TILES_SIDE, square_half_unit_vector } from "./entity-view.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { Sprite } from "../system/graphics.js";
import { update_stat_bar } from "../ui/ui-characterstatus.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super(character.id, character.position, character.assets);
        this._character = character;
        this.is_floating = character.is_floating ? true : false;
        this._fov_sprite = new Sprite(sprite_defs.vision);

        this._health_bar = new ui.Bar({
            position: this.position,
            width: PIXELS_PER_TILES_SIDE, height: 8,
            bar_name: "NEVER SHOW THIS TEXT bar_name",
            help_text: "NEVER SHOW THIS TEXT help_text",
            visible: true,
            bar_colors:{
                value: "#FF006E",
                change_negative: "#FB5607",
                change_positive: "#ffffff",
                preview: "#8338EC",
                background:"#3A86FF",
            }
        });
        this._health_bar.short_text.visible = false;

        update_stat_bar(this._health_bar, this._character.stats.integrity);
    }

    get is_player() { return this._character.is_player_actor; }

    get is_virus() { return this._character.is_virus; }

    update(delta_time){
        super.update(delta_time);

        this._health_bar._last_delta_time = delta_time;
    }

    change_health(new_health){
        this._health_bar.value = new_health;
    }

    render_graphics(canvas_context){
        if(this.is_virus && !this._has_infected_shadow){
            this._has_infected_shadow = true;
            this.set_shadow(sprite_defs.shadow_red);
        }
        super.render_graphics(canvas_context);

        this._health_bar.position = this.position;
        this._health_bar.update(this._health_bar._last_delta_time);
        if(config.enable_view_healthbars)
            this._health_bar.draw(canvas_context);
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

        const draw_eye_sprite = (gfx_pos) => {
            this._fov_sprite.position = gfx_pos;
            this._fov_sprite.draw(canvas_context);
        }


        let draw_func;
        switch(config.fov_view_style){

            case fov_view_styles.EYE:
                draw_func = draw_eye;
                break;
            case fov_view_styles.EYE_SPRITE:
                draw_func = draw_eye_sprite;
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



