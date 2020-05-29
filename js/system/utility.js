export {
    rotate_array,
    random_sample,
    random_int,
    is_number,
    index_from_position,
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
    console.assert(Number.isInteger(position.x) && Number.isInteger(position.y));
    console.assert(position.x < width);
    console.assert(position.y < height);
    return (position.y * width) + position.x;
}
