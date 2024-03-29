export {
    Timeline,
}

import * as debug from "../system/debug.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";
import * as texts from "../definitions-texts.js";
import * as ui from "../system/ui.js";

import { config } from "../game-config.js";
import { Vector2, Rectangle, is_point_under } from "../system/spatial.js";
import { CharacterView } from "../view/character-view.js";
import { show_info } from "./ui-infobox.js";
import { EntityView, PIXELS_PER_TILES_SIDE, square_half_unit_vector } from "../view/entity-view.js";
import { corruption_turns_to_update, Rule_Corruption, turns_until_corruption_update } from "../rules/rules-corruption.js";
import { update_stat_bar } from "./ui-characterstatus.js";
import { Arrive, Kinematics, SteeringSystem } from "../system/steering.js";

const timeline_config = {
    line_width: 16,
    line_color: "white",
    line_shift_x: 36,
    space_between_elements: 64,
};

window.timeline_steering = {
    max_acceleration: 8000.0,
    max_speed: 2000.0,
    slow_radius: 256,
    target_radius: 1,
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

const ap_bar_width = 24;

class CycleChangeMarker
{
    constructor(position){
        this.position = new Vector2(position);
    }

    get id() { return -1 ; }

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
        this._slots = {};
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

        Object.values(this._slots).forEach(slot => slot.update(delta_time));

        const pointed_slot = this.pointed_slot(input.mouse.position);
        if(pointed_slot){
            const character_view = this._character_views[pointed_slot.idx];
            const slot = this._slots[character_view.id];
            const infobox_pos = slot.kinematics.position;
            if(character_view instanceof CharacterView){
               show_info(texts.ui.timeline, infobox_pos.translate({ x: 32, y: 64 }));
            } else {
                show_info(texts.ui.new_cycle, infobox_pos.translate({ y: 50  }));
            }
        } else if(this.is_mouse_over_cycle_clock){
            show_info(texts.ui.new_cycle, this._cycle_rect.position.translate({ x: 30, y: 40 }));
        }

        this._character_views.forEach((view, idx) => {

            if(!(view instanceof CharacterView))
                return;

            if(view._ap_bar == null){
                view._ap_bar = new ui.Bar({
                    position: view.position.translate({x: -ap_bar_width}),
                    is_horizontal_bar: false,
                    width: ap_bar_width, height: PIXELS_PER_TILES_SIDE - 2,
                    bar_name: "A.P.",
                    help_text: "Action Points",
                    visible: false,
                    bar_colors:{
                        value: "#ffbe0b",
                        change_negative: "#FB5607",
                        change_positive: "#ffffff",
                        preview: "#8338ec",
                        background:"#3A86FF",
                    }
                });
                view._ap_bar.helptext_always_visible = false;
                view._ap_bar.short_text.visible = false;
                view._ap_bar.short_text.enabled = view.is_player;
                view._ap_bar.helptext.enabled = view.is_player;
                view._ap_bar.helptext._events = {
                    on_mouse_over: ()=> show_info(texts.ui.action_points, view._ap_bar._area.bottom_right),
                };
            }

            view._ap_bar._next_update_delta_time = delta_time; // We defer the update to just before rendering to avoid some issues.


        })

    }

    request_refresh(turn_ids_sequence){
        this._need_refresh = true;
        this._turn_ids_sequence = turn_ids_sequence;
    }

    _refresh(){
        debug.assertion(()=>this._turn_ids_sequence instanceof Object);
        debug.assertion(()=>this._turn_ids_sequence.this_turn_ids instanceof Array);
        debug.assertion(()=>this._turn_ids_sequence.next_turn_ids instanceof Array);

        this.end_preview_costs();

        this._character_views = [];

        // Now we can gather the views:
        this._add_character_views(this._turn_ids_sequence.this_turn_ids);
        const new_cycle_marker = new CycleChangeMarker();
        this._character_views.push(new_cycle_marker); // Mark the beginning of the next turn.
        this._setup_slot(new_cycle_marker, this._character_views.length - 1);
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
                this._setup_slot(character_view, this._character_views.length - 1);
            }

        };
    }

    _setup_slot(view, idx){
        const slot_target = { position: this.position_of(idx) };
        let slot = this._slots[view.id];
        if(slot == null){
            const timeline = this;
            const new_slot = new class Slot{
                kinematics = new Kinematics();

                constructor(){
                    this.steering_system = new SteeringSystem(this.kinematics);
                    this.steering = new Arrive({
                        target: slot_target,
                        max_acceleration: window.timeline_steering.max_acceleration,
                        max_speed: window.timeline_steering.max_speed,
                        slow_radius: window.timeline_steering.slow_radius,
                        target_radius: window.timeline_steering.target_radius,
                        never_done: true,
                    });
                    this.steering_system.add(this.steering);
                    this.kinematics.position = timeline.position.translate({ y: this.line_length }); // Initial slot position is always far in the timeline.
                }
                update(delta_time){
                    this.steering_system.update(delta_time);
                }
            }();
            this._slots[view.id] = new_slot;
            slot = new_slot;
        }

        slot.steering.target = slot_target;
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
        const cycles_until_corruption_update = turns_until_corruption_update(this.cycle_count);
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

        this._cycle_rect = new Rectangle({ position: this.position, width: timeline_config.line_shift_x *2, height: timeline_config.line_shift_x * 2 });

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

    get line_length() { return  (this._character_views.length + 1.5) * timeline_config.space_between_elements; }

    _draw_line(canvas_context){
        const line_length = this.line_length;
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

    position_of(idx){
        debug.assertion(()=>Number.isInteger(idx) && idx >= 0);
        return this.position.translate({ y: (idx + 1) * translation_between_positions.y });
    }

    _draw_characters(canvas_context){

        this._character_views.forEach((view, idx)=>{
            const initial_sprite_positions = [];
            const initial_position = view.position;

            if(view instanceof EntityView){
                view.for_each_sprite(sprite => initial_sprite_positions.push(sprite.position));
            }

            if(config.enable_timeline_movement){
                const slot = this._slots[view.id];
                view.position = slot.kinematics.position;
            } else {
                view.position = this.position_of(idx);
            }

            if(view.is_being_destroyed){
                view.position = view.position.translate(square_half_unit_vector);
            }
            view.render_graphics(canvas_context);

            if(view instanceof CharacterView && !view.is_being_destroyed){
                debug.assertion(()=>view._ap_bar instanceof ui.Bar);
                view._ap_bar.position = view.position.translate({x: -ap_bar_width});
                update_stat_bar(view._ap_bar, view._character.stats.action_points);
                view._ap_bar.update(view._ap_bar._next_update_delta_time);
                view._ap_bar.helptext.position = view._ap_bar.position.translate({ x: -view._ap_bar.helptext.width, y: -view._ap_bar.helptext.height });

                view._ap_bar.visible = true;
                view._ap_bar.draw(canvas_context);
                view._ap_bar.visible = false;
            }

            view.position = initial_position;

            if(view instanceof EntityView)
                view.for_each_sprite(sprite => sprite.position = initial_sprite_positions.shift());
        });
    }

    pointed_slot(pointed_position){
        return this.find_slot((view, pos, slot_rect) => {
            return is_point_under(pointed_position, slot_rect)
                || (view._ap_bar instanceof ui.Bar && is_point_under(pointed_position, view._ap_bar.area))
        });
    }

    find_slot(predicate) {
        debug.assertion(()=>predicate instanceof Function);

        for(let idx = 0; idx < this._character_views.length; ++idx){
            const character_view = this._character_views[idx];
            const position = this._slots[character_view.id].kinematics.position;
            const slot_rect = new Rectangle({ position, width: timeline_config.space_between_elements, height: timeline_config.space_between_elements });
            if(predicate(character_view, position, slot_rect)){
                return { idx, slot_rect };
            }
        }
    }

    get is_mouse_over() { return this.is_under(input.mouse.position); }
    is_under(position) { return this.is_under_cycle_clock(position) || this.pointed_slot(position) !== undefined; }

    get is_mouse_over_cycle_clock() { return this.is_under_cycle_clock(input.mouse.position); }
    is_under_cycle_clock(position) { return this._cycle_rect && is_point_under(position, this._cycle_rect); }

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

        const position = pointed_slot.slot_rect.position.translate({ x: -ap_bar_width });
        const width = pointed_slot.slot_rect.width + ap_bar_width;
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

    begin_preview_costs(costs){
        const character_view = this._character_views[0];
        if(character_view instanceof CharacterView){
            character_view._ap_bar.show_preview_value(costs.action_points);
        }
    }

    end_preview_costs(){
        const character_view = this._character_views[0];
        if(character_view instanceof CharacterView){
            character_view._ap_bar.hide_preview_value();
        }
    }

};

