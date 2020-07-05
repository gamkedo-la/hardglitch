

export {
    FieldOfView,
    positions_in_range,
    valid_target_positions,
    valid_move_positions,
    Range_Diamond,
    Range_Circle,
    Range_Square,
    Range_Cross_Axis,
    Range_Cross_Diagonal,
    Range_Cross_Star,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { Vector2 } from "../system/spatial.js";

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
        const distance = Math.ceil((new Vector2(center)).distance(position));
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

// The range of view of characters (assuming all characters have the same view range). // TODO: decide if that's the only way to view around.
const view_range_shape = new Range_Circle(1, 10);

// Provides all the positions that are currently "visible" by a character at the provided center position in the world.
function find_visible_positions(world, center){
    const visible_positions = positions_in_range(center, view_range_shape)
        // Note that here a character can hide another one
        .filter(position => world.is_blocked_position(position, tiles.is_blocking_view));
    return visible_positions;
}

function valid_target_positions(world, center, action_range_shape){
    return positions_in_range(center, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => world.entity_at(pos));
}

function valid_move_positions(world, center, action_range_shape){
    return positions_in_range(center, action_range_shape, pos => world.is_valid_position(pos))
            .filter(pos => !world.is_blocked_position(pos, tiles.is_walkable));
}

class FieldOfView {

    constructor(world, position, max_distance){
        console.assert(world instanceof concepts.World);
        console.assert(position instanceof concepts.Position);
        console.assert(Number.isInteger(max_distance) && max_distance >= 0);
        this._center = position;
        this._world = world;
        this._max_distance = max_distance;
        this.update();
    }

    set position(new_position) {
        console.assert(new_position instanceof concepts.Position);
        this._center = new_position;
        this.update();
    }

    get position() { return this._center; }
    get visible_positions() { return [ ...this._visible_positions ]; } // We return a copy.

    update(){
        this._visible_positions = find_visible_positions(this._world, this._center);
    }

    is_visible(...positions){ // TODO: probably optimizable
        return positions.every(position => {
            console.assert(position instanceof concepts.Position);
            return this._visible_positions.some(visible_pos => position.equals(visible_pos));
        });
    }

};


