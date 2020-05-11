
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

    translate(translation){
        return new Vector2({ x: this.x + translation.x, y: this.y + translation.y });
    }

    rotate(degrees){
        throw "not implemented yet";
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

