export {
    Particle,
    ParticleEmitter,
    ParticleSequence,
    ParticleGroup,
    ParticleSystem,
    FadeLineParticle,
    FadeParticle,
    OffsetGlitchParticle,
    ColorGlitchParticle,
    BlipParticle,
    SwirlParticle,
    SwirlPrefab,
    RingParticle,
    ShootUpParticle,
    FlashParticle,
    BlipEdgeParticle,
}

import { camera } from "./graphics.js";
import { random_int, random_float } from "../system/utility.js";
import { Color } from "../system/color.js";
import { Vector2 } from "../system/spatial.js";


// This object is reused for optimization, do not move it into the functions using it.
const checkArea = {
    position: { x: 0, y: 0 },
    width: 64, height: 64 // TODO: find a better way to specify this size
};

/**
 * A particle system intended to keep track of all active particles and emitters
 */
class ParticleSystem {
    /**
     * Create a new particle system
     */
    constructor() {
        this.items = [];
        this.active = [];
        this.alwaysActive = false;
        this.dbg = false;
        this.dbgTimer = 0;
    }

    /**
     * Add a tracked particle or emitter
     * @param {*} p
     */
    add(p) {
        this.items.push(p);
    }

    /**
     * Remove a particle or emitter from tracked list
     * @param {*} p
     */
    remove(p) {
        let idx = this.items.indexOf(p);
        if (idx >= 0) {
            this.items.splice(idx, 1);
        }
    }

    isActive(obj) {
        if (this.alwaysActive) return true;
        if (obj instanceof ParticleGroup) return true;
        checkArea.position.x = obj.x;
        checkArea.position.y = obj.y;
        return camera.can_see(checkArea);
    }

    /**
     * Execute the main update thread for all emitters/particles
     */
    update(delta_time) {
        // iterate through tracked items
        let inactive = 0;
        for (let i=this.items.length-1; i>=0; i--) {
            const item = this.items[i];
            // skip inactive items
            if (!this.isActive(item)) {
                inactive++;
                continue;
            }
            // update each object
            item.update(delta_time);
            // if any items are done, remove them
            if (item.done) {
                this.items.splice(i, 1);
            }
        }
        if (this.dbg) {
            this.dbgTimer += delta_time;
            if (this.dbgTimer > 1000) {
                this.dbgTimer = 0;
                console.log("objs: " + this.items.length + " inactive: " + inactive);
            }
        }
    }

    draw(canvas_context) {
        // make sure they don't impact the rest of the drawing code
        canvas_context.save();
        // iterate through tracked items
        this.items.filter(item => item.draw && this.isActive(item)) // (skip drawing for emitters)
            .forEach(item => {
                // draw each tracked particle
                item.draw(canvas_context);
            });
        canvas_context.restore();
    }

}

/**
 * class representing a grouping of particles
 */
class ParticleGroup {
    /**
     * Create a new particle system
     */
    constructor(ttl=0) {
        this.items = [];
        this.ttl = ttl;
        this._done = false;
    }

    /**
     * Indicates if the emitter has completed its life-cycle (and can be discarded)
     */
    get done() {
        return this._done;
    }

    *[Symbol.iterator]() {
        for (const item of this.items) {
            yield item;
        }
    }

    /**
     * Add a tracked particle or emitter
     * @param {*} p
     */
    add(p) {
        this.items.push(p);
    }

    /**
     * Remove a particle or emitter from tracked list
     * @param {*} p
     */
    remove(p) {
        let idx = this.items.indexOf(p);
        if (idx >= 0) {
            this.items.splice(idx, 1);
        }
    }

    /**
     * Execute the group update thread to check if any particles have expired
     */
    update(delta_time) {
        delta_time *= .001;
        // iterate through tracked items
        for (let i=this.items.length-1; i>=0; i--) {
            // if any items are done, remove them
            if (this.items[i].done) {
                this.items.splice(i, 1);
            }
        }
        if (this.done) return;
        // time-to-live
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) {
                this._done = true;
            }
        }
    }
}

/**
 * A basic particle emitter which calls the specified generator function every given number of ticks
 */
class ParticleEmitter {

    /**
     * Create a new particle emitter
     * @param {*} psys - link to the parent particle system
     * @param {*} genFcn - particle generator function
     * @param {*} interval - interval (in seconds) between particle generation
     * @param {*} jitter - (optional) percentage of interval to create a jitter between particle generation.  0 would indicate no jitter, 1 would indicate an interval between 0 and 2x interval.
     * @param {*} lifetime - (optional) emitter lifetime (in seconds), defaults to 0 which means no lifetime.
     */
    constructor(psys, x, y, genFcn, interval, jitter=0, lifetime=0, count=1) {
        this.psys = psys;
        this.x = x;
        this.y = y;
        this.genFcn = genFcn;
        this.interval = interval;
        this.jitter = jitter/100;
        this.lifetime = lifetime;
        this.count = count;
        this.currentTick = 0;
        this._done = false;
        // compute next time to emit
        this.tte = 0;
        this.nextTTE();
        // keep track of particles emitter has generated
        this.particles = [];
        this.once = true;
    }

    /**
     * computes new time to emit based on interval and jitter
     */
    nextTTE() {
        this.tte = this.interval;
        if (this.jitter) {
            let ij = this.jitter * this.interval;
            this.tte += ((Math.random() * ij * 2) - ij);
        }
        if (this.tte < .1) this.tte = .1; // minimum interval;
    }


