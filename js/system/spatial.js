export {
    Vector2,
    Vector2_origin,
    Vector2_unit,
    Vector2_unit_x,
    Vector2_unit_y,
    Vector2_negative_unit_x,
    Vector2_negative_unit_y,
    Transform,
    Angle,
    Rectangle,
    is_intersection,
    is_point_under,
    center_in_rectangle,
    keep_in_rectangle,
    containing_rectangle,
    distance_grid_precise,
};

import * as debug from "../system/debug.js";
import { is_number } from "./utility.js";

/////////////////////////////////////////////
// Source: http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
// Converts from degrees to radians.
Math.radians = function(degrees) {
    return degrees * Math.PI / 180.0;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180.0 / Math.PI;
};
/////////////////////////////////////////////

class Vector2{

    constructor(values = {}){
        this.x = values.x || 0.0;
        this.y = values.y || 0.0;
    }

    get length() {
        if (this.x === 0 && this.y === 0) return 0;
        return Math.hypot(this.x, this.y);
    }

    set length(scalar) {
        debug.assertion(()=>typeof scalar === "number");;
        if (scalar <= 0) {
            this.x = 0;
            this.y = 0;
        } else {
            let unit_vector = this.normalize();
            unit_vector = unit_vector.multiply(scalar);
            this.x = unit_vector.x;
            this.y = unit_vector.y;
        }
    }

    get inverse() {
        return new Vector2({ x: -this.x, y: -this.y });
    }

    clamp(min, max) {
        debug.assertion(()=>typeof min === "number");
        debug.assertion(()=>typeof max === "number");
        let magnitude = this.length;
        if (magnitude > max) {
            this.length = max;
        } else if (magnitude < min) {
            this.length = min;
        }
    }

    normalize() {
        let magnitude = this.length;
        if (magnitude === 0) return new Vector2(this);
        return this.divide(magnitude);
    }

    multiply(scalar_or_vector2) {
        debug.assertion(()=>typeof scalar_or_vector2 === "number" || scalar_or_vector2 instanceof Object);
        if(typeof scalar_or_vector2 === "number")
            return new Vector2({ x: this.x * scalar_or_vector2, y: this.y * scalar_or_vector2 });
        else
            return new Vector2({ x: this.x * scalar_or_vector2.x, y: this.y * scalar_or_vector2.y });
    }

    divide(scalar_or_vector2) {
        debug.assertion(()=>typeof scalar_or_vector2 === "number" || scalar_or_vector2 instanceof Object);
        if(typeof scalar_or_vector2 === "number")
            return new Vector2({ x: this.x / scalar_or_vector2, y: this.y / scalar_or_vector2 });
        else
            return new Vector2({ x: this.x / scalar_or_vector2.x, y: this.y / scalar_or_vector2.y });
    }

    translate(translation){
        debug.assertion(()=>translation instanceof Object);
        const translate_x = is_number(translation.x) ? translation.x : 0;
        const translate_y = is_number(translation.y) ? translation.y : 0;
        return new Vector2({ x: this.x + translate_x, y: this.y + translate_y });
    }

    rotate(degrees) {
        debug.assertion(()=>typeof degrees === "number");
        let rads = Math.radians(degrees);

        let rx = this.x * Math.cos(rads) - this.y * Math.sin(rads);
		let ry = this.x * Math.sin(rads) + this.y * Math.cos(rads);

        return new Vector2({x: rx, y: ry});
    }

    substract(other_vec2){
        debug.assertion(()=>typeof other_vec2.x === "number" && typeof other_vec2.y === "number");
        return new Vector2({ x: this.x - other_vec2.x, y: this.y - other_vec2.y });
    }

    distance(other_vec2){
        debug.assertion(()=>typeof other_vec2.x === "number" && typeof other_vec2.y === "number");
        return this.substract(other_vec2).length;
    }

    toString() {
        return "(" + this.x + "," + this.y + ")";
    }

    equals(other_vec2){
        debug.assertion(()=>typeof other_vec2.x === "number" && typeof other_vec2.y === "number");
        return this.x === other_vec2.x && this.y === other_vec2.y;
    }

    to_zero() { this.x = 0; this.y = 0; }

    };

const Vector2_origin = Object.freeze(new Vector2());
const Vector2_unit_x = Object.freeze(new Vector2({ x: 1.0 }));
const Vector2_unit_y = Object.freeze(new Vector2({ y: 1.0 }));
const Vector2_negative_unit_x = Object.freeze(new Vector2({ x: -1.0 }));
const Vector2_negative_unit_y = Object.freeze(new Vector2({ y: -1.0 }));
const Vector2_unit = Object.freeze(new Vector2({ x: 1.0, y: 1.0 }));

function degrees_to_radian(degrees) {
    return degrees * (Math.PI / 180);
};

function radian_to_degrees(rad) {
    return rad / (Math.PI / 180);
};

class Angle {
    angle_radian = 0.0;

    constructor(degrees){
        if(degrees)
            this.angle_radian = radian_to_degrees(degrees);
    }

    get degrees() { return radian_to_degrees(this.angle_radian); }
    set degrees(value) { this.angle_radian = degrees_to_radian(value); }
    get radian() { return this.angle_radian; }
    set radian(value) { this.angle_radian = value; }
};

class Transform {
    position = new Vector2();
    scale = Vector2_unit;
    orientation = new Angle();
};

