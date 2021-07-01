export {
    Timeline,
}

import * as debug from "../system/debug.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";
import * as texts from "../definitions-texts.js";

import { config } from "../game-config.js";
import { Vector2, Rectangle, is_point_under } from "../system/spatial.js";
import { CharacterView } from "../view/character-view.js";
import { show_info } from "./ui-infobox.js";
import { EntityView, square_half_unit_vector } from "../view/entity-view.js";
import { corruption_turns_to_update } from "../rules/rules-corruption.js";

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

const cycle_counter = {
    text_color: "white",
    font: "18px Space Mono",
}

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
        debug.assertion(()=>view_finder instanceof Function);
        debug.assertion(()=>visibility_predicate instanceof Function);
        this.position = new Vector2(position);
        this._view_finder = view_finder;
        this._is_entity_visible = visibility_predicate;
        this._character_views = [];
    }

    visible = true;
    is_corruption_visible = false;

    update(delta_time, character, world){
        debug.assertion(()=>world instanceof concepts.World);

        this.cycle_count = world.turn_id;

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
        debug.assertion(()=>this._turn_ids_sequence instanceof Object);
        debug.assertion(()=>this._turn_ids_sequence.this_turn_ids instanceof Array);
        debug.assertion(()=>this._turn_ids_sequence.next_turn_ids instanceof Array);

        this._character_views = [];

        // Now we can gather the views:
        this._add_character_views(this._turn_ids_sequence.this_turn_ids);
        this._character_views.push(new CycleChangeMarker()); // Mark the beginning of the next turn.
        this._add_character_views(this._turn_ids_sequence.next_turn_ids);

        delete this._turn_ids_sequence;
        this._need_refresh = false;
    }

    _add_character_views(character_ids) {
        debug.assertion(()=>character_ids instanceof Array);
        for(const character_id of character_ids) {
            debug.assertion(()=>Number.isInteger(character_id));
            const character_view = this._view_finder(character_id);
            if(character_view){
                debug.assertion(()=>character_view instanceof CharacterView);
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

        if(this.is_corruption_visible)
            this._draw_corruption_countdown(canvas_context);

        this._draw_cycle_clock(canvas_context);

        this._draw_characters(canvas_context);
        this._draw_current_turn_arrow(canvas_context);
        this._draw_locator(canvas_context);
    }

    _draw_corruption_countdown(canvas_context){

        const text_position = this.position.translate({ x: -350, y: -10 });
        const cycles_until_corruption_update = corruption_turns_to_update - (this.cycle_count % corruption_turns_to_update);
        const text = `Corruption updates in ${cycles_until_corruption_update} Cycles`;
        const text_color = cycles_until_corruption_update < 3 ? "red" : "orange";

        canvas_context.save();

        canvas_context.fillStyle = "#00000044";
        canvas_context.fillRect(text_position.x - 4, text_position.y -4, 350, 28);

        graphics.draw_text(canvas_context, text, text_position, {
            color: text_color,
            font: cycle_counter.font,
        });

        canvas_context.restore();
    }

    _draw_cycle_clock(canvas_context){
        // Inspired by : https://stackoverflow.com/questions/22902427/javascript-canvas-drawing-an-octagon
        const sides_count = 8;
        const size = 40;
        const Xcenter = this.position.x + timeline_config.line_shift_x;
        const Ycenter = this.position.y;

        canvas_context.save();
        canvas_context.beginPath();
        canvas_context.moveTo (Xcenter +  size * Math.cos(0), Ycenter +  size *  Math.sin(0));
        for (var i = 1; i <= sides_count +1; i += 1){
            const circle_position = (i * 2 * Math.PI) + 3;
            canvas_context.lineTo (Xcenter + (size * Math.cos(circle_position / sides_count)), Ycenter + (size * Math.sin(circle_position / sides_count)));
        }
        canvas_context.fillStyle = "#6f33b1";
        canvas_context.fill();

        const text_position = this.position.translate({ x: 8, y: -16 });
        graphics.draw_text(canvas_context, `Cycle`, text_position, {
            color: cycle_counter.text_color,
            font: cycle_counter.font,
        });

        graphics.draw_text(canvas_context, `${this.cycle_count}`.padStart(4, "0"), text_position.translate({ x: 7, y: 20 }), {
            color: cycle_counter.text_color,
            font: cycle_counter.font,
        });

        canvas_context.restore();
    }

    _draw_line(canvas_context){
        const line_length = (this._character_views.length + 1.5) * timeline_config.space_between_elements;

        canvas_context.save();
        canvas_context.beginPath(); // Line

        canvas_context.strokeStyle = timeline_config.line_color;
        canvas_context.lineWidth = timeline_config.line_width;
        canvas_context.lineCap = "round";

        const top_point = { x: this.position.x + timeline_config.line_shift_x, y: this.position.y };
        const bottom_point = { x: this.position.x + timeline_config.line_shift_x, y: this.position.y + line_length };
        canvas_context.moveTo(top_point.x, top_point.y);
        canvas_context.lineTo(bottom_point.x, bottom_point.y);

        canvas_context.stroke();

        canvas_context.beginPath(); // Triangle
        canvas_context.fillStyle = timeline_config.line_color;
        const triangle_width = 60;
        const triangle_height = 40;
        canvas_context.moveTo(bottom_point.x - (triangle_width  / 2), bottom_point.y);
        canvas_context.lineTo(bottom_point.x + (triangle_width  / 2), bottom_point.y);
        canvas_context.lineTo(bottom_point.x, bottom_point.y + triangle_height);
        canvas_context.fill();

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
            const initial_sprite_positions = [];
            const initial_position = view.position;

            if(view instanceof EntityView)
                view.for_each_sprite(sprite => initial_sprite_positions.push(sprite.position));

            view.position = next_position();
            if(view.is_being_destroyed){
                view.position = view.position.translate(square_half_unit_vector);
            }
            view.render_graphics(canvas_context);

            view.position = initial_position;

            if(view instanceof EntityView)
                view.for_each_sprite(sprite => sprite.position = initial_sprite_positions.shift());
        });
    }

    pointed_slot(pointed_position){
        return this.find_slot((view, pos, slot_rect) => is_point_under(pointed_position, slot_rect));
    }

    find_slot(predicate) {
        debug.assertion(()=>predicate instanceof Function);

        const position_sequence = this.position_sequence();
        const next_position = ()=> position_sequence.next().value;

        for(let idx = 0; idx < this._character_views.length; ++idx){
            const character_view = this._character_views[idx];
            const position = next_position();
            const slot_rect = new Rectangle({ position, width: timeline_config.space_between_elements, height: timeline_config.space_between_elements });
            if(predicate(character_view, position, slot_rect)){
                return { idx, slot_rect };
            }
        }
    }

    get is_mouse_over() { return this.pointed_slot(input.mouse.position) !== undefined; }
    is_under(position) { return this.pointed_slot(position) !== undefined; }

    _draw_locator(canvas_context){

        let pointed_slot = this.pointed_slot(input.mouse.position);
        if(!pointed_slot){
            pointed_slot = this.find_slot(character_view => character_view.is_mouse_over);
        }

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

        canvas_context.strokeRect(position.x, position.y, width, height); // Around the timeline character.
        canvas_context.strokeRect(character_gfx_position.x, character_gfx_position.y, character_view.width, character_view.height); // Around the real character.

        canvas_context.beginPath();
        canvas_context.moveTo(character_gfx_position.x, character_gfx_position.y);
        canvas_context.lineTo(position.x, position.y);
        canvas_context.stroke();

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