    /**
     * Indicates if the emitter has completed its life-cycle (and can be discarded)
     */
    get done() {
        return this._done;
    }

    /**
     * run generator to emit particle
     */
    emit() {
        for (let i=0; i<this.count; i++) {
            let p = this.genFcn();
            this.psys.add(p);
        }
    }

    /**
     * Update the particle emitter.  This is where new particles get generated based on the emitter schedule.
     */
    update(delta_time) {
        if (this.once) {
            this.once = false;
            this.emit();
        }
        // convert delta time to seconds
        delta_time *= .001;
        // don't update if emitter is done
        if (this.done) return;
        // update running emitter lifetime (if set)
        if (this.lifetime) {
            this.lifetime -= delta_time;
            if (this.lifetime <= 0) {
                this._done = true;
                return;
            }
        }
        // update tte
        this.tte -= delta_time;
        // run generator if tte is zero
        if (this.tte <= 0) {
            this.emit();
            // compute next tte
            this.nextTTE();
        }
    }
}

class ParticleSequence {
    /**
     * Create a new particle sequence
     * @param {*} psys - link to the parent particle system
     * @param {*} genFcns - emitter/particle generator functions
     * @param {*} interval - interval (in seconds) between generation
     * @param {*} jitter - (optional) percentage of interval to create a jitter between particle generation.  0 would indicate no jitter, 1 would indicate an interval between 0 and 2x interval.
     * @param {*} iterations - (optional) number of iterations to run, zero indicates infinite loop
     */
    constructor(psys, genFcns, interval, jitter=0, iterations=1) {
        this.psys = psys;
        this.genFcns = genFcns;
        this.interval = interval;
        this.jitter = jitter/100;
        this.iterations = iterations;
        this.currentTick = 0;
        this._done = false;
        this.tte = 0;
        this.pwait;             // current particle/emitter we are waiting on
        this.genIdx = 0;        // current generator
    }

    /**
     * computes new time to emit based on interval and jitter
     */
    nextTTE() {
        this.tte = this.interval;
        if (this.jitter) {
            let ij = this.jitter * this.interval;
            this.tte += ((Math.random() * ij * 2) - ij);
        }
        if (this.tte < .1) this.tte = .1; // minimum interval;
    }

    /**
     * Indicates if the emitter has completed its life-cycle (and can be discarded)
     */
    get done() {
        return this._done;
    }

    /**
     * update processing... this is where the sequence logic is run
     */
    update(delta_time) {
        delta_time *= .001;         // convert delta time to seconds
        if (this.done) return;      // don't update if done
        if (this.once) {
            this.once = false;
            this.emit();
        }
        // do we have a particle/emitter we are waiting for, check if we are done w/ sequence
        if (this.pwait) {
            // is it done?
            if (this.pwait.done) {
                this.pwait = null;
                // advance to next generator
                this.genIdx++;
                if (this.genIdx >= this.genFcns.length) {
                    if (this.iterations == 0 || this.iterations > 1) {
                        this.genIdx = 0;
                        if (this.iterations) this.iterations--;
                    } else {
                        this._done = true;
                    }
                }
            } else {
                return;
            }
        }
        // update tte
        this.tte -= delta_time;
        // run generator if tte is zero
        if (this.tte <= 0) {
            this.pwait = this.genFcns[this.genIdx]();
            this.psys.add(this.pwait);
            // compute next tte
            this.nextTTE();
        }
    }
}

/**
 * The base particle class
 */
class Particle {
    /**
     * Create a new particle
     * @param {*} ctx
     * @param {*} x
     * @param {*} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this._done = false;
    }

    /**
     * Indicates if the particle has completed its life-cycle (and can be discarded)
     */
    get done() {
        return this._done;
    }

}

/**
 * A particle for a line that fades in/out
 */
class FadeLineParticle extends Particle {
    /**
     * Create a new fade line particle.
     * @param {*} ctx - 2d canvas context to draw particle onto
     * @param {*} x - starting x position of particle
     * @param {*} y - starting y position of particle
     * @param {*} dx - delta x in pixels per second, speed of particle
     * @param {*} dy - delta y in pixels per second, speed of particle
     * @param {*} color  - color for particle
     * @param {*} lifetime - lifetime of particle, in seconds
     * @param {*} length - length of line,in pixels
     * @param {*} width - width of line,in pixels
     * @param {*} minOpacity - minimum opacity of line (opacity of line at beginning/end of particle loop)
     * @param {*} maxOpacity - max opacity of line (opacity of line at midpoint of animation)
     */
    constructor(x, y, dx, dy, color, lifetime, length, width, minOpacity, maxOpacity) {
        super(x, y);
        this.dx = dx;
        this.dy = dy;
        // base color
        this.color = color;
        this.lifetime = lifetime;
        this.maxlen = length;
        this.width = width;
        this.minOpacity = minOpacity;
        this.maxOpacity = maxOpacity;
        this.len = 0;
        this.emergettl = 0;
        this.ttl = lifetime;
        // compute x/y percents of total velocity
        this.ticklen = Math.sqrt(dx*dx + dy*dy);
        this.px = dx/this.ticklen;
        this.py = dy/this.ticklen;
        // compute center of animation
        this.centerx = this.x + dx*lifetime*.5 + this.px*length*.5;
        this.centery = this.y + dy*lifetime*.5 + this.py*length*.5;
        this.centerlen = this.ticklen*lifetime*.5 + length*.5;
    }

