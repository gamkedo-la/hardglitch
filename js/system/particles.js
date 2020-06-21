export {
    Color,
    ParticleEmitter,
    ParticleSystem,
    FadeLineParticle,
    FadeParticle,
}

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
    update() {
        // iterate through tracked items
        for (let i=this.items.length-1; i>=0; i--) {
            // update each particle
            this.items[i].update();
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
     * @param {*} genFcn
     * @param {*} ticks
     */
    constructor(psys, genFcn, ticks) {
        this.psys = psys;
        this.genFcn = genFcn;
        this.ticks = ticks;
        this.currentTick = 0;
        this._done = false;
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
    update() {
        this.currentTick++;
        if (this.currentTick >= this.ticks) {
            this.currentTick = 0;
            let p = this.genFcn();
            this.psys.add(p);
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
    constructor(ctx, x, y, dx, dy, color, ticks, length, width, minOpacity, maxOpacity) {
        super(ctx, x, y);
        this.dx = dx;
        this.dy = dy;
        // base color
        this.color = color;
        this.ticks = ticks;
        this.maxlen = length;
        this.width = width;
        // min opacity is the opacity of the line at the beginning and end of particle loop
        this.minOpacity = minOpacity;
        // max opacity is the opacity of the line at the midpoint of animation
        this.maxOpacity = maxOpacity;
        this.len = 0;
        this.emergeticks = 0;
        // compute x/y percents of total length
        this.ticklen = Math.sqrt(dx*dx + dy*dy);
        this.px = dx/this.ticklen;
        this.py = dy/this.ticklen;
        // compute center of animation
        this.centerx = this.x + dx*ticks*.5 + this.px*length*.5;
        this.centery = this.y + dy*ticks*.5 + this.py*length*.5;
        this.centerlen = this.ticklen*ticks*.5 + length*.5;
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
        this.ctx.strokeStyle = this.getGradient();
        this.ctx.lineWidth = this.width;
        this.ctx.lineCap = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.endX, this.endY);
        this.ctx.stroke();
    }

    update() {
        if (this.done) return;
        // stage 1: emerge
        // - starting w/ line at x,y and zero length, run until length is maxlen
        if (this.len < this.maxlen) {
            this.len += this.ticklen;
            this.emergeticks++;
            if (this.len > this.maxlen) {
                let delta = this.len - this.maxlen;
                this.len = this.maxlen;
                this.x += delta * this.px;
                this.y += delta * this.py;
            }
        // stage 2: traverse
        // - run until ticks have expired
        } else if (this.ticks > 0) {
            this.x += this.dx;
            this.y += this.dy;
            this.ticks--;
        // stage 3: dissolve
        // - run until we run down emerge ticks
        } else if (this.emergeticks > 0) {
            this.x += this.dx;
            this.y += this.dy;
            this.emergeticks--;
        // stage 4: done
        } else {
            this._done = true;
        }
        // draw
        this.draw();
    }

}

/**
 * A particle for a circle that starts at a given position then slowly fades out
 */
class FadeParticle extends Particle {
    constructor(ctx, x, y, dirX, dirY, size, color, ticks) {
        super(ctx, x, y);
        this.dirX = dirX;
        this.dirY = dirY;
        this.size = size;
        this.color = color;
        this.ticks = ticks;
        this.fadePerTick = 1/ticks;
        this.fade = 1;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color.toString();
        this.ctx.fill();
    }

    update() {
        if (this.done) return;
        // update position
        this.x += this.dirX;
        this.y += this.dirY;
        // fade
        this.fade -= this.fadePerTick;
        this.color.a = this.fade;
        if (this.fade <= 0) {
            this._done = true;
        }
        // draw
        this.draw();
    }

}

function pickRange(min, max) {
    return Math.random() * (max-min) + min;
}