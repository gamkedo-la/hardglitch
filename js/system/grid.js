// This file contain code related to grid operations and container.

export { Grid }


import { position_from_index } from "../system/utility.js";

// A grid of elements, representing the topology of a world.
// Multiple grids can be used to represent layers of the world.
class Grid {
    constructor(width, height, elements){
        console.assert(width > 2);
        console.assert(height > 2);
        this.width = width;
        this.height = height;
        if(elements){
            console.assert(elements instanceof Array);
            console.assert(elements.length == width * height);
            this.elements = elements;
        } else {
            this.elements = new Array(width * height);
        }
    }

    /**
     * determine storage index given either a point or x/y coordinates in grid
     * @param {*} p - either a point or x index within grid
     * @param {*} j - (optional) y index within grid
     */
    idx(p, j) {
        if (typeof p === 'number') {
            return (p) % this.width + this.width*j;
        }
        return (p.x) % this.width + this.width*p.y;
    }

    get_at(p, j){
        let idx = this.idx(p, j);
        return this.elements[idx];
    }

    set_at(v, p, j){
        let idx = this.idx(p, j);
        this.elements[idx] = v;
    }

    /**
     *  get node left of given point
     */
    left(p, dflt=0) {
        if (p.x>0) {
            let idx = this.idx(p.x-1, p.y);
            return this.elements[idx];
        }
        return dflt;
    }

    right(p, dflt=0) {
        if (p.x<this.width-1) {
            let idx = this.idx(p.x+1, p.y);
            return this.elements[idx];
        }
        return dflt;
    }

    up(p, dflt=0) {
        if (p.y>0) {
            let idx = this.idx(p.x, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    down(p, dflt=0) {
        if (p.y<this.height-1) {
            let idx = this.idx(p.x, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    ul(p, dflt=0) {
        if (p.x>0 && p.y>0) {
            let idx = this.idx(p.x-1, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    ur(p, dflt=0) {
        if (p.x<this.width-1 && p.y>0) {
            let idx = this.idx(p.x+1, p.y-1);
            return this.elements[idx];
        }
        return dflt;
    }

    dl(p, dflt=0) {
        if (p.x>0 && p.y<this.height-1) {
            let idx = this.idx(p.x-1, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    dr(p, dflt=0) {
        if (p.x<this.width-1 && p.y<this.height-1) {
            let idx = this.idx(p.x+1, p.y+1);
            return this.elements[idx];
        }
        return dflt;
    }

    matching_positions(predicate){
        const positions = [];
        for(let idx = 0; idx < this.elements.length; ++idx){
            const element = this.elements[idx];
            if(element != undefined && predicate(element)){
                positions.push(position_from_index(this.width, this.height, idx));
            }
        }
        return positions;
    }

};



