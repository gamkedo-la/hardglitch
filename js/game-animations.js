// This file provide animations as coroutines to be used when effects are played.

export {
    move,
    bounce,
}

import * as concepts from "./core/concepts.js";
import { graphic_position, EntityView } from "./view/common-view.js";
import { tween } from "./system/tweening.js";

const default_move_duration_ms = 200;

function *translate(entity_view, target_game_position, duration_ms){
    console.assert(entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);
    yield* tween(entity_view.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, duration_ms,
        (updated_position)=>{ entity_view.position = updated_position; });
}

function *move(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    console.assert(entity_view instanceof EntityView);
    yield* translate(entity_view, target_game_position, duration_ms);
    entity_view.game_position = target_game_position;
}

function *bounce(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    const initial_position = entity_view.game_position;
    yield* translate(entity_view, target_game_position, duration_ms / 2);
    yield* translate(entity_view, initial_position, duration_ms / 2);
    entity_view.game_position = initial_position;
}
