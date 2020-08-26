export {
    ColorShiftDataXForm,
    HorizontalBandingDataXForm,
    ColorSwapDataXForm,
};

import { random_float } from "../system/utility.js";

class ColorShiftDataXForm {
    constructor(dx, dy, minx, miny, maxx, maxy, rshift, gshift, bshift) {
        this.dx = dx;
        this.dy = dy;
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
        this.rshift = rshift;
        this.gshift = gshift;
        this.bshift = bshift;
        console.log("dx: " + dx + " dy: " + dy + " minx: " + minx + " miny: " + miny + " maxx: " + maxx + " maxy: " + maxy);
    }

    do(idata) {
        //console.log("data transform on idata: " + idata.width + "," + idata.height);
        // create empty data array
        // shift color data
        for (let j=0; j<idata.height; j++) {
            for (let i=0; i<idata.width; i++) {
                let idx = (j*idata.width+i)*4;
                let r = idata.data[idx];
                let g = idata.data[idx+1];
                let b = idata.data[idx+2];
                let a = idata.data[idx+3];
                let lb = 0;
                // color loss to shift
                if (i>=this.minx && i<this.maxx && j>=this.miny && j<this.maxy) {
                    r -= r*this.rshift;
                    g -= g*this.gshift;
                    b -= b*this.bshift;
                    // FIXME
                    lb = idata.data[idx+2]*this.bshift;
                }
                // target index
                let xi = Math.round(i-this.dx);
                let xj = Math.round(j-this.dy);
                if (xi>=0 && xi<idata.width && xj>=0 && xj<idata.height) {
                    let xidx = (xj*idata.width+xi)*4;
                    let xr = idata.data[xidx];
                    let xg = idata.data[xidx+1];
                    let xb = idata.data[xidx+2];
                    let xa = idata.data[xidx+3];
                    // color gained from shift
                    r += xr*this.rshift;
                    g += xg*this.gshift;
                    b += xb*this.bshift;
                    a = Math.max(xa,a);
                    //console.log("i: " + i + " xi: " + xi + " xb: " + xb + " b: " + idata.data[idx+2] + " fb: " + b + " a: " + idata.data[idx+3] + " fa: " + a + " lb: " + lb);
                }
                // set xdata
                idata.data[idx] = Math.min(Math.round(r), 255);
                idata.data[idx+1] = Math.min(Math.round(g), 255);
                idata.data[idx+2] = Math.min(Math.round(b), 255);
                idata.data[idx+3] = Math.min(Math.round(a), 255);
            }
        }
    }
}

class HorizontalBandingDataXForm {
    constructor(maxOffset, affinity, minx, miny, maxx, maxy) {
        this.maxOffset = maxOffset;
        this.affinity = affinity;
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
    }

    do(idata) {
        // pick initial banding offset
        let offset = random_float(-this.maxOffset, this.maxOffset);
        let sign = 1;
        // shift entire rows...
        for (let j=0; j<idata.height; j++) {
            // affinity check...
            if (Math.random() > this.affinity) {
                if (sign > 0) {
                    offset = random_float(-this.maxOffset, offset);
                } else {
                    offset = random_float(offset, this.maxOffset);
                }
                sign *= -1;
            }
            for (let i=0; i<idata.width; i++) {
                // only copy pixels within the window...
                if (i>=this.minx && i<this.maxx && j>=this.miny && j<this.maxy) {
                    let idx = (j*idata.width+i)*4;
                    let r = idata.data[idx];
                    let g = idata.data[idx+1];
                    let b = idata.data[idx+2];
                    let a = idata.data[idx+3];
                    // target index
                    let xi = Math.round(i-offset);
                    let xj = j;
                    if (xi>=0 && xi<idata.width && xj>=0 && xj<idata.height) {
                        let xidx = (xj*idata.width+xi)*4;
                        idata.data[xidx] = Math.round(r);
                        idata.data[xidx+1] = Math.round(g);
                        idata.data[xidx+2] = Math.round(b);
                        idata.data[xidx+3] = Math.round(a);
                    }
                }
            }
        }
    }
}

class ColorSwapDataXForm {
    constructor(minx, miny, maxx, maxy, roff, goff, boff) {
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
        this.roff = roff;
        this.goff = goff;
        this.boff = boff;
    }

    do(idata) {
        let data = idata.data;
        // transform data
        for (let j=0; j<idata.height; j++) {
            for (let i=0; i<idata.width; i++) {
                if (i>=this.minx && i<this.maxx && j>=this.miny && j<this.maxy) {
                    let idx = (j*idata.width+i)*4;
                    data[idx] = (data[idx] + this.roff) % 255;
                    data[idx+1] = (data[idx+1] + this.goff) % 255;
                    data[idx+2] = (data[idx+2] + this.goff) % 255;
                    data[idx+3] = data[idx+3];
                }
            }
        }
    }

}