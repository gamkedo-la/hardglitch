// This file contains the code deciding how to display characters.

export {
    CharacterView,
}

import * as debug from "../system/debug.js";
import * as ui from "../system/ui.js";
import { config, fov_view_styles } from "../game-config.js";
import { EntityView, graphic_position, PIXELS_PER_HALF_SIDE, PIXELS_PER_TILES_SIDE } from "./entity-view.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { Sprite } from "../system/graphics.js";
import { update_stat_bar } from "../ui/ui-characterstatus.js";
import { positions_in_range } from "../core/visibility.js";

// Representation of a character's body.
class CharacterView extends EntityView {

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super(character.id, character.position, character.assets);
        this._character = character;
        this.name = character.name;
        this.description = character.description;
        this.is_floating = character.is_floating ? true : false;
        this._fov_sprite = new Sprite(sprite_defs.vision);

        this._health_bar = new ui.Bar({
            position: this.position.translate( {x:2} ),
            width: PIXELS_PER_TILES_SIDE - 4, height: 8,
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

        this._health_bar.position = this.position;
        this._health_bar.update(delta_time);
    }

    change_health(new_health){
        this._health_bar.value = new_health;
    }

    sync_health(){
        update_stat_bar(this._health_bar, this._character.stats.integrity);
    }

    render_graphics(canvas_context){
        if(this.is_virus && !this._has_infected_shadow){
            this._has_infected_shadow = true;
            this.set_shadow(sprite_defs.shadow_red);
        }
        super.render_graphics(canvas_context);

        this._health_bar.position = this.position;
        if(!this.is_being_destroyed
        && (config.enable_view_healthbars
            || config.force_view_healthbars
            || this._health_bar.is_changing
            || this._health_bar.value_ratio != 1.0
            )
        ){
            this.draw_health_bar(canvas_context);
        }
    }

    draw_extra_info(canvas_context){
        this.draw_fov(canvas_context);
        this.draw_health_bar(canvas_context);
    }

    draw_health_bar(canvas_context){
        this._health_bar.draw(canvas_context);
    }

    draw_fov(canvas_context){
        canvas_context.save();

        canvas_context.lineWidth = 0;

        const dangerous_position_color = "#ff111155";
        const normal_position_color = "#ffffff55";

        const draw_square = (gfx_pos, color)=>{
            canvas_context.fillStyle = color;
            canvas_context.fillRect(gfx_pos.x, gfx_pos.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);
        }

        const draw_eye = (gfx_pos, color) => {
            canvas_context.fillStyle = color;
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
                draw_func = (gfx_pos, color)=>{
                    draw_square(gfx_pos, color);
                    draw_eye(gfx_pos, color);
                };
                break;

            default:
                draw_func = draw_square;
        }

        const attack_positions = this._character.get_all_enabled_actions_types()
            .filter(action_type => action_type.is_attack)
            .flatMap(action_type=>{
                const range = action_type.range instanceof Function ? action_type.range(this._character) : action_type.range;
                return positions_in_range(this._character.position, range);
            })
            .filter((pos, index, self) => index === self.findIndex((t) => t.equals(pos))) // Remove duplicates.
            ;

        this._character.field_of_vision.visible_walkable_positions.forEach(position => {
            if(position.equals(this._character.position)) // Ignore the square where this entity is.
                return;
            const gfx_pos = graphic_position(position);
            const is_dangerous = attack_positions.some(attack_pos => attack_pos.equals(position));
            const color = is_dangerous ? dangerous_position_color : normal_position_color;
            if(is_dangerous){
                canvas_context.save();

                if(!this._character.is_player_actor){
                    const rect_line_width = 4;
                    const rect_padding = rect_line_width / 2;
                    canvas_context.strokeStyle = "red"
                    canvas_context.lineWidth = rect_line_width;
                    canvas_context.beginPath();
                    canvas_context.rect(gfx_pos.x + rect_padding, gfx_pos.y + rect_padding, PIXELS_PER_TILES_SIDE - rect_padding * 2, PIXELS_PER_TILES_SIDE - rect_padding * 2);
                    canvas_context.stroke();
                }

                canvas_context.fillStyle = dangerous_position_color;
                canvas_context.fillRect(gfx_pos.x, gfx_pos.y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);

                canvas_context.restore();
            }

            draw_func(gfx_pos, color);
        });
        canvas_context.restore();
    }

};