    // endpoint of line
    get endX() {
        return this.x + this.px*this.len;
    }
    get endY() {
        return this.y + this.py*this.len;
    }

    // midpoint of line
    get midX() {
        return this.x + this.px*this.len*.5;
    }
    get midY() {
        return this.y + this.py*this.len*.5;
    }

    getOpacity(x, y) {
        // compute distance from center point
        let dx = x-this.centerx;
        let dy = y-this.centery;
        // clamp distance to max of midlen
        let m = Math.min(Math.sqrt(dx*dx+dy*dy), this.centerlen);
        // linear interpolation w/ weights from distance away from midpoint to midpoint and using opacity as weight
        return this.minOpacity + (this.maxOpacity-this.minOpacity) * (m-this.centerlen)/(-this.centerlen);
    }

    getColor(x, y, factor=1) {
        // copy base color
        let c = this.color.copy();
        // adjust opacity based on distance from center
        c.a = this.getOpacity(x, y) * factor;
        return c;
    }

    getGradient(canvas_context) {
        let gradient = canvas_context.createLinearGradient(this.x, this.y, this.endX, this.endY);
        gradient.addColorStop(0, this.getColor(this.x, this.y, .1).toString());
        gradient.addColorStop(.5, this.getColor(this.midX, this.midY, 1).toString());
        gradient.addColorStop(1, this.getColor(this.endX, this.endY, .1).toString());
        return gradient;
    }

    draw(canvas_context) {

        canvas_context.strokeStyle = this.getGradient(canvas_context);
        canvas_context.lineWidth = this.width;
        canvas_context.lineCap = "round";
        canvas_context.beginPath();
        canvas_context.moveTo(this.x, this.y);
        canvas_context.lineTo(this.endX, this.endY);
        canvas_context.stroke();

    }

    update(delta_time) {
        if (this.done) return;
        // convert delta time to seconds
        delta_time *= .001;
        // stage 1: emerge
        // - starting w/ line at x,y and zero length, run until length is maxlen
        if (this.len < this.maxlen) {
            let ddx = this.dx * delta_time;
            let ddy = this.dy * delta_time;
            let dlen = Math.sqrt(ddx*ddx + ddy*ddy);
            this.len += dlen;
            this.emergettl += delta_time;
            if (this.len > this.maxlen) {
                let delta = this.len - this.maxlen;
                this.len = this.maxlen;
                this.x += delta * this.px;
                this.y += delta * this.py;
            }
        // stage 2: traverse
        // - run until ticks have expired
        } else if (this.ttl > 0) {
            this.x += (this.dx * delta_time);
            this.y += (this.dy * delta_time);
            this.ttl -= delta_time;
        // stage 3: dissolve
        // - run until we run down emerge ticks
        } else if (this.emergettl > 0) {
            this.x += (this.dx * delta_time);
            this.y += (this.dy * delta_time);
            this.emergettl -= delta_time;
        // stage 4: done
        } else {
            this._done = true;
        }
    }

}

/**
 * A particle for a circle that starts at a given position then slowly fades out
 */
class FadeParticle extends Particle {
    /**
     * Create a new fade particle
     * @param {*} ctx - 2d canvas context to draw particle onto
     * @param {*} x - starting x position of particle
     * @param {*} y - starting y position of particle
     * @param {*} dx - delta x in pixels per second, speed of particle
     * @param {*} dy - delta y in pixels per second, speed of particle
     * @param {*} size - size of particle (radius in pixels)
     * @param {*} color  - color for particle
     * @param {*} lifetime - lifetime of particle, in seconds
     */
    constructor(x, y, dx, dy, size, color, lifetime) {
        super(x, y);
        this.dx = dx;
        this.dy = dy;
        this.size = size;
        this.color = color;
        this.lifetime = lifetime;
        this.fade = 1;
        this.ttl = lifetime;
    }

    draw(canvas_context) {
        canvas_context.beginPath();
        canvas_context.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
        canvas_context.fillStyle = this.color.toString();
        canvas_context.fill();
    }

    update(delta_time) {
        if (this.done) return;
        // convert delta time to seconds
        delta_time *= .001;
        // update position
        this.x += (this.dx * delta_time);
        this.y += (this.dy * delta_time);
        // fade... slowly fade to nothing
        this.fade -= (delta_time/this.lifetime);
        this.color.a = this.fade;
        // time-to-live
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this._done = true;
        }
    }

}

class OffsetGlitchParticle extends Particle {
    constructor(x, y, width, height, dx, dy, ttl, fillColor) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.dx = dx;
        this.dy = dy;
        this.ttl = ttl;
        this.fillColor = fillColor;
    }

    draw(canvas_context) {
        let data = canvas_context.getImageData(this.x, this.y, this.width, this.height);
        if (this.fillColor) canvas_context.fillStyle = this.fillColor.toString();
        canvas_context.fillRect(this.x, this.y, this.width, this.height);
        //canvas_context.putImageData(data, this.x, this.y, Math.max(0, this.dx), Math.max(0,this.dy), this.width-this.dx, this.height-this.dy);
        //canvas_context.putImageData(data, this.x+this.dx, this.y+this.dy, Math.max(0, this.dx), Math.max(0,this.dy), this.width-this.dx, this.height-this.dy);
        canvas_context.putImageData(data, this.x+this.dx, this.y+this.dy);
    }

    update(delta_time) {
        if (this.done) return;
        // convert delta time to seconds
        delta_time *= .001;
        // time-to-live
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this._done = true;
        }
    }

}

