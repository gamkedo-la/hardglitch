

export {
    FieldOfVision,
    positions_in_range,
    search_entities,
    valid_target_positions,
    valid_move_positions,
    valid_spawn_positions,
    random_range_position,
    fov_range,
    RangeShape,
    Range_Diamond,
    Range_Circle,
    Range_Square,
    Range_Cross_Axis,
    Range_Cross_Diagonal,
    Range_Cross_Star,

    Visibility_Range_Type,
}

import * as debug from "../system/debug.js";
import * as concepts from "./concepts.js";
import { distance_grid_precise } from "../system/spatial.js";
import { compute_fov } from "../system/shadowcasting.js";
import * as tiles from "../definitions-tiles.js";
import { Character } from "./character.js";
import { is_blocked_position } from "../definitions-world.js";
import { position_from_index, random_sample, shuffle_array } from "../system/utility.js";
import { Grid } from "../system/grid.js";

class RangeShape {
    // The range is [begin_distance, end_distance) , so end_distance is excluded.
    constructor(begin_distance, end_distance){
        debug.assertion(()=>Number.isInteger(begin_distance) && begin_distance >= 0);
        debug.assertion(()=>Number.isInteger(end_distance) && end_distance > 0);
        debug.assertion(()=>begin_distance < end_distance);
        this.begin_distance = begin_distance;
        this.end_distance = end_distance;
    }

    is_inside(center, position){
        debug.assertion(()=>center instanceof concepts.Position);
        debug.assertion(()=>position instanceof concepts.Position);
        return this._range_match(center, position); // Must be implemented by child class
    }
};

class Range_Diamond extends RangeShape {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        const distance = center.distance(position);
        return distance < this.end_distance && distance >= this.begin_distance;
    }
};

class Range_Circle extends RangeShape {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        const distance = Math.ceil(distance_grid_precise(center, position));
        return distance < this.end_distance && distance >= this.begin_distance;
    }
};


class Range_Square extends RangeShape {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        const relative = center.substract(position).absolute();
        return relative.x < this.end_distance
            && relative.y < this.end_distance
            && (relative.x >= this.begin_distance || relative.y >= this.begin_distance)
            ;
    }
};

function is_in_aligned_cross(center, position){
    return position.x === center.x || position.y === center.y;
}

function is_in_diagonal_cross(center, position){
    const relative = center.substract(position).absolute();
    return relative.x === relative.y;
}

class Range_Cross_Axis extends Range_Square {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        return is_in_aligned_cross(center, position)
            && super._range_match(center, position)
            ;
    }
};

class Range_Cross_Diagonal extends Range_Square {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        return is_in_diagonal_cross(center, position)
            && super._range_match(center, position)
            ;
    }
};

class Range_Cross_Star extends Range_Square {
    constructor(begin_distance, end_distance){
        super(begin_distance, end_distance);
    }

    _range_match(center, position){
        return (is_in_aligned_cross(center, position) || is_in_diagonal_cross(center, position))
            && super._range_match(center, position)
            ;
    }
};


function always_valid_position(){ return true; }

// Provides a list of all the positions around a given position within a given range.
function positions_in_range(center_position, range_shape, valid_position_predicate = always_valid_position){
    debug.assertion(()=>center_position instanceof concepts.Position);
    debug.assertion(()=>range_shape instanceof RangeShape);

    const begin =  -(range_shape.end_distance - 1);
    const end =  range_shape.end_distance;

    const matching_positions = [];
    for(let y = begin; y < end; ++y){
        for(let x = begin; x < end; ++x){
            const position = center_position.translate({x, y});
            if(valid_position_predicate(position)
            && range_shape.is_inside(center_position, position)){
                matching_positions.push(position);
            }
        }
    }
    return matching_positions;
}

// Decides wether the position in the world contains anything that should block the view.
function is_anything_blocking_view(world, position){
    const tiles_or_entities = world.everything_at(position);
    for(const thing of tiles_or_entities){
        if(thing instanceof concepts.Entity){
            if(thing.is_blocking_vision)
                return true;
        } else if(Number.isInteger(thing) && tiles.is_blocking_view(thing)){ // Numbers are tiles.
            return true;
        }
    }
    return false;
}

const Visibility_Range_Type  = Range_Circle; // Range used for field of vision.

function fov_range(view_distance){
    debug.assertion(()=>Number.isInteger(view_distance) && view_distance >= 0);
    return new Visibility_Range_Type(0, view_distance + 1)
}

// Provides all the positions that are currently "visible" by a character at the provided center position in the world.
function find_visible_positions(world, center, view_distance){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>center instanceof concepts.Position);
    debug.assertion(()=>Number.isInteger(view_distance) && view_distance >= 0);

    const view_range = fov_range(view_distance);

    const is_blocking_vision = (x, y)=>{
        const position = new concepts.Position({x, y});
        return !view_range.is_inside(center, position)      // If it's outside the view range, this is blocking the view.
            || !world.is_valid_position(position)           // If its outside the world grid, this is blocking the view.
            || is_anything_blocking_view(world, position)   // If anything inside this position is blocking the view...this is blocking the view.
            ;
    };

    const visible_positions = [];
    const mark_visible = (x, y)=>{
        const pos = new concepts.Position({x, y});
        // FIXME: For some reason compute_fov outputs more positions than what's in range, not sure why.
        // the following filter is a workaround trimming positions outside the view range.
        if(world.is_valid_position(pos) && view_range.is_inside(center, pos)){
            visible_positions.push(pos);
        }
    };

    compute_fov(center, is_blocking_vision, mark_visible, view_distance);

    debug.assertion(()=> {
        const pos_in_range = positions_in_range(center, view_range, (pos)=>world.is_valid_position(pos));
        return visible_positions.every(pos=> pos_in_range.some(range_pos => pos.equals(range_pos)));
    });

    return visible_positions;
}

