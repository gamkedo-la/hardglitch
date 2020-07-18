// This is a re-implementation of the Python example of the algorithm described there:
// https://www.albertford.com/shadowcasting/

export {
    compute_fov,
}

import { Fraction } from "../3rd-party/fraction.js";

function is_position(thing){
    return thing && Number.isInteger(thing.x) && Number.isInteger(thing.y);
}

function* range(begin, end, step = 1){
    console.assert(Number.isInteger(begin));
    console.assert(Number.isInteger(end));
    console.assert(Number.isInteger(end));
    while(begin !== end){
        yield begin;
        begin += step;
    }
}


function slope(tile){
    const [row_depth, col] = tile;
    return Fraction(2 * col - 1, 2 * row_depth);
}

function is_symmetric(row, tile){
    console.assert(row instanceof Row);
    const [row_depth, col] = tile;
    return col >= row.depth * row.start_slope
        && col <= row.depth * row.end_slope;
}

function round_ties_up(n){
    return Math.floor(n + 0.5);
}

function round_ties_down(n){
    return Math.ceil(n - 0.5);
}

const cardinals = {
    north: 0,
    east : 1,
    south: 2,
    west : 3,
};

function is_cardinal(value){
    return Number.isInteger(value)
        && Object.values(cardinals).includes(value);
}

class Quadrant{

    constructor(cardinal, origin){
        console.assert(is_cardinal(cardinal));
        console.assert(is_position(origin));
        this.cardinal = cardinal;
        this.ox = origin.x;
        this.oy = origin.y;
    }

    transform(tile){
        const [ row, col ] = tile;
        if (this.cardinal === cardinals.north)
            return [ this.ox + col, this.oy - row ];
        if (this.cardinal === cardinals.south)
            return [ this.ox + col, this.oy + row ];
        if (this.cardinal === cardinals.east)
            return [ this.ox + row, this.oy + col ];
        if (this.cardinal === cardinals.west)
            return [ this.ox - row, this.oy + col ];
        console.error("WE SHOULD NEVER REACH THIS POINT");
    }
};

class Row {

    constructor( depth, start_slope, end_slope){
        this.depth = depth;
        this.start_slope = start_slope;
        this.end_slope = end_slope;
    }

    *tiles(){
        const min_col = round_ties_up(this.depth * this.start_slope);
        const max_col = round_ties_down(this.depth * this.end_slope);
        for(const col of range(min_col, max_col + 1)){
            yield [ this.depth, col ];
        }
    }

    next(){
        return new Row(this.depth + 1, this.start_slope, this.end_slope);
    }

};


function compute_fov(origin, is_blocking, mark_visible){
    console.assert(is_position(origin));
    console.assert(is_blocking instanceof Function);
    console.assert(mark_visible instanceof Function);

    mark_visible(origin.x, origin.y);

    for(const i of range(0, 4)){
        const quadrant = new Quadrant(i, origin);

        const reveal = (tile)=>{
            const [x, y] = quadrant.transform(tile);
            mark_visible(x, y);
        };

        const is_wall = (tile)=>{
            if(!tile)
                return false;
            const [x, y] = quadrant.transform(tile);
            return is_blocking(x, y);
        };

        const is_floor = (tile)=>{
            if(!tile)
                return false;
            const [x, y] = quadrant.transform(tile);
            return !is_blocking(x, y);
        }

        const scan = (row)=>{
            console.assert(row.depth <= 100);
            let prev_tile;
            for(const tile of row.tiles()){
                if(is_wall(tile) || is_symmetric(row, tile))
                    reveal(tile);
                if(is_wall(prev_tile) && is_floor(tile))
                    row.start_slope = slope(tile);
                if(is_floor(prev_tile) && is_wall(tile)){
                    const next_row = row.next();
                    next_row.end_slope = slope(tile);
                    scan(next_row);
                }
                prev_tile = tile;
            }
            if(is_floor(prev_tile))
                scan(row.next());
        };

        const first_row = new Row(1, Fraction(-1), Fraction(1));
        scan(first_row);
    }
}

// function scan_iterative(row){
//     console.assert(row instanceof Row);
//     const rows = [row];
//     while(rows.length > 0){
//         const row = rows.pop();
//         let prev_tile;
//         for(const tile of row.tiles()){
//             if is_wall(tile) or is_symmetric(row, tile):
//                 reveal(tile)
//             if is_wall(prev_tile) and is_floor(tile):
//                 row.start_slope = slope(tile)
//             if is_floor(prev_tile) and is_wall(tile):
//                 next_row = row.next()
//                 next_row.end_slope = slope(tile)
//                 rows.append(next_row)
//             prev_tile = tile
//         }
//         if is_floor(prev_tile)
//             rows.append(row.next());
//     }
// }