class ColorGlitchParticle extends Particle {
    constructor(x, y, width, height, roff, goff, boff, ttl) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.roff = roff;
        this.goff = goff;
        this.boff = boff;
        this.ttl = ttl;
    }

    draw(canvas_context) {

        // pull area
        let idata = canvas_context.getImageData(this.x, this.y, this.width, this.height);
        let data = idata.data;
        // transform data
        for(var i = 0; i < data.length; i += 4) {
          // red
          data[i] = (data[i] + this.roff) % 255;
          // green
          data[i + 1] = (data[i + 1] + this.goff) % 255;
          // blue
          data[i + 2] = (data[i + 2] + this.goff) % 255;
        }
        canvas_context.putImageData(idata, this.x, this.y);

    }

    update(delta_time) {
        if (this.done) return;
        // convert delta time to seconds
        delta_time *= .001;
        // time-to-live
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this._done = true;
        }
    }
}

const blipImg = new Image();
blipImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAGpJREFUCJljYGBgYGC4t4R377fnfgz3lvAyMDAwMDLcW8IbxiU3e9W3R0qhXHL3Vn97lMq0V8LZ8f2/X3pzhM1NP/z7pbdXwtmRyfnF3v28jCwXU96ePCnAxHbJ+cXe/QwwMw98e+ELMxMAdOgpmvYoUogAAAAASUVORK5CYII=";
const sparkMinImg = new Image();
sparkMinImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAKJJREFUGJVjYCAShL44xANj8BJQWIQukIVDIVZxhtAXh1Yw3FvCu/fbcz/rpzvdQ18cWoEsz4LMWf3tUWool9xs5xd7lUK55O79+f9vObI8EzJnr4Sz44d/v/TOSnqYfvj3Sy+HX/0/TsWTP95k4GVkuWj8fMdJASa2S84v9u7HqZiVkSnq5b+f8w9IuLTCnITLc8SFBkY4YmrghTF48ClEBgC2gUsgQpNFAwAAAABJRU5ErkJggg==";
const sparkMaxImg = new Image();
sparkMaxImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAAXNSR0IArs4c6QAAAiFJREFUOI21lE9oE0EUxt9MN2mMNjYVapvdS7EYKIV46EXdpro1JJqDYhC8Sy7mIHgRL3rx4kla8VKvIr0UD2JxSAiNDQ3qRUGiAREPkz/GpsYNSbPbZKanQtnuJm2N3/F78/3mvYF5IFPigP8hmZJQjzj9RkPpKXBX4VAdy5S4uh2I+SkZPQBw2ugho+GnRGIAV+0Iv7QBFog4+9sMpuTjJ3TOJtJScNVYw0bjnRSkdoQX2wC3BYRa14or48Yz4UJyECEUsiP8xezCPVAAgD5A+Bjqe+bEQny9rQ1HyxkfAECklPLKlEw7sZB3AF5OioE/Zvk94+/q5tRftuW5NzixOK/mHh3Htpra3jofHRi/NafmLqSl4JpVtqMipZQ3XEjGfuq1X/DjxYdvzerm5WJyYafzQ+t6MXUjUEhk83qdBwqJ7MPKpwfdMqZvuqNoOePbYJo0PzQ1JtJX758OTY2tNdfrkVLK2yln+aYAADIl5+64vCsLte/3z/S7bR+1ihYbOP14Ts3NurCtsuxRsgeChgtJtxMLtNjaDJ0UHOWlkZlctJzxfdXVo6PCkXiDtUSNM5wQL20Ys6bjK/m4uwnsSoO1xLQUXF0amckBADwfPvvZje3VBmtJdWjfZcBNmzKF6pxNcs7fvvEoVWPttediVuMMYQ5PdM5u7utLm/1lK/kpkWRKYt2AnbeNdc58u1nuw/2DFaPxT0BLcK8kU+LYBsfT5A44S06zAAAAAElFTkSuQmCC";

class BlipParticle extends Particle {
    /**
     * Create a new blip particle
     * @param {*} ctx - 2d canvas context to draw particle onto
     * @param {*} x - starting x position of particle
     * @param {*} y - starting y position of particle
     * @param {*} group - Particle group used to determine sparking interactions
     * @param {*} dx - delta x in pixels per second, speed of particle
     * @param {*} dy - delta y in pixels per second, speed of particle
     * @param {*} lifetime - lifetime of particle, in seconds
     * @param {*} sparkRange - range in which to start spark effect in pixels
     */
    constructor(x, y, group, dx, dy, lifetime, sparkRange) {
        super(x, y);
        this.group = group;
        this.dx = dx;
        this.dy = dy;
        this.lifetime = lifetime;
        this.blipImg = blipImg;
        this.sparkMinImg = sparkMinImg;
        this.sparkMaxImg = sparkMaxImg;
        this.ttl = lifetime;
        this.fade = 1;
        this.sparkRange = sparkRange;
        if (this.group) {
            this.group.add(this);
        }
    }