function valid_target_positions(world, character, action_range_shape, predicate = ()=>true){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>character instanceof Character);
    debug.assertion(()=>action_range_shape instanceof RangeShape);
    return positions_in_range(character.position, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => world.entity_at(pos)
                        && character.can_see(pos)
                        && predicate(pos));
}

function valid_move_positions(world, character, action_range_shape, tile_filter){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>character instanceof Character);
    debug.assertion(()=>action_range_shape instanceof RangeShape);
    debug.assertion(()=>tile_filter instanceof Function);
    return positions_in_range(character.position, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => !is_blocked_position(world, pos, tile_filter) && character.can_see(pos));
}

function valid_spawn_positions(world, center_position, tile_filter, max_range = 8){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>center_position instanceof concepts.Position);
    debug.assertion(()=>tile_filter instanceof Function);
    debug.assertion(()=>Number.isInteger(max_range));
    let range_size = 0;
    const valid_positions = [];
    while(range_size <= max_range){
        const range_shape = new Range_Circle(range_size, range_size + 1);
        const positions_in_circle = positions_in_range(center_position, range_shape, pos => world.is_valid_position(pos))
                                        .filter(pos => !is_blocked_position(world, pos, tile_filter));
        shuffle_array(positions_in_circle); // To give some variety.
        valid_positions.push( ...positions_in_circle);
        ++range_size;
    }
    const sorted_positions = valid_positions.sort((left, right)=>{
        const right_distance = right.distance(center_position);
        const left_distance = left.distance(center_position);
        return left_distance - right_distance;
    });
    return sorted_positions;
}

function random_range_position(center, range, pos_filter){
    debug.assertion(()=> center instanceof concepts.Position);
    debug.assertion(()=> range instanceof RangeShape);
    const positions = positions_in_range(center, range, pos_filter);
    return random_sample(positions);
}


// Returns a list of entities, visible or not, sorted by distance, matching the predicate and shape or list of positions to check.
function search_entities(world, position, range_shape_or_list_of_pos , predicate = ()=>true){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>position instanceof concepts.Position);
    debug.assertion(()=>range_shape_or_list_of_pos instanceof RangeShape || (range_shape_or_list_of_pos instanceof Array && range_shape_or_list_of_pos.every(position=>position instanceof concepts.Position)));
    debug.assertion(()=>predicate instanceof Function);

    const possible_positions = range_shape_or_list_of_pos instanceof RangeShape
                             ? positions_in_range(position, range_shape_or_list_of_pos)
                            : range_shape_or_list_of_pos;
    debug.assertion(()=> possible_positions instanceof Array && possible_positions.every(position=>position instanceof concepts.Position));
    const valid_positions = possible_positions.filter(position => world.is_valid_position(position));
    const entities = valid_positions.map(position => world.entity_at(position))
                                    .filter(entity => entity instanceof concepts.Entity && predicate(entity));
    const sorted_entities = entities.sort((entity_a, entity_b)=> distance_grid_precise(position,entity_a.position) - distance_grid_precise(position, entity_b.position));
    return sorted_entities;
}


class FieldOfVision {

    constructor(position, view_distance){
        debug.assertion(()=>position instanceof concepts.Position || position === undefined);
        debug.assertion(()=>(Number.isInteger(view_distance) && view_distance >= 0) || view_distance === undefined);
        this._center = position === undefined ? new concepts.Position() : position;
        this._view_distance = view_distance === undefined ? 1 : view_distance;
        this._visible_positions = [];
    }

    get view_distance(){ return this._view_distance; }
    set view_distance(new_distance){
        debug.assertion(()=>Number.isInteger(new_distance) && new_distance >= 0);
        this._view_distance = new_distance;
    }

    get position() { return this._center; }
    set position(new_position) {
        debug.assertion(()=>new_position instanceof concepts.Position);
        this._center = new_position;
    }

    get visible_positions() { return [ ...this._visible_positions ]; } // We return a copy.
    get visible_walkable_positions() { return [ ...this._visible_walkable_positions ]; } // We return a copy.

    get range() { return fov_range(this.view_distance); }

    update(world){
        debug.assertion(()=>world instanceof concepts.World);
        this._visible_positions = find_visible_positions(world, this._center, this._view_distance);
        this._visible_walkable_positions = this._visible_positions.filter(position => !is_blocked_position(world, position, tiles.is_walkable, false));
    }

    is_visible(...positions){ // TODO: probably optimizable
        return positions.every(position => {
            debug.assertion(()=>position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

    is_any_visible(...positions){ // TODO: probably optimizable
        return positions.some(position => {
            debug.assertion(()=>position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

    filter_visible(...positions){ // TODO: probably optimizable
        return positions.filter(position => {
            debug.assertion(()=>position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

    // Returns the visible entities ordered by distance from the center.
    visible_entities(world){
        return search_entities(world, this.position, this._visible_positions);
    }

};
