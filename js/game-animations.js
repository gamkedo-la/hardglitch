// This file provide animations as coroutines to be used when effects are played.

export {
    default_move_duration_ms,
    default_destruction_duration_ms,
    move,
    bounce,
    swap,
    destroyed,
    take_damage,
    repaired,
}

import { graphic_position, EntityView, PIXELS_PER_HALF_SIDE } from "./view/entity-view.js";
import { tween, easing } from "./system/tweening.js";
import { in_parallel } from "./system/animation.js";
import { Vector2 } from "./system/spatial.js";

const default_move_duration_ms = 250;
const default_destruction_duration_ms = 666;

function* translate(entity_view, target_gfx_pos, duration_ms){
    console.assert(entity_view instanceof EntityView);
    yield* tween(entity_view.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, duration_ms,
        (updated_position)=>{ entity_view.position = updated_position; });
}

function* move(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    console.assert(entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);
    yield* translate(entity_view, target_gfx_pos, duration_ms);
    entity_view.game_position = target_game_position;
}

function* bounce(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    const initial_position = entity_view.game_position;
    const initial_gfx_pos = graphic_position(initial_position);
    const target_gfx_pos = graphic_position(target_game_position);
    const translation = target_gfx_pos.substract(initial_gfx_pos).normalize().multiply(PIXELS_PER_HALF_SIDE / 2);
    const bounce_limit_gfx_pos = initial_gfx_pos.translate(translation);
    yield* translate(entity_view, bounce_limit_gfx_pos, duration_ms / 2);
    yield* translate(entity_view, initial_gfx_pos, duration_ms / 2);
    entity_view.game_position = initial_position;
}

function* swap(left_entity_view, right_entity_view, duration_ms=default_move_duration_ms){
    console.assert(left_entity_view instanceof EntityView);
    console.assert(right_entity_view instanceof EntityView);

    const left_final_pos = right_entity_view.game_position;
    const right_final_pos = left_entity_view.game_position;
    yield* in_parallel(
        move(left_entity_view, left_final_pos, duration_ms),
        move(right_entity_view, right_final_pos, duration_ms)
    );
}

function* destroyed(entity_view, duration_ms=default_destruction_duration_ms){
    console.assert(entity_view instanceof EntityView);
    // Center the sprite so that the rotation origin is in the center of it.
    entity_view.sprite.move_origin_to_center();
    // WwhwhhiiiiiiiiiIIIIIIIIIiiiizzzzzzzzzzZZZZZZZZZZZZZ
    yield* tween( {
                scale_x: entity_view.scale.x,
                scale_y: entity_view.scale.y,
                orientation: entity_view.orientation,
            }, {
                scale_x: 0,
                scale_y: 0,
                orientation: entity_view.orientation + 360,
            },
            duration_ms,
            (values) => {
                entity_view.scale = { x: values.scale_x, y: values.scale_y };
                entity_view.orientation = values.orientation;
            },
            easing.in_out_quad
    );
}

function* take_damage(entity_view){ // FIXME - not real animation
    console.assert(entity_view instanceof EntityView);
    // WwhwhhiiiiiiiiiIIIIIIIIIiiiizzzzzzzzzzZZZZZZZZZZZZZ
    const intensity = 10;
    const time_per_move = Math.round(500 / 4);
    const initial_position = new Vector2(entity_view.position);
    yield* translate(entity_view, initial_position.translate({ x: intensity, y: 0}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: -intensity, y: 0}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: 0, y: -intensity}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: 0, y: intensity}), time_per_move);
    yield* translate(entity_view, initial_position, time_per_move);
}

function* repaired(entity_view){ // FIXME - not real animation
    console.assert(entity_view instanceof EntityView);
    // WwhwhhiiiiiiiiiIIIIIIIIIiiiizzzzzzzzzzZZZZZZZZZZZZZ
    const intensity = 32;
    const time_per_move = Math.round(500 / 2);
    const initial_position = new Vector2(entity_view.position);
    yield* translate(entity_view, initial_position.translate({ x: 0, y: -intensity}), time_per_move);
    yield* translate(entity_view, initial_position, time_per_move);
}
