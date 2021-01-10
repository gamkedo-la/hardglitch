export {
    rotate_array,
    shuffle_array,
    random_sample,
    random_bag_pick,
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
    draw_round_rectangle,
    ofmt,
    not,
    invoke_on_members,
    set_on_members,
    lazy_call,
    add_text_line,
    escaped,
    copy_data,
    is_generator,
    is_generator_function,
    splice,
    auto_newlines,
    no_linejumps,
    some_member,
    every_members,
}

import * as debug from "../system/debug.js";

// Rotates the elements of an array-like object.
function rotate_array(array, count = 1){
    debug.assertion(()=>array instanceof Array);
    debug.assertion(()=>Number.isInteger(count) && count >=0);
    while(count > 0){
        let element = array.shift();
        array.push(element);
        --count;
    }
    return array;
}

// Source: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle_array(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Return a random element of the provided array.
function random_sample(array){
    debug.assertion(()=>array instanceof Array);
    if(array.length == 0)
        return null;
    return array[ random_int(0, array.length - 1) ];
}

// Return several elements from the provided array, picked randomly and removed when picked.
function random_bag_pick(array, count){
    debug.assertion(()=>array instanceof Array);
    debug.assertion(()=>Number.isInteger(count) && count >= 0);
    const picked = [];
    while(count > 0 && array.length > 0){
        --count;
        const picked_idx = random_int(0, array.length - 1);
        const picked_elements = array.splice(picked_idx, 1);
        debug.assertion(()=>picked_elements instanceof Array && picked_elements.length <= 1);
        picked.push(...picked_elements);
    }
    return picked;
}

// pick a float between min/max
function random_float(min, max) {
    return Math.random() * (max-min) + min;
}

// Get a random integer between [min, max] (both inclusive)
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function random_int(min, max) {
    debug.assertion(()=>Number.isInteger(min));
    debug.assertion(()=>Number.isInteger(max));
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }

function is_number(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function index_from_position(width, height, position){
    debug.assertion(()=>Number.isInteger(width));
    debug.assertion(()=>Number.isInteger(height));
    debug.assertion(()=>width > 0);
    debug.assertion(()=>height > 0);
    debug.assertion(()=>Number.isInteger(position.x) && Number.isInteger(position.y));
    debug.assertion(()=>position.x < width);
    debug.assertion(()=>position.y < height);
    return (position.y * width) + position.x;
}

function position_from_index(width, height, index){
    debug.assertion(()=>Number.isInteger(width));
    debug.assertion(()=>Number.isInteger(height));
    debug.assertion(()=>width > 0);
    debug.assertion(()=>height > 0);
    debug.assertion(()=>Number.isInteger(index));

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

// Source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function draw_round_rectangle(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }

  }

function ofmt(obj, name) {
    if (!obj) return "";
    let keys = Object.keys(obj);
    let kvs = [];
    for (const key of keys) {
        kvs.push(key + ":" + obj[key])
    }
    if (name) {
        return "[" + name + ":" + kvs.join(",") + "]";
    } else {
        return "[" + kvs.join(",") + "]";
    }
}

// Provide the reverse result of a predicate.
function not(predicate){
    return (...args)=>{
        return !predicate(...args);
    };
}


// Invoke a function with parametters to all members of an object that have that function.
function invoke_on_members(object, function_name, ...args){
    return Object.values(object)
            .filter(member => member instanceof Object && member[function_name] instanceof Function)
            .map(member => member[function_name](...args));
}

// Set a value to all the member of an objects which are objects and have that member name.
function set_on_members(object, member_name, value){
    return Object.values(object)
            .filter(member => member instanceof Object && member[member_name] !== undefined)
            .forEach(member => member[member_name] = value);
}

// Returns true if all object members return true when passed to the predicate.
function every_members(object, predicate){
    return Object.values(object)
        .filter(member => member instanceof Object)
        .every(member => predicate(member));
}

// Returns true if any object members return true when passed to the predicate.
function some_member(object, predicate){
    return Object.values(object)
        .filter(member => member instanceof Object)
        .some(member => predicate(member));
}

// Creates a generator function that will yield the value(s) returned by the call to that function with the provided arguments.
// This will also work if the function returns an iterable, like an array, and will then provide each value one by one.
// The function will only be called at the first iteration of the generator.
function* lazy_call(function_to_call, ...args){
    yield* function_to_call(...args);
}

// Adds a line with a jumpline character to a string, IFF that string have something already.
function add_text_line(text, new_line_string = ""){
    debug.assertion(()=>typeof text === "string" || text instanceof String);
    debug.assertion(()=>typeof new_line_string === "string" || new_line_string instanceof String);

    if(text.length > 0){
        text += `\n${new_line_string}`
    } else {
        text += new_line_string;
    }
    return text;
}

// Source: https://stackoverflow.com/questions/4313841/insert-a-string-at-a-specific-index
/**
 * The splice() method changes the content of a string by removing a range of
 * characters and/or adding new characters.
 *
 * @this {String}
 * @param {number} start Index at which to start changing the string.
 * @param {number} delCount An integer indicating the number of old chars to remove.
 * @param {string} newSubStr The String that is spliced in.
 * @return {string} A new string with the spliced substring.
 */
function splice(text, start, delCount, newSubStr) {
    debug.assertion(()=>typeof text === "string" || text instanceof String);
    return text.slice(0, start) + newSubStr + text.slice(start + Math.abs(delCount));
}

function auto_newlines(text, max_size){
    debug.assertion(()=>typeof text === "string" || text instanceof String);
    debug.assertion(()=>Number.isInteger(max_size));

    let last_whitespace_idx = 0;
    let current_line_width = 0;
    for(let char_idx = 0; char_idx < text.length; ++char_idx){
        ++current_line_width;
        const char = text[char_idx];
        if(char === ' ' || char === '\n') last_whitespace_idx = char_idx;
        if(char === '\n') current_line_width = 0;
        if(current_line_width > max_size){
            text = splice(text, last_whitespace_idx, 1, `\n`);
            current_line_width -= max_size;
        }
    }
    return text;
}

// Returns the same text without any line jumps.
function no_linejumps(text){
    debug.assertion(()=>typeof text === "string" || text instanceof String);
    return text.replace(/\r?\n|\r/g, "");
}

// Adds double quote esquapes to double quotes.
function escaped(str){
    return str.replace(/\"/g, `\\"`);
}

// Makes a (deep) copy of a simple (non-typed) data object and returns it.
function copy_data(value){
    const copy = JSON.parse(JSON.stringify(value));
    return copy;
}


// Source: https://github.com/blakeembrey/is-generator
/**
 * Check whether an object is a generator.
 *
 * @param  {Object}  obj
 * @return {Boolean}
 */
function is_generator(obj) {
    return obj &&
        typeof obj.next === 'function' &&
        typeof obj.throw === 'function';
}

// Souce: https://github.com/blakeembrey/is-generator
/**
 * Check whether a function is generator.
 *
 * @param  {Function} fn
 * @return {Boolean}
 */
function is_generator_function(fn) {
return typeof fn === 'function' &&
    fn.constructor &&
    fn.constructor.name === 'GeneratorFunction';
}