    /**
     * determine the nearest range of other blips from group list to this blip
     * @returns float - distance to nearest blip on the same circuit
     */
    nearestRange() {
        let sqr = 1000;
        for (const other of (this.group || [])) {
            if (other === this) continue;
            let dx = other.x - this.x;
            let dy = other.y - this.y;
            let or = dx*dx + dy*dy;
            if (or < sqr) sqr = or;
        }
        return Math.sqrt(sqr);
    }

    draw(canvas_context) {
        let nr = this.nearestRange(this);
        let img = this.blipImg;
        if (nr <= this.sparkRange && nr >= this.sparkRange*.5) {
            img = this.sparkMinImg;
        } else if (nr < this.sparkRange *.5) {
            img = this.sparkMaxImg;
        }
        let x = this.x;
        let y = this.y;
        x -= Math.floor((img.width)*.5);
        y -= Math.floor((img.height)*.5);

        canvas_context.globalAlpha = this.fade;
        canvas_context.drawImage(img, x, y);

    }

    update(delta_time) {
        // convert delta time to seconds
        delta_time *= .001;
        if (this.done) return;
        // update position
        this.x += (this.dx * delta_time);
        this.y += (this.dy * delta_time);
        // fade... slowly fade, then pop back to full brightness at end
        this.fade -= (delta_time/this.lifetime) * 1.05;
        if (this.fade < 0) this.fade = 1;
        // time-to-live
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this._done = true;
        }
    }
}

class SwirlParticle extends Particle {
    /*=============================================================================*/
    /**
     * Create a swirl particle
     * @param {*} ctx
     * @param {*} x
     * @param {*} y
     * @param {*} hue - H of HSL for color
     * @param {*} speed - particle speed (in pixels per second)
     * @param {*} radius - radius of swirl (in pixels)
     * @param {*} width - base particle width
     * @param {*} emerge - emerge duration (either controlled via time or sentinel object)
     * @param {*} decay - emerge duration in seconds
     */
    constructor(x, y, hue, speed, radius, width, emerge, decay){
        super(x, y);
        this.speed = speed;
        this.radius = radius;
        this.width = width;
        if (typeof emerge === 'number') {
            this.emerge = emerge;
        } else {
            // handle emerge as sentinel... emerge/run until sentinel object is done
            this.sentinel = emerge;
        }
        this.ttl = decay;
		this.coordLast = [
			{x: x, y: y},
			{x: x, y: y},
			{x: x, y: y}
        ];
        // origin
        this.ox = x;
        this.oy = y;
        this.length = 0;
        this.angle = random_int(0, 360);
        let brightness = random_int(50,80);
        this.color = Color.fromHSL(hue, 100, brightness, random_float(.4,1));
        this.flickerColor = Color.fromHSL(hue, 100, brightness, random_float(.5,1));
        if (decay) this.alphadecay = this.color.a/decay;
        // counter-clockwise?
        this.ccw = (random_int(0, 1)) ? 1 : -1;
        this.flickerDensity = 20;
        this.collapsing = false;
	};

	update(delta_time) {
        // convert delta time to seconds
        delta_time *= .001;
        // distance from origin as percentage of radius
        let odp = this.length/this.radius;
        // radial speed (in/out of swirl) => applies to length
        let rspeed = (!this.collapsing) ? this.speed * (1-Math.pow(odp, 3)) : -this.speed * (1-Math.pow(1-odp,3));
        this.length += rspeed * delta_time;
        // orbital speed (around swirl) => applies to angle
        let ospeed = this.speed - rspeed;
		var radians = this.angle * Math.PI / 180;
		var vx = Math.cos(radians) * this.length;
        var vy = Math.sin(radians) * this.length;
		this.coordLast[2].x = this.coordLast[1].x;
		this.coordLast[2].y = this.coordLast[1].y;
		this.coordLast[1].x = this.coordLast[0].x;
		this.coordLast[1].y = this.coordLast[0].y;
		this.coordLast[0].x = this.x;
		this.coordLast[0].y = this.y;
		this.x = this.ox + vx;
        this.y = this.oy + vy;
        // orbital speed
        let dangle = (ospeed*delta_time / (2*Math.PI*this.radius)) * 360 * this.ccw;
		this.angle += dangle;
        // detect collapse
        if (!this.collapsing) {
            if (this.sentinel && this.sentinel.done) this.collapsing = true;
            if (this.emerge) {
                this.emerge -= delta_time;
                if (this.emerge <= 0) {
                    this.collapsing = true;
                }
            }
        } else {
            this.ttl -= delta_time;
            this.color.a -= Math.min(this.color.a, this.alphadecay * delta_time);
            if (this.ttl <= 0) {
                this._done = true;
            }
        }
	};

