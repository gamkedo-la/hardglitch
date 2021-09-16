// This file contain code related to grid operations and container.

export {
    Grid,
    merge_grids,
    merged_grids_size,
}

import * as debug from "../system/debug.js";
import { position_from_index } from "../system/utility.js";

// A grid of elements, representing the topology of a world.
// Multiple grids can be used to represent layers of the world.
class Grid {
    constructor(width, height, elements){
        debug.assertion(()=>width > 1);
        debug.assertion(()=>height > 1);
        this.width = width;
        this.height = height;
        if(elements){
            debug.assertion(()=>elements instanceof Array);
            debug.assertion(()=>elements.length == width * height);
            this.elements = elements;
            this.clean();
        } else {
            this.elements = new Array(width * height);
        }

    }

    get size() { return this.width * this.height; }

    // Removes all null values.
    clean(){
        for(let idx = 0; idx < this.size; ++idx){
            if(this.elements[idx] === null){
                delete this.elements[idx];
            }
        }
    }

    fill(value){
        this.elements.fill(value);
        return this;
    }

    /**
     * determine storage index given either a point or x/y coordinates in grid
     * @param {*} p - either a point or x index within grid
     * @param {*} j - (optional) y index within grid
     */
    index(p, j) {
        if (typeof p === 'number') {
            return (p) % this.width + this.width*j;
        }
        return (p.x) % this.width + this.width*p.y;
    }

    get_at(p, j){
        const idx = this.index(p, j);
        debug.assertion(()=>idx >= 0 && idx < this.elements.length);
        return this.elements[idx];
    }

    set_at(v, p, j){
        const idx = this.index(p, j);
        debug.assertion(()=>idx >= 0 && idx < this.elements.length);
        this.elements[idx] = v;
    }

    remove_at(p, j){
        const idx = this.index(p, j);
        debug.assertion(()=>idx >= 0 && idx < this.elements.length);
        delete this.elements[idx];
    }

    /**
     *  get node left of given point
     */
    left(p, dflt=0) {
        if (p.x>0) {
            const idx = this.index(p.x-1, p.y);
            return this.elements[idx];
        }
        return dflt;
    }

    right(p, dflt=0) {
        if (p.x<this.width-1) {
            const idx = this.index(p.x+1, p.y);
            return this.elements[idx];
        }
        return dflt;
    }

    up(p, dflt=0) {
        if (p.y>0) {
            const idx = this.index(p.x, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    down(p, dflt=0) {
        if (p.y<this.height-1) {
            const idx = this.index(p.x, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    ul(p, dflt=0) {
        if (p.x>0 && p.y>0) {
            const idx = this.index(p.x-1, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    ur(p, dflt=0) {
        if (p.x<this.width-1 && p.y>0) {
            const idx = this.index(p.x+1, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    dl(p, dflt=0) {
        if (p.x>0 && p.y<this.height-1) {
            const idx = this.index(p.x-1, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    dr(p, dflt=0) {
        if (p.x<this.width-1 && p.y<this.height-1) {
            const idx = this.index(p.x+1, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    matching_positions(predicate){
        const positions = [];
        this.elements.forEach((element, idx)=>{
            if(predicate(element))
                positions.push(position_from_index(this.width, this.height, idx));
        });
        return positions;
    }

};

function merged_grids_size(...position_grids){
    let width = 0;
    let height = 0;
    position_grids.forEach((pos_grid)=> {
        debug.assertion(()=>Number.isInteger(pos_grid.position.x));
        debug.assertion(()=>Number.isInteger(pos_grid.position.y));
        debug.assertion(()=>pos_grid.grid instanceof Grid);
        width = Math.max(width, pos_grid.position.x + pos_grid.grid.width);
        height = Math.max(height, pos_grid.position.y + pos_grid.grid.height);
    });

    return {width, height};
}

// Create a new grid based on a sequence of grids and position of the top-left square of each grid.
// The arguments must be like this:
// { position: {x, y}, grid: grid } // Here grid must be a Grid.
// The different grids will be written in the order they are provided.
function merge_grids(...position_grids){

    const size = merged_grids_size(...position_grids);
    const width = size.width;
    const height = size.height;

    const merged_grid = new Grid(width, height);
    position_grids.forEach((pos_grid)=> {
        const grid_pos = pos_grid.position;
        const grid = pos_grid.grid;
        debug.assertion(()=>grid instanceof Grid);
        debug.assertion(()=>grid_pos.x !== undefined && grid_pos.y !== undefined);
        for(let y = 0; y < grid.height; ++y){
            for(let x = 0; x < grid.width; ++x){
                const source_pos = { x, y };
                const merged_pos = { x:grid_pos.x + x, y: grid_pos.y + y};
                merged_grid.set_at(grid.get_at(source_pos), merged_pos);
            }
        }
    });

    return merged_grid;
}