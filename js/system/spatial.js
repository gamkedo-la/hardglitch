
export {
    Vector2, Vector2_origin, Vector2_unit_x, Vector2_unit_y,
    Transform,
    Angle,
    Rectangle
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
        if (x === 0 && y === 0) return 0;
        return Math.hypot(this.x, this.y);
    }

    set length(scalar) {
        if (scalar <= 0) {
            this.x = 0;
            this.y = 0;
        } else {
            let unit_vector = this.normalize();
            unit_vector.multiply(scalar);
            this.x = unit_vector.x;
            this.y = unit_vector.y;
        }
    }

    clamp(min, max) {
        let magnitude = this.length;
        if (magnitude > max) {
            this.length = max;
        } else if (magnitude < min) {
            this.length = min;
        }
    }

    normalize() {
        let magnitude = this.length;
        if (magnitude === 0) return this;
        return this.divide(magnitude);
    }

    multiply(scalar) {
        return new Vector2({x: this.x * scalar, y: this.y * scalar});
    }

    divide(scalar) {
        return new Vector2({x: this.x / scalar, y: this.y / scalar});
    }

    translate(translation){
        return new Vector2({ x: this.x + translation.x, y: this.y + translation.y });
    }

    rotate(degrees) {
        let rads = Math.radians(degrees);

        let rx = this.x * Math.cos(rads) - this.y * Math.sin(rads);
		let ry = this.x * Math.sin(rads) + this.y * Math.cos(rads);
        
        return new Vector2({x: rx, y: ry});
    }
};

const Vector2_origin = new Vector2();
const Vector2_unit_x = new Vector2({ x: 1.0 });
const Vector2_unit_y = new Vector2({ y: 1.0 });


class Angle {
    angle_radian = 0.0;

    constructor(degrees){
        if(degrees)
            this.angle_radian = Math.radian(degrees);
    }

    get degrees() { return Math.degrees(this.angle_radian); }
    get radian() { return this.angle_radian; }
};

class Transform {
    position = new Vector2();
    scale = new Vector2();
    orientation = new Angle();
};

// BEWARE, THIS RECTANGLE CANNOT BE ROTATED
class Rectangle {
    position = new Vector2();
    size = new Vector2();

    constructor(rect = {}){
        if(rect.position) this.position = rect.position;
        if(rect.size) this.size = rect.size;
        if(rect.x || rect.y) this.position = new Vector2(rect);
        if(rect.width || rect.height) this.position = new Vector2({x:rect.width || 0.0, y:rect.height || 0.0});
    }

    get width(){
        return this.size.x;
    }
    get height(){
        return this.size.y;
    }
};

