
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
    center_in_rectangle,
};

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
    x = 0.0;
    y = 0.0;

    constructor(values = {}){
        this.x = values.x || 0.0;
        this.y = values.y || 0.0;
    }

    get length() {
        if (this.x === 0 && this.y === 0) return 0;
        return Math.hypot(this.x, this.y);
    }

    set length(scalar) {
        console.assert(typeof scalar === "number");;
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
        console.assert(typeof min === "number");
        console.assert(typeof max === "number");
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

    multiply(scalar) {
        console.assert(typeof scalar === "number");
        return new Vector2({x: this.x * scalar, y: this.y * scalar});
    }

    divide(scalar) {
        console.assert(typeof scalar === "number");
        return new Vector2({x: this.x / scalar, y: this.y / scalar});
    }

    translate(translation){
        console.assert(typeof translation.x === "number" && typeof translation.y === "number");
        return new Vector2({ x: this.x + translation.x, y: this.y + translation.y });
    }

    rotate(degrees) {
        console.assert(typeof degrees === "number");
        let rads = Math.radians(degrees);

        let rx = this.x * Math.cos(rads) - this.y * Math.sin(rads);
		let ry = this.x * Math.sin(rads) + this.y * Math.cos(rads);

        return new Vector2({x: rx, y: ry});
    }

    substract(other_vec2){
        console.assert(typeof other_vec2.x === "number" && typeof other_vec2.y === "number");
        return new Vector2({ x: this.x - other_vec2.x, y: this.y - other_vec2.y });
    }

    distance(other_vec2){
        console.assert(typeof other_vec2.x === "number" && typeof other_vec2.y === "number");
        return this.substract(other_vec2).length;
    }

    toString() {
        return "(" + this.x + "," + this.y + ")";
    }
};

const Vector2_origin = new Vector2();
const Vector2_unit_x = new Vector2({ x: 1.0 });
const Vector2_unit_y = new Vector2({ y: 1.0 });
const Vector2_negative_unit_x = new Vector2({ x: -1.0 });
const Vector2_negative_unit_y = new Vector2({ y: -1.0 });
const Vector2_unit = new Vector2({ x: 1.0, y: 1.0 });

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
        console.assert(typeof new_value === "number");
        console.assert(new_value >= 0);
        return this.size.x = new_value;
    }

    set height(new_value){
        console.assert(typeof new_value === "number");
        console.assert(new_value >= 0);
        return this.size.y = new_value;
    }
    get height(){ return this.size.y; }

    get top_left() { return new Vector2(this.position); }
    get bottom_right() { return new Vector2({x: this.position.x + this.width, y: this.position.y + this.height}); }
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