function is_intersection(rect_a, rect_b){
    return rect_a.position.x < rect_b.position.x + rect_b.width
        && rect_a.position.x + rect_a.width > rect_b.position.x
        && rect_a.position.y < rect_b.position.y + rect_b.height
        && rect_a.position.y + rect_a.height > rect_b.position.y
        ;
}

function is_point_under(position, area, origin={}){
    debug.assertion(()=>position.x != undefined && position.y != undefined );
    debug.assertion(()=>area);
    debug.assertion(()=>origin);
    const real_position = (new Vector2(position)).translate(origin);
    return is_intersection(area, { position: real_position, width:0, height:0 });
}




// BEWARE, THIS RECTANGLE CANNOT BE ROTATED
class Rectangle {
    position = new Vector2();
    size = new Vector2();

    constructor(rect = {}){
        if(rect.position) this.position = new Vector2(rect.position);
        if(rect.size) this.size = new Vector2(rect.size);
        if(rect.x || rect.y) this.position = new Vector2(rect);
        if(rect.width || rect.height) this.size = new Vector2({x:rect.width || 0.0, y:rect.height || 0.0});
    }

    get width(){ return this.size.x; }
    set width(new_value){
        debug.assertion(()=>typeof new_value === "number");
        debug.assertion(()=>new_value >= 0);
        return this.size.x = new_value;
    }

    set height(new_value){
        debug.assertion(()=>typeof new_value === "number");
        debug.assertion(()=>new_value >= 0);
        return this.size.y = new_value;
    }
    get height(){ return this.size.y; }

    get top_left() { return new Vector2(this.position); }
    get top_right() { return this.position.translate({ x: this.width }); }
    get bottom_left() { return this.position.translate({y: this.height}); }
    get bottom_right() { return this.position.translate({x: this.width, y: this.height}); }

    get center() { return this.position.translate({ x: this.width / 2.0, y: this.height / 2.0 }); }
};

// Returns the re-positionned inner rectangle which should be centerred in the outter rectangle.
function center_in_rectangle(inner_rectangle, outter_rectangle){
    inner_rectangle = inner_rectangle instanceof Rectangle ? inner_rectangle : new Rectangle(inner_rectangle);
    outter_rectangle = outter_rectangle instanceof Rectangle ? outter_rectangle : new Rectangle(outter_rectangle);
    const half_outter_width = outter_rectangle.width / 2;
    const half_outter_height = outter_rectangle.height / 2;
    const half_inner_width = inner_rectangle.width / 2;
    const half_inner_height = inner_rectangle.height / 2;
    const margin_horizontal = half_outter_width - half_inner_width;
    const margin_vertical = half_outter_height - half_inner_height;
    return new Rectangle({
        position: outter_rectangle.position.translate({ x: margin_horizontal, y: margin_vertical }),
        size: inner_rectangle.size,
    });
}

// Returns the re-positionned inner rectangle so that it's always in the outter rectangle.
function keep_in_rectangle(inner_rectangle, outter_rectangle){
    debug.assertion(()=>inner_rectangle.width <= outter_rectangle.width);
    debug.assertion(()=>inner_rectangle.height <= outter_rectangle.height);

    if(inner_rectangle.size.equals(outter_rectangle.size)){
        return new Rectangle({
            position: new Vector2(),
            size: inner_rectangle.size,
        });
    }

    const fixed_rectangle = new Rectangle(inner_rectangle);

    if(fixed_rectangle.bottom_right.x > outter_rectangle.bottom_right.x){
        const difference  = fixed_rectangle.bottom_right.x - outter_rectangle.bottom_right.x;
        fixed_rectangle.position = fixed_rectangle.position.translate({ x: -difference });
    }

    if(fixed_rectangle.top_left.x < outter_rectangle.top_left.x){
        const difference  = fixed_rectangle.top_left.x - outter_rectangle.top_left.x;
        fixed_rectangle.position = fixed_rectangle.position.translate({ x: difference });
    }

    if(fixed_rectangle.bottom_right.y > outter_rectangle.bottom_right.y){
        const difference  = fixed_rectangle.bottom_right.y - outter_rectangle.bottom_right.y;
        fixed_rectangle.position = fixed_rectangle.position.translate({ y: difference });
    }

    if(fixed_rectangle.top_left.y < outter_rectangle.top_left.y){
        const difference  = fixed_rectangle.top_left.y - outter_rectangle.top_left.y;
        fixed_rectangle.position = fixed_rectangle.position.translate({ y: -difference });
    }

    return fixed_rectangle;
}

function containing_rectangle(...rectangles){
    const position = new Vector2();
    const size = new Vector2()
    for(const  rectangle of rectangles){
        position.x = Math.min(rectangle.position.x, position.x);
        position.y = Math.min(rectangle.position.y, position.y);
        size.x = Math.max(rectangle.width, size.x);
        size.y = Math.max(rectangle.height, size.y);
    }
    return new Rectangle({ position, size });
}


// Return the distance between two positions on a grid, but with high precision (not Manhatan distance).
function distance_grid_precise(source, target){
    debug.assertion(()=>source instanceof Object && Number.isInteger(source.x) && Number.isInteger(source.y));
    debug.assertion(()=>target instanceof Object && Number.isInteger(target.x) && Number.isInteger(target.y));
    return new Vector2(source).distance(new Vector2(target));
}