	draw(canvas_context){
        var coordRand = (random_int(1,3)-1);

		canvas_context.beginPath();
		canvas_context.moveTo(Math.round(this.coordLast[coordRand].x), Math.round(this.coordLast[coordRand].y));
		canvas_context.lineTo(Math.round(this.x), Math.round(this.y));
		canvas_context.closePath();
        canvas_context.strokeStyle = this.color.asHSL();
		canvas_context.stroke();
		if(this.flickerDensity > 0){
			var inverseDensity = 50 - this.flickerDensity;
			if(random_int(0, inverseDensity) === inverseDensity){
				canvas_context.beginPath();
				canvas_context.arc(Math.round(this.x), Math.round(this.y), random_int(this.width,this.width+3)/2, 0, Math.PI*2, false)
                canvas_context.closePath();
                this.flickerColor.a = random_float(.5,1);
                canvas_context.fillStyle = this.flickerColor.asHSL();
				canvas_context.fill();
			}
		}

    }
}

class SwirlPrefab {
    constructor(sys, ttl, x, y) {
        // params for particles
        let minHue = 130;
        let maxHue = 200;
        let minSpeed = 25;
        let maxSpeed = 200;
        let minRadius = 50;
        let maxRadius = 55;
        let minPttl = 1;
        let maxPttl = 3;
        let minWidth = 1;
        let maxWidth = 3;
        let pburst = 250;
        let pstreamInterval = .1;
        let pstreamVar = 25;
        let pstream = 5;
        // creates a sentinel object used to control prefab
        this.sentinel = new ParticleGroup(ttl);
        sys.add(this.sentinel);
        // creates an object used to control collapse of all particles at the same time
        let crush = new ParticleGroup(ttl*.65);
        sys.add(crush);
        // creates a burst of particles at beginning of animation
        sys.add( new ParticleEmitter(sys, x, y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(x, y, hue, speed, radius, width, crush, ttl*.25);
            }, 0, 0, 0.1, pburst));

        // creates a slow stream of particles through rest of animation
        sys.add( new ParticleEmitter(sys, x, y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let pttl = random_float(minPttl,maxPttl);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(x, y, hue, speed, radius, width, crush, pttl);
            }, pstreamInterval, pstreamVar, pstream, ttl*.25));
    }

    update() {
    }

    get done() {
        return this.sentinel.done;
    }
}

class RingParticle extends Particle {

    constructor(x, y, radius, hue, ttl, fadePct) {
        super(x, y);
        this.radius = radius;
        this.color = Color.fromHSL(hue, 100, random_int(50,80), 0);
        this.halfColor = this.color.copy();
        // convert to milliseconds
        // fade in
        let totalTTL = ttl * 1000;
        this.fadeInTTL = Math.min(totalTTL, totalTTL * fadePct/100);
        this.fadeInFactor = 1/this.fadeInTTL;
        // collapse
        this.collapseTTL = totalTTL - this.fadeInTTL;
        this.collapseFactor = radius/this.collapseTTL;
    }

    update(delta_time) {
        if (this.done) return;
        // fade in
        if (this.fadeInTTL) {
            this.fadeInTTL = Math.max(0, this.fadeInTTL - delta_time);
            this.color.a = Math.min(1, this.color.a + this.fadeInFactor*delta_time);
            this.halfColor.a = this.color.a * .5;
        // collapse
        } else if (this.collapseTTL) {
            this.collapseTTL = Math.max(0, this.collapseTTL - delta_time);
            this.radius = Math.max(1, this.radius - this.collapseFactor*delta_time);
        // done
        } else {
            this._done = true;
        }
    }

    draw(canvas_context) {

        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.color.asHSL();
        canvas_context.stroke();
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius+1, 0, Math.PI*2)
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius-1, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.halfColor.asHSL();
        canvas_context.stroke();

    }

}

class ShootUpParticle extends Particle {

    constructor(x, y, speed, width, hue, pathLen, ttl, shootPct) {
        super(x, y);
        this.speed = speed*.001;
        this.width = width;
        this.radius = 1;
        this.radiusStep = 1/((width * .5)-1);
        this.radiusMax = width * .5;
        let totalTTL = ttl * 1000;
        this.shootTTL = Math.min(totalTTL, totalTTL * shootPct/100);
        this.fadeTTL = (totalTTL - this.shootTTL) * .25;
        this.finalTTL = (totalTTL - this.shootTTL) * .75;
        let brightness = random_int(50, 80);
        this.headColor = Color.fromHSL(hue, 100, brightness, 1);
        this.tailColor = Color.fromHSL(hue, 100, brightness, .65);
        this.invisColor = Color.fromHSL(hue, 100, brightness, 0);
        this.brightBoost = 50;
        this.pathLen = pathLen;
        this.headAlphaStep = this.headColor.a/this.fadeTTL;
        this.tailAlphaStep = this.tailColor.a/this.finalTTL;
        this.endX = x;
        this.endY = y;
    }

    update(delta_time) {
        if (this.done) return;
        let dy = this.speed * delta_time;
        this.y -= dy;
        // keep track of path
        if (this.pathLen > 0) {
            this.pathLen--;
        } else {
            this.endY -= dy;
        }
        // lifetimes
        if (this.shootTTL) {
            if (this.radius != this.radiusMax) {
                this.radius = Math.min(this.radiusMax, this.radius + this.radiusStep);
            }
            this.shootTTL = Math.max(0, this.shootTTL - delta_time);
            //if (this.shootTTL == 0) console.log("shoot is done");
        } else if (this.fadeTTL) {
            this.fadeTTL = Math.max(0, this.fadeTTL - delta_time);
            this.headColor.a = Math.max(0, this.headColor.a - this.headAlphaStep*delta_time);
            if (this.fadeTTL == 0) this.speed *= .75;
        } else if (this.finalTTL) {
            this.finalTTL = Math.max(0, this.finalTTL - delta_time);
            if (this.finalTTL == 0) {
                this._done = true;
            }
            this.tailColor.a = Math.max(0, this.tailColor.a - this.tailAlphaStep*delta_time);
        }
    }

    getGradient(color, canvas_context) {
        let gradient = canvas_context.createLinearGradient(this.x, this.y, this.endX, this.endY);
        gradient.addColorStop(0, color.asHSL());
        gradient.addColorStop(1, this.invisColor.asHSL());
        return gradient;
    }

    draw(canvas_context) {

        // head of "comet"
        if (this.fadeTTL) {
            let headBrightness = this.brightness + this.brightBoost;
            if (this.brightBoost) this.brightBoost = Math.max(0,this.brightBoost - 20);
            canvas_context.beginPath();
            canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
            canvas_context.closePath();
            if (this.brightBoost) {
                let c = this.headColor.copy();
                c.l = Math.min(100,c.l + this.brightBoost);
                canvas_context.fillStyle = c.asHSL();
                this.brightBoost = Math.max(0,this.brightBoost - 10);
            } else {
                canvas_context.fillStyle = this.headColor.copy();
            }
            canvas_context.fill();
        }
        // tail
        canvas_context.beginPath();
        canvas_context.lineWidth = this.width;
        canvas_context.lineCap = 'round';
        canvas_context.moveTo(this.x, this.y);
        canvas_context.lineTo(this.endX, this.endY);
        canvas_context.strokeStyle = this.getGradient(this.tailColor, canvas_context);
        canvas_context.stroke();
        canvas_context.closePath();

    }
}

class FlashParticle extends Particle {

    constructor(x, y, width, hue, ttl) {
        super(x, y);
        this.width = width;
        this.hue = hue;
        this.ttl = ttl * 1000;
        this.maxTTL = this.ttl;
        this.armColor = Color.fromHSL(hue, 100, random_int(50,80), .1);
        this.centerColor = Color.fromHSL(hue, 100, random_int(90,100), .1);
        this.radius = width *.125;
        this.alphaStep = .9/(this.ttl/2);
        this.angle1 = Math.random() * Math.PI;
        this.angle2 = this.angle1 + (Math.PI * .5);
        this.rotateStep = random_float(-1,1) / this.ttl;
    }

    update(delta_time) {
        if (this.done) return;
        // fade in
        if (this.ttl > (this.maxTTL*.5)) {
            this.armColor.a = Math.min(1, this.armColor.a + this.alphaStep*delta_time);
            this.centerColor.a = Math.min(1, this.centerColor.a + this.alphaStep*delta_time);
        // fade out
        } else {
            this.armColor.a = Math.max(0, this.armColor.a - this.alphaStep*delta_time);
            this.centerColor.a = Math.max(0, this.centerColor.a - this.alphaStep*delta_time);
        }
        // rotation
        this.angle1 += this.rotateStep * delta_time;
        this.angle2 += this.rotateStep * delta_time;
        // lifetimes
        if (this.ttl) {
            this.ttl = Math.max(0, this.ttl - delta_time);
            if (this.ttl == 0) {
                this._done = true;
            }
        }
    }

    getGradient(canvas_context, sx, sy, ex, ey, color) {
        let gradient = canvas_context.createLinearGradient(sx, sy, ex, ey);
        gradient.addColorStop(0, color.asHSL(color.a*.25));
        gradient.addColorStop(.5, color.asHSL());
        gradient.addColorStop(1, color.asHSL(color.a*.25));
        return gradient;
    }

    draw(canvas_context) {

        // arms
        let sx1 = Math.cos(this.angle1) * this.width * .5;
        let sy1 = Math.sin(this.angle1) * this.width * .5;
        let ex1 = -sx1;
        let ey1 = -sy1;
        let sx2 = Math.cos(this.angle2) * this.width * .5;
        let sy2 = Math.sin(this.angle2) * this.width * .5;
        let ex2 = -sx2;
        let ey2 = -sy2;
        canvas_context.beginPath();
        canvas_context.moveTo(this.x+sx1, this.y+sy1);
        canvas_context.lineTo(this.x+ex1, this.y+ey1);
        canvas_context.lineWidth = 1.5;
        canvas_context.strokeStyle = this.getGradient(canvas_context, this.x+sx1, this.y+sy1, this.x+ex1, this.y+ey1, this.armColor);
        canvas_context.stroke();
        canvas_context.closePath();
        canvas_context.beginPath();
        canvas_context.moveTo(this.x+sx2, this.y+sy2);
        canvas_context.lineTo(this.x+ex2, this.y+ey2);
        canvas_context.lineWidth = 1.5;
        canvas_context.strokeStyle = this.getGradient(canvas_context, this.x+sx2, this.y+sy2, this.x+ex2, this.y+ey2, this.armColor);
        canvas_context.stroke();
        canvas_context.closePath();
        // center dot
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.fillStyle = this.centerColor.asHSL(this.centerColor.a*.5);
        canvas_context.fill();
        canvas_context.closePath();
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), Math.max(1,this.radius-2), 0, Math.PI*2)
        canvas_context.fillStyle = this.centerColor.asHSL();
        canvas_context.fill();
        canvas_context.closePath();


    }

}

