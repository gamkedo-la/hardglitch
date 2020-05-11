export {
    rotate_array,
    random_sample,
    random_int,
}


// Rotates the elements of an array-like object.
function rotate_array(array, count = 1){
    while(count > 0){
        let element = array.shift();
        array.push(element);
        --count;
    }
}

// Return a random element of the provided array.
function random_sample(array){
    if(array.length == 0)
        return null;
    return array[ Math.floor( Math.random() * array.length ) ];
}

// Get a random integer between [min, max] (both inclusive)
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function random_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }