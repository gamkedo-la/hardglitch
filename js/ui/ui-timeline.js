export {
    Timeline,
}


import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";

import { Vector2 } from "../system/spatial.js";
import { CharacterView } from "../view/character-view.js";

const timeline_config = {
    line_width: 16,
    line_color: "white",
    line_shift_x: 36,
    space_between_elements: 64,
};

const new_cycle_text = "New Cycle";

class CycleChangeMarker
{
    constructor(position){
        this.position = new Vector2(position);
    }

    update(delta_time){

    }

    render_graphics(canvas_context){
        const position = this.position.translate({ x: -20, y: timeline_config.space_between_elements / 2 });

        graphics.draw_rectangle(canvas_context, {
            position: position,
            width: 100, height: 24
        }, "purple");

        graphics.draw_text(canvas_context, new_cycle_text, position.translate({ x: 4, y: 4 }));
    }
};

class Timeline
{
    constructor(position, view_finder, visibility_predicate){
        console.assert(view_finder instanceof Function);
        console.assert(visibility_predicate instanceof Function);
        this.position = new Vector2(position);
        this._view_finder = view_finder;
        this._is_visible = visibility_predicate;
        this._character_views = [];

    }

    update(delta_time, world){
        console.assert(world instanceof concepts.World);
        // BEWARE: DO NOT UPDATE CHARACTER VIEWS HERE, THEY ARE ALREADY UPDATED INSIDE THE GAME!
        if(this._need_refresh) {
            this._refresh(world);
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
            console.assert(character_view instanceof CharacterView); // NOT SURE IF WE ALLOW UNDEFINED OR NOT????
            if(!this._is_visible(character_view.game_position))
                continue; // Don't show characters that are not visible to the player on the timeline.
            this._character_views.push(character_view);
        };
    }

    draw(canvas_context){
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

    _draw_characters(canvas_context){
        const translation_between_positions = new Vector2({ y: timeline_config.space_between_elements });
        let position = this.position;
        const next_position = ()=>{
            position = position.translate(translation_between_positions);
            return position;
        }

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

    _draw_locator(canvas_context){

    }

    _draw_current_turn_arrow(canvas_context){

    }

};

