export {
    rotate_array,
    random_sample,
    random_float,
    random_int,
    is_number,
    index_from_position,
    position_from_index,
    remove_array_item,
    remove_all_array_items,
    duration,
    is_valid_duration,
    group_per_type,
    clamp,
}


// Rotates the elements of an array-like object.
function rotate_array(array, count = 1){
    console.assert(array instanceof Array);
    console.assert(Number.isInteger(count) && count >=0);
    while(count > 0){
        let element = array.shift();
        array.push(element);
        --count;
    }
}

// Return a random element of the provided array.
function random_sample(array){
    console.assert(array instanceof Array);
    if(array.length == 0)
        return null;
    return array[ Math.floor( Math.random() * array.length ) ];
}

// pick a float between min/max
function random_float(min, max) {
    return Math.random() * (max-min) + min;
}

// Get a random integer between [min, max] (both inclusive)
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function random_int(min, max) {
    console.assert(Number.isInteger(min));
    console.assert(Number.isInteger(max));
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }

function is_number(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function index_from_position(width, height, position){
    console.assert(Number.isInteger(width));
    console.assert(Number.isInteger(height));
    console.assert(width > 0);
    console.assert(height > 0);
    console.assert(Number.isInteger(position.x) && Number.isInteger(position.y));
    console.assert(position.x < width);
    console.assert(position.y < height);
    return (position.y * width) + position.x;
}

function position_from_index(width, height, index){
    console.assert(Number.isInteger(width));
    console.assert(Number.isInteger(height));
    console.assert(width > 0);
    console.assert(height > 0);
    console.assert(Number.isInteger(index));

    return { x: index % width, y: Math.floor(index / width) };
}

function remove_array_item(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

function remove_all_array_items(arr, value) {
    var i = 0;
    while (i < arr.length) {
        if(arr[i] === value) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
    return arr;
}


function duration(start_time, end_time){
    return end_time - start_time;
}

function is_valid_duration(value){
    return is_number(value)
        && value > 0;
}

// Returns an object which members corresponds to each type of the list of objects provided, each value being objects of that type.
function group_per_type(objects){
    const typed_groups = {};
    for(const object of objects){
        const type_name = typeof(object) == "object" ? object.constructor.name : typeof(object);
        if(typed_groups[type_name] === undefined){
            typed_groups[type_name] = [];
        }
        typed_groups[type_name].push(object);
    }
    return typed_groups;
}


// Modified from Source: https://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
};