
export {
    Color,
    ParticleEmitter,
    ParticleGroup,
    ParticleSystem,
    FadeLineParticle,
    FadeParticle,
    BlipParticle,
}

import { camera } from "./graphics.js";
import { Rectangle } from "./spatial.js";

/**
 * class representing a color used in particles and consisting of red, blue, green, and alpha channels
 */
class Color {
    /**
     * Create a new color
     * @param {*} r
     * @param {*} g
     * @param {*} b
     * @param {*} a
     */
    constructor(r, g, b, a=1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * create a copy of the current color
     */
    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    /**
     * convert to string compatable w/ fillStyle/strokeStyle
     */
    toString() {
        return("rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")"); // TODO: cache this for optimization.
    }
}

/**
 * A particle system intended to keep track of all active particles and emitters
 */
class ParticleSystem {
    /**
     * Create a new particle system
     */
    constructor() {
        this.items = [];
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
     * Execute the main update thread for all emitters/particles
     */
    update(delta_time) {
        // iterate through tracked items
        for (let i=this.items.length-1; i>=0; i--) {
            // update each particle
            this.items[i].update(delta_time);
            // if any items are done, remove them
            if (this.items[i].done) {
                this.items.splice(i, 1);
            }
        }
    }

    draw() {
        // iterate through tracked items
        for (let i=this.items.length-1; i>=0; i--) {
            // draw each tracked particle (skip drawing for emitters)
            const item = this.items[i];
            if (item.draw && camera.can_see(new Rectangle({
                x: item.x, y: item.y,
                width: 64, height: 64 // TODO: find a better way to specify this size
            }))){
                item.draw();
            }
        }
    }

}

/**
 * class representing a grouping of particles
 */
class ParticleGroup {
    /**
     * Create a new particle system
     */
    constructor() {
        this.items = [];
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
     * Execute the main update thread for all emitters/particles
     */
    update(delta_time) {
        // iterate through tracked items
        for (let i=this.items.length-1; i>=0; i--) {
            // if any items are done, remove them
            if (this.items[i].done) {
                this.items.splice(i, 1);
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
    constructor(psys, genFcn, interval, jitter=0, lifetime=0) {
        this.psys = psys;
        this.genFcn = genFcn;
        this.interval = interval;
        this.jitter = jitter/100;
        this.lifetime = lifetime;
        this.currentTick = 0;
        this._done = false;
        // compute next time to emit
        this.tte = 0;
        this.nextTTE();
        // keep track of particles emitter has generated
        this.particles = [];
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
     * Update the particle emitter.  This is where new particles get generated based on the emitter schedule.
     */
    update(delta_time) {
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
            let p = this.genFcn();
            this.psys.add(p);
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
    constructor(ctx, x, y) {
        this.ctx = ctx;
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
    constructor(ctx, x, y, dx, dy, color, lifetime, length, width, minOpacity, maxOpacity) {
        super(ctx, x, y);
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

    getGradient() {
        let gradient = this.ctx.createLinearGradient(this.x, this.y, this.endX, this.endY);
        gradient.addColorStop(0, this.getColor(this.x, this.y, .1).toString());
        gradient.addColorStop(.5, this.getColor(this.midX, this.midY, 1).toString());
        gradient.addColorStop(1, this.getColor(this.endX, this.endY, .1).toString());
        return gradient;
    }

    draw() {
        this.ctx.save();
        this.ctx.strokeStyle = this.getGradient();
        this.ctx.lineWidth = this.width;
        this.ctx.lineCap = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.endX, this.endY);
        this.ctx.stroke();
        this.ctx.restore();
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
    constructor(ctx, x, y, dx, dy, size, color, lifetime) {
        super(ctx, x, y);
        this.dx = dx;
        this.dy = dy;
        this.size = size;
        this.color = color;
        this.lifetime = lifetime;
        this.fade = 1;
        this.ttl = lifetime;
    }

    draw() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color.toString();
        this.ctx.fill();
        this.ctx.restore();
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
    constructor(ctx, x, y, group, dx, dy, lifetime, sparkRange) {
        super(ctx, x, y);
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

    draw() {
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
        this.ctx.save();
        this.ctx.globalAlpha = this.fade;
        this.ctx.drawImage(img, x, y);
        this.ctx.restore();
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