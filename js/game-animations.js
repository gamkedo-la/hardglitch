// This file provide animations as coroutines to be used when effects are played.

export {
    move,
    bounce,
    swap,
}

import * as concepts from "./core/concepts.js";
import { graphic_position, EntityView, PIXELS_PER_HALF_SIDE } from "./view/entity-view.js";
import { tween } from "./system/tweening.js";

const default_move_duration_ms = 200;

function *translate(entity_view, target_gfx_pos, duration_ms){
    console.assert(entity_view instanceof EntityView);
    yield* tween(entity_view.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, duration_ms,
        (updated_position)=>{ entity_view.position = updated_position; });
}

function *move(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    console.assert(entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);
    yield* translate(entity_view, target_gfx_pos, duration_ms);
    entity_view.game_position = target_game_position;
}

function *bounce(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    const initial_position = entity_view.game_position;
    const initial_gfx_pos = graphic_position(initial_position);
    const target_gfx_pos = graphic_position(target_game_position);
    const translation = target_gfx_pos.substract(initial_gfx_pos).normalize().multiply(PIXELS_PER_HALF_SIDE / 2);
    const bounce_limit_gfx_pos = initial_gfx_pos.translate(translation);
    yield* translate(entity_view, bounce_limit_gfx_pos, duration_ms / 2);
    yield* translate(entity_view, initial_gfx_pos, duration_ms / 2);
    entity_view.game_position = initial_position;
}

function *in_parallel(...animations){
    while(animations.length > 0){
        const delta_time = yield;
        animations.map((animation, index)=>{
            const state = animation.next(delta_time);
            if(state.done)
                animations.splice(index, 1);
        });
    }
}

function *swap(left_entity_view, right_entity_view, duration_ms=default_move_duration_ms){
    console.assert(left_entity_view instanceof EntityView);
    console.assert(right_entity_view instanceof EntityView);

    const left_final_pos = right_entity_view.game_position;
    const right_final_pos = left_entity_view.game_position;
    yield* in_parallel(
        move(left_entity_view, left_final_pos, duration_ms),
        move(right_entity_view, right_final_pos, duration_ms)
    );
}

