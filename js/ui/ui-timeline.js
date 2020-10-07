export {
    Timeline,
}


import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";
import * as texts from "../definitions-texts.js";

import { config } from "../game-config.js";
import { Vector2, Rectangle, is_point_under } from "../system/spatial.js";
import { CharacterView } from "../view/character-view.js";
import { show_info } from "./ui-infobox.js";

const timeline_config = {
    line_width: 16,
    line_color: "white",
    line_shift_x: 36,
    space_between_elements: 64,
};

const translation_between_positions = new Vector2({ y: timeline_config.space_between_elements });

const new_cycle = {
    text: "New Cycle",
    text_color: "white",
    text_padding: { x: 8, y: 6 },
    background_color: "orange",
    font: "20px Space Mono",
    width: 150,
    height: 30,
    position_shift: function(){
        return {
            x: -40,
            y: (timeline_config.space_between_elements / 2) - (this.height/2),
        };
    },
};

class CycleChangeMarker
{
    constructor(position){
        this.position = new Vector2(position);
    }

    update(delta_time){

    }

    render_graphics(canvas_context){
        const position = this.position.translate(new_cycle.position_shift());

        graphics.draw_rectangle(canvas_context, {
            position: position,
            width: new_cycle.width, height: new_cycle.height,
        }, new_cycle.background_color);

        graphics.draw_text(canvas_context, new_cycle.text, position.translate(new_cycle.text_padding), {
            color: new_cycle.text_color,
            font: new_cycle.font,
        });
    }
};

class Timeline
{
    constructor(position, view_finder, visibility_predicate){
        console.assert(view_finder instanceof Function);
        console.assert(visibility_predicate instanceof Function);
        this.position = new Vector2(position);
        this._view_finder = view_finder;
        this._is_entity_visible = visibility_predicate;
        this._character_views = [];
    }

    visible = true;

    update(delta_time, character, world){
        console.assert(world instanceof concepts.World);

        if(!this.visible || !config.enable_timeline)
            return;

        // BEWARE: DO NOT UPDATE CHARACTER VIEWS HERE, THEY ARE ALREADY UPDATED INSIDE THE GAME!
        if(this._need_refresh) {
            this._refresh(world);
        }

        const pointed_slot = this.pointed_slot(input.mouse.position);
        if(pointed_slot){
            const character_view = this._character_views[pointed_slot.idx];
            if(character_view instanceof CharacterView)
                show_info(texts.ui.timeline);
            else
                show_info(texts.ui.new_cycle);
        }


    }

    request_refresh(turn_ids_sequence){
        this._need_refresh = true;
        this._turn_ids_sequence = turn_ids_sequence;
    }

    _refresh(){
        console.assert(this._turn_ids_sequence instanceof Object);
        console.assert(this._turn_ids_sequence.this_turn_ids instanceof Array);
        console.assert(this._turn_ids_sequence.next_turn_ids instanceof Array);

        this._character_views = [];

        // Now we can gather the views:
        this._add_character_views(this._turn_ids_sequence.this_turn_ids);
        this._character_views.push(new CycleChangeMarker()); // Mark the beginning of the next turn.
        this._add_character_views(this._turn_ids_sequence.next_turn_ids);

        delete this._turn_ids_sequence;
        this._need_refresh = false;
    }

    _add_character_views(character_ids) {
        console.assert(character_ids instanceof Array);
        for(const character_id of character_ids) {
            console.assert(Number.isInteger(character_id));
            const character_view = this._view_finder(character_id);
            if(character_view){
                console.assert(character_view instanceof CharacterView);
                if(!this._is_entity_visible(character_view.game_position))
                    continue; // Don't show characters that are not visible to the player on the timeline.
                this._character_views.push(character_view);
            }

        };
    }

    draw(canvas_context){
        if(!this.visible || !config.enable_timeline)
            return;

        this._draw_line(canvas_context);
        this._draw_cycle_clock(canvas_context);
        this._draw_characters(canvas_context);
        this._draw_current_turn_arrow(canvas_context);
        this._draw_locator(canvas_context);
    }

