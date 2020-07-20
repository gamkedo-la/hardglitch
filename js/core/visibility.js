

export {
    FieldOfVision,
    positions_in_range,
    valid_target_positions,
    valid_move_positions,
    RangeShape,
    Range_Diamond,
    Range_Circle,
    Range_Square,
    Range_Cross_Axis,
    Range_Cross_Diagonal,
    Range_Cross_Star,
}

import * as concepts from "./concepts.js";
import { Vector2 } from "../system/spatial.js";
import { compute_fov } from "../system/shadowcasting.js";
import * as tiles from "../definitions-tiles.js";
import { Character } from "./character.js";

class RangeShape {
    // The range is [begin_distance, end_distance) , so end_distance is excluded.
    constructor(begin_distance, end_distance){
        console.assert(Number.isInteger(begin_distance) && begin_distance >= 0);
        console.assert(Number.isInteger(end_distance) && end_distance > 0);
        console.assert(begin_distance < end_distance);
        this.begin_distance = begin_distance;
        this.end_distance = end_distance;
    }

    is_inside(center, position){
        console.assert(center instanceof concepts.Position);
        console.assert(position instanceof concepts.Position);
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
        const distance = Math.round((new Vector2(center)).distance(position));
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
        const relative = center.substract(position).absolute();
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
        const relative = center.substract(position).absolute();
        return (is_in_aligned_cross(center, position) || is_in_diagonal_cross(center, position))
            && super._range_match(center, position)
            ;
    }
};


function always_valid_position(){ return true; }

// Provides a list of all the positions around a given position within a given range.
function positions_in_range(center_position, range_shape, valid_position_predicate = always_valid_position){
    console.assert(center_position instanceof concepts.Position);
    console.assert(range_shape instanceof RangeShape);

    const begin =  -range_shape.end_distance -1 ;
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
        } else {
            if(tiles.is_blocking_view(thing))
                return true;
        }
    }
    return false;
}

// Provides all the positions that are currently "visible" by a character at the provided center position in the world.
function find_visible_positions(world, center, view_distance){
    console.assert(world instanceof concepts.World);
    console.assert(center instanceof concepts.Position);
    console.assert(Number.isInteger(view_distance) && view_distance >= 0);

    const test_shape = new Range_Circle(0, view_distance + 1);

    const is_blocking_vision = (x, y)=>{
        const position = new concepts.Position({x, y});
        return !test_shape.is_inside(center, position)      // If it's outside the view range, this is blocking the view.
            || !world.is_valid_position(position)           // If its outside the world grid, this is blocking the view.
            || is_anything_blocking_view(world, position)   // If anything inside this position is blocking the view...this is blocking the view.
            ;
    };

    const visible_positions = [];
    const mark_visible = (x, y)=>{
        visible_positions.push(new concepts.Position({x,y}));
    };

    compute_fov(center, is_blocking_vision, mark_visible);

    return visible_positions;
}

function valid_target_positions(world, character, action_range_shape){
    console.assert(world instanceof concepts.World);
    console.assert(character instanceof Character);
    console.assert(action_range_shape instanceof RangeShape);
    return positions_in_range(character.position, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => world.entity_at(pos))
            .filter(pos=>character.can_see(pos))
            ;
}

function valid_move_positions(world, character, action_range_shape, tile_filter){
    console.assert(world instanceof concepts.World);
    console.assert(character instanceof Character);
    console.assert(action_range_shape instanceof RangeShape);
    console.assert(tile_filter instanceof Function);
    return positions_in_range(character.position, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => !world.is_blocked_position(pos, tile_filter))
            .filter(pos=>character.can_see(pos))
            ;
}

class FieldOfVision {

    constructor(position, view_distance){
        console.assert(position instanceof concepts.Position);
        console.assert(Number.isInteger(view_distance) && view_distance >= 0);
        this._center = position;
        this._view_distance = view_distance;
        this._visible_positions = [];
    }

    get view_distance(){ return this._view_distance; }
    set view_distance(new_distance){
        console.assert(Number.isInteger(new_distance) && new_distance >= 0);
        this._view_distance = new_distance;
    }

    get position() { return this._center; }
    set position(new_position) {
        console.assert(new_position instanceof concepts.Position);
        this._center = new_position;
    }

    get visible_positions() { return [ ...this._visible_positions ]; } // We return a copy.

    update(world){
        console.assert(world instanceof concepts.World);
        this._visible_positions = find_visible_positions(world, this._center, this._view_distance);
    }

    is_visible(...positions){ // TODO: probably optimizable
        return positions.every(position => {
            console.assert(position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

    filter_visible(...positions){ // TODO: probably optimizable
        return positions.filter(position => {
            console.assert(position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

};