class BlipEdgeParticle extends Particle {
    constructor(v1, v2, radius, speed, group, nextEdgeFcn) {
        super(v1.x, v1.y);
        this.v1 = v1
        this.v2 = v2
        this.radius = radius;
        this.width = radius * 10;
        this.speed = speed * .001;
        this.group = group;
        this.nextEdgeFcn = nextEdgeFcn;
        this.velocity = new Vector2({x:v2.x-v1.x, y: v2.y-v1.y})
        this.velocity.length = this.speed;
        let hue = 127;
        this.armColor = Color.fromHSL(hue, 100, random_int(50,80), 1);
        this.centerColor = Color.fromHSL(hue, 100, random_int(90,100), 1);
        this.angle1 = Math.random() * Math.PI;
        this.angle2 = this.angle1 + (Math.PI * .5);
        this.rotateStep = random_float(-2,2) * .001;
        this.sparkIntensity = 0;
        this.sparkRange = 10;
    }

    toString() {
        return "[Blip:" + this.x + "," + this.y + "]";
    }

    getGradient(canvas_context, sx, sy, ex, ey, color) {
        let gradient = canvas_context.createLinearGradient(sx, sy, ex, ey);
        gradient.addColorStop(0, color.asHSL(color.a*.1));
        gradient.addColorStop(.5, color.asHSL());
        gradient.addColorStop(1, color.asHSL(color.a*.2));
        return gradient;
    }

    /**
     * determine the nearest range of other blips on the circuit
     * @param {*} blip
     * @returns float - distance to nearest blip on the same circuit
     */
    nearestRange(group) {
        let sqr = 1000;
        for (const other of group) {
            if (other === this) continue;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const or = dx*dx + dy*dy;
            if (or < sqr) sqr = or;
        }
        return Math.sqrt(sqr);
    }

    update(delta_time) {
        if (this.done) return;
        let nr = (this.group) ? this.nearestRange(this.group) : 100;
        this.sparkIntensity = 0;
        if (nr < this.sparkRange) {
            this.sparkIntensity = (this.sparkRange-nr)/this.sparkRange;
        }
        // check distance to next vertex vs. distance to travel this tick
        let dtv2 = new Vector2({x:this.v2.x-this.x,y:this.v2.y-this.y}).length;
        let dtt = this.speed * delta_time;
        if (dtt >= dtv2) {
            // get next edge
            let nv2 = this.nextEdgeFcn(this.v2, this.v1);
            if (!nv2) {
                this._done = true;
                console.log("can't find edge for " + ofmt(this.v2) + "->" + ofmt(this.v1) + " nv2: " + nv2);
                return;
            }
            this.v1 = this.v2;
            this.v2 = nv2;
            // recompute velocity
            this.velocity = new Vector2({x:this.v2.x-this.v1.x, y: this.v2.y-this.v1.y})
            this.velocity.length = this.speed;
            let offset = new Vector2({x: this.velocity.x, y:this.velocity.y});
            offset.length = dtt-dtv2;
            // compute new x/y
            this.x = this.v1.x + offset.x;
            this.y = this.v1.y + offset.y;
        // otherwise, not close enough to endpoint - update position
        } else {
            this.x = this.x + this.velocity.x * delta_time;
            this.y = this.y + this.velocity.y * delta_time;
        }
        // rotation
        if (this.sparkIntensity) {
            this.angle1 += this.rotateStep * delta_time;
            this.angle2 += this.rotateStep * delta_time;
            this.armColor.a = this.sparkIntensity;
        }
    }

    draw(canvas_context) {
        // spark
        if (this.sparkIntensity) {
            const sx1 = Math.cos(this.angle1) * this.width * .5;
            const sy1 = Math.sin(this.angle1) * this.width * .5;
            const ex1 = -sx1;
            const ey1 = -sy1;
            const sx2 = Math.cos(this.angle2) * this.width * .5;
            const sy2 = Math.sin(this.angle2) * this.width * .5;
            const ex2 = -sx2;
            const ey2 = -sy2;
            canvas_context.beginPath();
            canvas_context.moveTo(this.x+sx1, this.y+sy1);
            canvas_context.lineTo(this.x+ex1, this.y+ey1);
            canvas_context.lineWidth = 1.5;
            canvas_context.strokeStyle = this.getGradient(canvas_context, this.x+sx1, this.y+sy1, this.x+ex1, this.y+ey1, this.armColor);
            canvas_context.stroke();
            canvas_context.closePath();
            canvas_context.beginPath();
            canvas_context.moveTo(this.x+sx2, this.y+sy2);
            canvas_context.lineTo(this.x+ex2, this.y+ey2);
            canvas_context.lineWidth = 1.5;
            canvas_context.strokeStyle = this.getGradient(canvas_context, this.x+sx2, this.y+sy2, this.x+ex2, this.y+ey2, this.armColor);
            canvas_context.stroke();
            canvas_context.closePath();
        }
        // center dot
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.fillStyle = this.centerColor.asHSL(this.centerColor.a*.5);
        canvas_context.fill();
        canvas_context.closePath();
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), Math.max(1,this.radius-2), 0, Math.PI*2)
        canvas_context.fillStyle = this.centerColor.asHSL();
        canvas_context.fill();
        canvas_context.closePath();
    }
}