    _draw_cycle_clock(canvas_context){

    }

    _draw_line(canvas_context){
        const line_length = (this._character_views.length + 2) * timeline_config.space_between_elements;

        canvas_context.save();
        canvas_context.beginPath();

        canvas_context.strokeStyle = timeline_config.line_color;
        canvas_context.lineWidth = timeline_config.line_width;
        canvas_context.lineCap = "round";

        canvas_context.moveTo(this.position.x+timeline_config.line_shift_x, this.position.y);
        canvas_context.lineTo(this.position.x+timeline_config.line_shift_x, this.position.y + line_length);

        canvas_context.stroke();
        canvas_context.restore();
    }

    *position_sequence(){
        let position = this.position;
        while(true){
            position = position.translate(translation_between_positions);
            yield position;
        }
    }

    _draw_characters(canvas_context){

        const position_sequence = this.position_sequence();
        const next_position = ()=> position_sequence.next().value;

        this._character_views.forEach(view=>{
            const initial_position = view.position;
            view.position = next_position();
            if(view.is_being_destroyed){
                view.for_each_sprite(sprite=>sprite.reset_origin());
            }
            view.render_graphics(canvas_context);
            if(view.is_being_destroyed){
                view.for_each_sprite(sprite=>sprite.move_origin_to_center());
            }
            view.position = initial_position;
        });
    }

    pointed_slot(pointed_position){
        // TODO: cache the result to be used for the whole frame.
        const position_sequence = this.position_sequence();
        const next_position = ()=> position_sequence.next().value;

        for(let idx = 0; idx < this._character_views.length; ++idx){
            const position = next_position();
            const slot_rect = new Rectangle({ position, width: timeline_config.space_between_elements, height: timeline_config.space_between_elements });
            if(is_point_under(pointed_position, slot_rect)){ // This assumes we are in the screen space.
                return { idx, slot_rect };
            }
        }
    }

    get is_mouse_over() { return this.pointed_slot(input.mouse.position) !== undefined; }
    is_under(position) { return this.pointed_slot(position) !== undefined; }

    _draw_locator(canvas_context){
        const pointed_slot = this.pointed_slot(input.mouse.position);
        if(!pointed_slot)
            return;

        const character_view = this._character_views[pointed_slot.idx];
        if(!(character_view instanceof CharacterView))
            return;

        const character_gfx_position = character_view.position.translate(graphics.camera.position.inverse);

        const position = pointed_slot.slot_rect.position;
        const width = pointed_slot.slot_rect.width;
        const height = pointed_slot.slot_rect.height;
        canvas_context.save();

        canvas_context.lineWidth = 4;
        canvas_context.strokeStyle = "#ffffffff";

        canvas_context.strokeRect(position.x, position.y, width, height);
        canvas_context.beginPath();
        canvas_context.moveTo(character_gfx_position.x, character_gfx_position.y);
        canvas_context.lineTo(position.x, position.y);
        canvas_context.stroke();
        canvas_context.strokeRect(character_gfx_position.x, character_gfx_position.y, character_view.width, character_view.height);

        canvas_context.restore();
    }

    _draw_current_turn_arrow(canvas_context){
        if(this._character_views.length === 0)
            return;

        canvas_context.save()
        canvas_context.beginPath();

        let position = this.position.translate(translation_between_positions)
                            .translate({ y: timeline_config.space_between_elements / 4 });

        if(this._character_views[0] instanceof CycleChangeMarker){
            position = position.translate({ x: -60 });
        }

        const stroke_positions = [
            position,
            position.translate({ y: timeline_config.space_between_elements / 2 }),
            position.translate({ x: 24, y: timeline_config.space_between_elements / 4 }),
        ];

        canvas_context.fillStyle = "white";
        canvas_context.moveTo(stroke_positions[0].x, stroke_positions[0].y);
        canvas_context.lineTo(stroke_positions[1].x, stroke_positions[1].y);
        canvas_context.lineTo(stroke_positions[2].x, stroke_positions[2].y);
        canvas_context.fill();

        canvas_context.restore();
    }

};

