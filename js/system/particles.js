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
    RingParticle,
    GrowthRingParticle,
    ShootUpParticle,
    FlashParticle,
    BlipEdgeParticle,
    ThrobParticle,
    LightningParticle,
    ColorOffsetGlitchParticle,
    BandingGlitchParticle,
    DirectionalRingParticle,
    WaitParticle,
    ActionParticle,
    TraceParticle,
    TraceArcParticle,
    ComboLockParticle,
    ScanLineParticle,
    CollapseOrbParticle,
}

import * as debug from "../system/debug.js";
import { camera, create_canvas_context } from "./graphics.js";
import { random_int, random_float, ofmt } from "./utility.js";
import { Color } from "./color.js";
import { Vector2 } from "./spatial.js";
import { linearFadeInOut } from "../view/xforms.js";
import { ColorShiftDataXForm, HorizontalBandingDataXForm, ColorSwapDataXForm, ClearOutsideWindowDataXForm } from "../view/img_data_fx.js";
import { PIXELS_PER_TILES_SIDE } from "../view/entity-view.js";


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
                debug.log("objs: " + this.items.length + " inactive: " + inactive);
            }
        }
    }

    draw(canvas_context, position_predicate = ()=>true) {
        // make sure they don't impact the rest of the drawing code
        canvas_context.save();
        // iterate through tracked items
        this.items.filter(item => item.draw
                                    && position_predicate(item)
                                    && this.isActive(item)) // (skip drawing for emitters)
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
    set done(value) {
        this._done = (value) ? true : false;
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
    set done(value) {
        this._done = (value) ? true : false;
    }

    /**
     * run generator to emit particle
     */
    emit() {
        for (let i=0; i<this.count; i++) {
            let p = this.genFcn(this);
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
    set done(value) {
        this._done = (value) ? true : false;
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
    set done(value) {
        this._done = (value) ? true : false;
    }

}

/**
 * A particle for a line that fades in/out
 */
class FadeLineParticle extends Particle {
    /**
     * Create a new fade line particle.
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
        this.fade = color.a;
        this.fadeRate = this.fade/this.lifetime;
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
        this.fade -= (delta_time * this.fadeRate);
        this.color.a = this.fade;
        // time-to-live
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this._done = true;
        }
    }

}

// =============================================================================
class CanvasGlitchParticle extends Particle {
    constructor(x, y, width, height, xforms, srcCtx, xformTTL=0, glitchCanvasContext) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.srcCtx = srcCtx;
        this.xforms = xforms || [];
        this.needData = true;
        this.needXform = true;
        this.elapsed = 0;
        this.dataElapsed = 0;
        this.xformTTL = xformTTL * 1000;
        this.dx = 0;
        this.dy = 0;
        this.glitchCanvasContext = glitchCanvasContext != null ? glitchCanvasContext : create_canvas_context(this.width * 2, this.height * 2);
        this.smaller_context = create_canvas_context(this.width, this.height);
        this.dataInterval = 1000;
    }

    update(delta_time) {
        if (this.done) return;
        // determine
        this.elapsed += delta_time;
        this.dataElapsed += delta_time;
        if (this.elapsed > this.xformTTL) {
            if (this.dataElapsed >= this.dataInterval) {
                this.dataElapsed = 0;
                this.needData = true;
            }
            this.needXform = true;
            this.elapsed = 0;
        }
        // perform data transformations
        if (this.needXform && this.sdata) {
            // create copy of source data
            let data = Uint8ClampedArray.from(this.sdata.data);
            this.xdata = new ImageData(data, this.sdata.width);
            this.needXform = false;
            for (const xform of this.xforms) {
                xform.do(this.xdata);
            }
        }
    }

    draw(canvas_context) {
        // pull image data (if needed)
        if (this.needData) {
            const srcCtx = (this.srcCtx) ? this.srcCtx : canvas_context;
            this.smaller_context.drawImage(srcCtx.canvas,
                this.x - camera.position.x, this.y - camera.position.y, this.smaller_context.canvas.width, this.smaller_context.canvas.height,
                0, 0, this.smaller_context.canvas.width, this.smaller_context.canvas.height,
                );
            this.sdata = this.smaller_context.getImageData(0, 0, this.smaller_context.canvas.width, this.smaller_context.canvas.height);
            this.needData = false;
            const background_alpha = ((Math.sin(performance.now() / 100) + 1) / 2) * 0.2;
            this.background_color = new Color(20,20,20, background_alpha).toString();
        }
        if (this.midDraw) this.midDraw(canvas_context);
        // output image data
        if (this.xdata) {
            let xoffset = this.width*.5;
            let yoffset = this.height*.5;
            let gctx = this.glitchCanvasContext;
            gctx.putImageData(this.xdata, xoffset, yoffset);

            canvas_context.save();
            // For clarity, add a randomly colored faint background color before adding the effect drawing.
            const square_x = Math.floor(this.x / PIXELS_PER_TILES_SIDE) * PIXELS_PER_TILES_SIDE;
            const square_y = Math.floor(this.y / PIXELS_PER_TILES_SIDE) * PIXELS_PER_TILES_SIDE;
            canvas_context.fillStyle = this.background_color;
            canvas_context.fillRect(square_x, square_y, PIXELS_PER_TILES_SIDE, PIXELS_PER_TILES_SIDE);

            canvas_context.drawImage(gctx.canvas, this.x-xoffset+this.dx, this.y-yoffset+this.dy);
            canvas_context.restore();
        }
    }

}

class OffsetGlitchParticle extends CanvasGlitchParticle {
    constructor(x, y, width, height, dx, dy, ttl, fillColor="black", srcCtx, glitchCanvasContext) {
        let adx = Math.abs(dx);
        let ady = Math.abs(dy);
        super(x-adx, y-ady, width+adx*2, height+ady*2, [], srcCtx, ttl, glitchCanvasContext);
        this.dx = dx;
        this.dy = dy;
        this.ttl = ttl;
        this.fillColor = fillColor;
    }

    midDraw(canvas_context) {
        if (this.fillColor) {
            canvas_context.fillStyle = this.fillColor.toString();
            canvas_context.fillRect(this.x, this.y, this.width, this.height);
        }
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
        super.update(delta_time);
    }

}

class ColorOffsetGlitchParticle extends CanvasGlitchParticle {
    constructor(x, y, dx, dy, width, height, rshift, gshift, bshift, bandingAffinity, scanCycle, xformCycle, srcCtx, eolPredicate = () => false ) {
        let adx = Math.abs(dx);
        let ady = Math.abs(dy);
        let ixforms = [];
        ixforms.push(new ClearOutsideWindowDataXForm(adx, ady, width+adx, height+ady));
        // blue is shifted vertically (if dy and bshift is given)
        let blueShift = new ColorShiftDataXForm(0, dy, adx, ady, width+adx, height+ady, 0, 0, bshift);
        if (bshift && dy) ixforms.push(blueShift);
        // green is shifted horizontally (if dx and gshift is given)
        let greenShift = new ColorShiftDataXForm(dx, 0, adx, ady, width+adx, height+ady, 0, gshift, 0);
        if (gshift && dx) ixforms.push(greenShift);
        // red is shifted horizontally (if dx and gshift is given)
        let redShift = new ColorShiftDataXForm(-dx, 0, adx, ady, width+adx, height+ady, rshift, 0, 0);
        if (rshift && dx) ixforms.push(redShift);
        let banding = new HorizontalBandingDataXForm(dx, bandingAffinity, adx, 0, width+adx, height)
        ixforms.push(banding);
        let syncOffset = 0;
        let syncLineWidth = 2;
        let syncLine1 = new ColorSwapDataXForm(adx, ady+syncOffset, width+adx, ady+syncOffset+syncLineWidth, 55, 55, 55);
        let syncLine2 = new ColorSwapDataXForm(adx, ady+syncOffset+1, width+adx, ady+syncOffset+syncLineWidth+1, 55, 0, 0);
        ixforms.push(syncLine1);
        ixforms.push(syncLine2);
        super(x-adx, y-ady, width+adx*2, height+ady*2, ixforms, srcCtx, xformCycle);
        self = this;
        this.xform = linearFadeInOut(0, height-syncLineWidth, scanCycle, true, (v) => {
                syncLine1.miny = v;
                syncLine1.maxy = v+syncLineWidth;
                syncLine2.miny = v+1;
                syncLine2.maxy = v+syncLineWidth+1;
            });
        this.eolPredicate = eolPredicate;
    }

    update(delta_time) {
        if (this.eolPredicate()) {
            this.done = true;
        }
        super.update(delta_time);
        if (this.xform) {
            let state = this.xform.next(delta_time);
            if (state.done) {
                this.xform = undefined;
            }
        }
    }
}

class BandingGlitchParticle extends CanvasGlitchParticle {
    constructor(x, y, maxOffset, affinity, width, height, srcCtx) {
        let xform = new HorizontalBandingDataXForm(maxOffset, affinity, maxOffset, 0, width+maxOffset, height);
        super(x-maxOffset, y, width+maxOffset*2, height, [xform], srcCtx);
    }
}

// =============================================================================
class ColorGlitchParticle extends CanvasGlitchParticle {
    constructor(x, y, width, height, roff, goff, boff, ttl, srcCtx) {
        let swapXf = new ColorSwapDataXForm(0, 0, width, height, roff, goff, boff);
        super(x, y, width, height, [swapXf], srcCtx, ttl);
        this.width = width;
        this.height = height;
        this.ttl = ttl;
        this.srcCtx = srcCtx;
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
        super.update(delta_time);
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
     * @param {*} x
     * @param {*} y
     * @param {*} color - color
     * @param {*} speed - particle speed (in pixels per second)
     * @param {*} radius - radius of swirl (in pixels)
     * @param {*} width - base particle width
     * @param {*} emerge - emerge duration (either controlled via time or sentinel object)
     * @param {*} decay - emerge duration in seconds
     */
    constructor(x, y, color, speed, radius, width, emerge, decay){
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
        this.color = color;
        this.flickerColor = color;
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
        canvas_context.lineWidth = 1;
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
        this.lineWidth = 1;
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
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.color.asHSL();
        canvas_context.stroke();
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius+1, 0, Math.PI*2)
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius-1, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.halfColor.asHSL();
        canvas_context.stroke();
    }

}

class GrowthRingParticle extends Particle {

    constructor(x, y, radius, hue, ttl, fadePct) {
        super(x, y);
        this.radius = 1;
        this.color = Color.fromHSL(hue, 100, random_int(50,80), 0);
        this.halfColor = this.color.copy();
        // convert to milliseconds
        // fade in
        let totalTTL = ttl * 1000;
        this.fadeInTTL = Math.min(totalTTL, totalTTL * fadePct/100);
        this.fadeInFactor = 1/this.fadeInTTL;
        // growth
        this.growthTTL = totalTTL - this.fadeInTTL;
        this.growthFactor = radius/this.growthTTL;
        this.lineWidth = 1;
    }

    update(delta_time) {
        if (this.done) return;
        // fade in
        if (this.fadeInTTL) {
            this.fadeInTTL = Math.max(0, this.fadeInTTL - delta_time);
            this.color.a = Math.min(1, this.color.a + this.fadeInFactor*delta_time);
            this.halfColor.a = this.color.a * .5;
        // growth
        } else if (this.growthTTL) {
            this.growthTTL = Math.max(0, this.growthTTL - delta_time);
            this.radius = Math.max(1, this.radius + this.growthFactor*delta_time);
        // done
        } else {
            this._done = true;
        }
    }

    draw(canvas_context) {
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.color.asHSL();
        canvas_context.stroke();
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius+1, 0, Math.PI*2)
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius-1, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.halfColor.asHSL();
        canvas_context.stroke();
    }

}

class DirectionalRingParticle extends Particle {

    constructor(x, y, dx, dy, radius, color, ttl) {
        super(x, y);
        this.radius = radius;
        this.dx = dx * .001;
        this.dy = dy * .001;
        this.color = color;
        this.halfColor = this.color.copy();
        this.halfColor.a *= .5;
        this.ttl = ttl * 1000;
        this.lineWidth = 1;
    }

    update(delta_time) {
        if (this.done) return;
        // move
        this.x += this.dx*delta_time;
        this.y += this.dy*delta_time;
        // lifetime
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) this.done = true;
        // done
        } else {
            this._done = true;
        }
    }

    draw(canvas_context) {
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        canvas_context.closePath();
        canvas_context.strokeStyle = this.color.asHSL();
        canvas_context.stroke();
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
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

    constructor(x, y, width, hue, ttl, rotateSpeed=1) {
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
        this.rotateStep = random_float(-rotateSpeed,rotateSpeed) / this.ttl;
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
        this.armColor = Color.fromHSL(hue, 100, random_int(50,80), .5);
        this.centerColor = Color.fromHSL(hue, 100, random_int(90,100), .5);
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
                debug.log("can't find edge for " + ofmt(this.v2) + "->" + ofmt(this.v1) + " nv2: " + nv2);
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

class ThrobParticle extends Particle {
    constructor(origin, target, radius, speed, throbSpeed, color) {
        super(origin.x, origin.y);
        this.origin = origin
        this.target = target
        this.radius = radius;
        this.speed = speed * .001;
        this.velocity = new Vector2({x:target.x-origin.x, y: target.y-origin.y});
        this.velocity.length = this.speed;
        //let hue = random_int(80,150);
        //this.color = Color.fromHSL(hue, 100, random_int(50,80), 1);
        this.color = color;
        this.throb = .25;
        this.throbMin = .25;
        this.throbMax = 1.25;
        this.throbIn = false;
        this.throbSpeed = throbSpeed * .001;
    }

    update(delta_time) {
        if (this.done) return;
        // check distance to target
        let dtt = new Vector2({x:this.target.x-this.x,y:this.target.y-this.y}).length;
        let sdt = this.speed * delta_time;
        if (sdt >= dtt) {
            this.x = this.target.x;
            this.y = this.target.y;
            this._done = true;
        // otherwise, not close enough to endpoint - update position
        } else {
            this.x = this.x + this.velocity.x * delta_time;
            this.y = this.y + this.velocity.y * delta_time;
        }
        // throb
        if (this.throbIn) {
            this.throb -= this.throbSpeed * delta_time;
            if (this.throb <= this.throbMin) {
                this.throb = this.throbMin;
                this.throbIn = false;
            }
        } else {
            this.throb += this.throbSpeed * delta_time;
            if (this.throb >= this.throbMax) {
                this.throb = this.throbMax;
                this.throbIn = true;
            }
        }
    }

    draw(canvas_context) {
        // center dot
        let radius = this.radius * this.throb;
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), radius, 0, Math.PI*2)
        canvas_context.fillStyle = this.color.asHSL(this.color.a*.5);
        canvas_context.fill();
        canvas_context.closePath();
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), Math.max(1,radius-2), 0, Math.PI*2)
        canvas_context.fillStyle = this.color.asHSL();
        canvas_context.fill();
        canvas_context.closePath();
    }

}

class LightningParticle extends Particle {
    constructor(origin, target, segments, width, color, endWidth, variance, ttl, emergePct, flash=0, floaters=0, floaterPct=0) {
        super(origin.x, origin.y);
        this.origin = origin;
        this.target = target;
        this.segments = segments;
        this.width = width;
        this.color = color;
        this.endWidth = endWidth;
        this.segmentRate = this.segments / (ttl * emergePct * 1000);
        this.ttl = ttl * 1000;
        this.maxTTL = ttl;
        this.direction = new Vector2({x:target.x-origin.x, y: target.y-origin.y});
        this.distance = this.direction.length;
        this.path = [origin];
        let segmentLength = this.distance / segments;
        this.direction.length = segmentLength;
        this.lwidth = (this.distance / segments) * variance;
        this.flash = flash;
        this.alphaTarget = 0;
        this.alphaMax = color.a;
        this.fadeRate = (this.alphaMax - this.alphaTarget)*(flash+1)/(this.ttl * (1-emergePct));
        this.subparticles = [];
        this.floaters = floaters;
        this.floaterPct = floaterPct;
        this.floaterColor = this.color.copy();
        this.floaterColor.a *= .5;
    }

    get done() {
        if (!this._done) return false;
        let subdone = true;
        for (let i=0; i<this.subparticles.length; i++) {
            subdone &= this.subparticles[i].done;
        }
        return subdone;
    }
    set done(value) {
        this._done = (value) ? true : false;
    }

    update(delta_time) {
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].update(delta_time);
        }
        if (this.done) return;
        // build path
        if (this.path.length < this.segments) {
            let rate = Math.round(this.segmentRate * delta_time + .5);
            for (let i=0; i<rate; i++) {
                if (this.path.length >= this.segments) break;
                let lastp = this.path[this.path.length-1];
                let x = lastp.x + this.direction.x;
                let y = lastp.y + this.direction.y;
                let xvar = (Math.random() * this.lwidth) - (this.lwidth / 2);
                let yvar = (Math.random() * this.lwidth) - (this.lwidth / 2);
                if (this.path.length < this.segments-1) {
                    x += xvar;
                    y += yvar;
                    // reorient
                    this.direction = new Vector2({x:this.target.x-x, y: this.target.y-y});
                    this.direction.length = this.direction.length / (this.segments - this.path.length);
                } else {
                    x = this.target.x;
                    y = this.target.y;
                }
                let p = {x:x, y:y};
                if (this.floaters && Math.random() < this.floaterPct) {
                    for (let i=0; i<this.floaters; i++) {
                        let ppx = x;
                        let ppy = y;
                        let vtolx = x-lastp.x;
                        let vtoly = y-lastp.y;
                        let pct = Math.random();
                        ppx += pct * vtolx;
                        ppy += pct * vtoly;
                        let dx = random_float(0, xvar);
                        let dy = random_float(0, yvar);
                        let ttl = random_float(this.maxTTL*.75,this.maxTTL*1.5);
                        let fp = new FadeParticle(ppx, ppy, dx, dy, this.width, this.floaterColor, ttl);
                        this.subparticles.push(fp);
                    }
                }
                this.path.push(p);
            }
        // otherwise, flash/fade
        } else {
            if (this.flash && this.color.a === this.alphaTarget) {
                this.color.a = this.alphaMax;
            } else {
                this.color.a = Math.max(0, this.color.a - this.fadeRate * delta_time);
            }
        }
        this.ttl -= delta_time;
        if (this.ttl <= 0) {
            this.done = true;
        }
    }

    draw(canvas_context) {
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].draw(canvas_context);
        }
        // draw lightning path
        canvas_context.beginPath();
        canvas_context.moveTo(this.path[0].x, this.path[0].y);
        for (let i=1; i<this.path.length; i++) {
            let p = this.path[i];
            canvas_context.lineTo(p.x, p.y);
        }
        canvas_context.strokeStyle = this.color.asRGB();
        canvas_context.lineCap = "round";
		canvas_context.lineWidth = this.width;
        canvas_context.stroke();
    }

}

class WaitParticle extends Particle {
    constructor(x, y, radius, ringColor, bgColor, ttl) {
        super(x, y);
        this.radius = radius;
        this.ringColor = ringColor;
        this.bgColor = bgColor;
        this.ttl = ttl * 1000;
        this.angle = -.5*Math.PI;
        this.angleDelta = Math.PI*2/this.ttl;
        this.lineWidth = 2;
    }

    update(delta_time) {
        if (this.done) return;
        // update angle
        this.angle += this.angleDelta * delta_time;
        // update ttl
        this.ttl -= delta_time;
        if (this.ttl <= 0) this.done = true;
    }

    draw(canvas_context) {
        let radius = this.radius;
        canvas_context.beginPath();
        canvas_context.moveTo(Math.round(this.x), Math.round(this.y));
        canvas_context.arc(Math.round(this.x), Math.round(this.y), radius, this.angle, Math.PI*1.5)
        canvas_context.fillStyle = this.bgColor.toString();
        canvas_context.fill();
        canvas_context.closePath();
        canvas_context.beginPath();
        canvas_context.arc(Math.round(this.x), Math.round(this.y), radius, this.angle, Math.PI*1.5)
        canvas_context.strokeStyle = this.ringColor.toString();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.stroke();
        canvas_context.closePath();
    }

}

// rotate speed is rotations per second
class ActionParticle extends Particle {
    constructor(x, y, offset, size, color, rotateSpeed, ttl, lineWidth=2, ccw=false) {
        super(x, y);
        this.size = size;
        this.color = color;
        this.ttl = ttl * 1000;
        this.angle = 0;
        this.angleDelta = Math.PI * 2 * rotateSpeed * .001;
        this.lineWidth = lineWidth;
        this.ccw = ccw;
        let path = new Path2D();
        let halfSize = Math.round(size * .5);
        path.moveTo(offset-halfSize, -halfSize);
        path.lineTo(halfSize-offset, -halfSize);
        path.lineTo(halfSize, offset-halfSize);
        path.lineTo(halfSize, halfSize-offset);
        path.lineTo(halfSize-offset, halfSize);
        path.lineTo(offset-halfSize, halfSize);
        path.lineTo(-halfSize, halfSize-offset);
        path.lineTo(-halfSize, offset-halfSize);
        path.closePath();
        this.path = path;
    }

    update(delta_time) {
        if (this.done) return;
        // update angle
        this.angle += this.angleDelta * delta_time;
        this.angle = this.angle % (Math.PI * 2);
        // update ttl
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) this.done = true;
        }
    }

    draw(canvas_context) {
        canvas_context.save();
        canvas_context.translate(this.x, this.y);
        canvas_context.rotate((this.ccw) ? -this.angle : this.angle);
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lineWidth;
        canvas_context.strokeStyle = this.color.toString();
        canvas_context.stroke(this.path);
        canvas_context.restore();
    }

}

class TraceParticle extends Particle {
    constructor(spec) {
        // parse spec/assign defaults
        let x = spec.x || 0;
        let y = spec.y || 0;
        let path = spec.path || [];
        let outlineColor = spec.outlineColor || new Color(100,100,0);
        let tracedOutlineColor = spec.tracedOutlineColor || new Color(100,0,100);
        let traceColor = spec.traceColor || new Color(200,200,0);
        let outlineWidth = spec.outlineWidth || 1;
        let ttl = spec.ttl || 1;
        let origin = spec.origin || {x: x, y:y};
        let flashWidth = spec.flashWidth || 30;
        let flashHue = spec.flashHue || 200;
        let flashRotate = spec.flashRotate || 15;
        let scale = spec.scale || 1;
        // super
        super(x, y);
        // local vars
        // setup outline
        // - outlineVerts
        // - outlineLen
        // - outline
        this.setupOutline(path, x, y, scale);
        this.outlineColor = outlineColor;
        this.tracedOutlineColor = tracedOutlineColor;
        this.outlineWidth = outlineWidth;
        this.ttl = ttl * 1000;
        // setup trace
        this.trace = {
            x: this.outlineVerts[0].x,
            y: this.outlineVerts[0].y,
            origin: origin,
            traceColor: traceColor,
            speed: this.outlineLen/this.ttl,
            v1: this.outlineVerts[0],
            v2: this.outlineVerts[1],
            index: 1,
        }
        this.trace.velocity = new Vector2({x:this.trace.v2.x-this.trace.v1.x, y: this.trace.v2.y-this.trace.v1.y});
        this.trace.velocity.length = this.trace.speed;
        this.setupTracedOutline();
        this.flashP = new FlashParticle(this.trace.x, this.trace.y, flashWidth, flashHue, ttl, flashRotate);

    }

    setupOutline(verts, x, y, scale) {
        this.outlineVerts = new Array(verts.length);
        this.outlineLen = 0;
        this.outline = new Path2D();
        for (let i=0; i<verts.length; i++) {
            let dv = {x: verts[i].x*scale+x, y: verts[i].y*scale+y};
            if (i===0) {
                this.outline.moveTo(dv.x, dv.y);
            } else {
                this.outline.lineTo(dv.x, dv.y);
                let dx = dv.x - this.outlineVerts[i-1].x;
                let dy = dv.y - this.outlineVerts[i-1].y;
                this.outlineLen += Math.sqrt(dx*dx+dy*dy);
            }
            this.outlineVerts[i] = dv;
        }
        this.outline.closePath();
    }

    setupTracedOutline() {
        this.tracedOutline = new Path2D();
        for (let i=0; i<this.trace.index; i++) {
            let dv = this.outlineVerts[i];
            if (i===0) {
                this.tracedOutline.moveTo(dv.x, dv.y);
            } else {
                this.tracedOutline.lineTo(dv.x, dv.y);
            }
        }
    }

    update(delta_time) {
        if (this.done) return;
        // update trace...
        // - check distance to next vertex vs. distance to travel this tick
        let dtv2 = new Vector2({x:this.trace.v2.x-this.trace.x,y:this.trace.v2.y-this.trace.y}).length;
        let dtt = this.trace.speed * delta_time;
        if (dtt >= dtv2) {
            // advance to next target vertex
            if (this.trace.index < this.outlineVerts.length-1) {
                this.trace.index++;
                this.trace.v1 = this.trace.v2;
                this.trace.v2 = this.outlineVerts[this.trace.index];
                // recompute velocity
                this.trace.velocity = new Vector2({x:this.trace.v2.x-this.trace.v1.x, y: this.trace.v2.y-this.trace.v1.y});
                this.trace.velocity.length = this.trace.speed;
                let offset = new Vector2({x: this.trace.velocity.x, y:this.trace.velocity.y});
                offset.length = dtt-dtv2;
                // compute new x/y
                this.trace.x = this.trace.v1.x + offset.x;
                this.trace.y = this.trace.v1.y + offset.y;
            } else {
                this.trace.x = this.trace.v2.x;
                this.trace.y = this.trace.v2.y;
            }
            this.setupTracedOutline();
        // - otherwise, not close enough to endpoint - update position
        } else {
            this.trace.x = this.trace.x + this.trace.velocity.x * delta_time;
            this.trace.y = this.trace.y + this.trace.velocity.y * delta_time;
        }
        // update flash particle
        this.flashP.x = this.trace.x;
        this.flashP.y = this.trace.y;
        this.flashP.update(delta_time);
        // update ttl
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) {
                this.done = true;
            }
        }
    }

    draw(canvas_context) {
        this.flashP.draw(canvas_context);
        // draw outline
        canvas_context.lineWidth = this.outlineWidth;
        canvas_context.strokeStyle = this.outlineColor;
        canvas_context.stroke(this.outline);
        // draw traced outline
        canvas_context.strokeStyle = this.tracedOutlineColor;
        canvas_context.stroke(this.tracedOutline);
        let v = this.outlineVerts[this.trace.index-1];
        canvas_context.moveTo(v.x, v.y);
        canvas_context.lineTo(this.trace.x, this.trace.y);
        canvas_context.stroke();
        // draw trace
        canvas_context.fillStyle = this.trace.traceColor;
        canvas_context.fillRect(this.trace.x-1,this.trace.y-1, 3, 3);
        canvas_context.beginPath();
        canvas_context.moveTo(this.trace.origin.x, this.trace.origin.y);
        canvas_context.lineTo(this.trace.x, this.trace.y);
        canvas_context.closePath();
        canvas_context.strokeStyle = this.trace.traceColor;
        canvas_context.stroke();
    }

}

class TraceArcParticle extends Particle {
    constructor(spec) {
        // parse spec/assign defaults
        let x = spec.x || 0;
        let y = spec.y || 0;
        let outlineColor = spec.outlineColor || new Color(100,100,0);
        let tracedOutlineColor = spec.tracedOutlineColor || new Color(100,0,100);
        let traceColor = spec.traceColor || new Color(200,200,0);
        let outlineWidth = spec.outlineWidth || 1;
        let ttl = spec.ttl || 1;
        let origin = spec.origin || {x: x, y:y};
        let flashWidth = spec.flashWidth || 30;
        let flashHue = spec.flashHue || 200;
        let flashRotate = spec.flashRotate || 15;
        let radius = spec.radius || 20;
        let startAngle = spec.startAngle || 0;
        let ccw = spec.ccw || false;
        // super
        super(x, y);
        // local vars
        // setup outline
        // - outlineVerts
        // - outlineLen
        // - outline
        this.setupOutline(x, y, radius, startAngle);
        this.outlineColor = outlineColor;
        this.tracedOutlineColor = tracedOutlineColor;
        this.outlineWidth = outlineWidth;
        this.ttl = ttl * 1000;
        // setup trace
        this.trace = {
            radius: radius,
            center: {x: x, y: y},
            startAngle: startAngle,
            angle: startAngle,
            x: x+Math.cos(startAngle)*radius,
            y: y+Math.sin(startAngle)*radius,
            origin: origin,
            traceColor: traceColor,
            speed: (ccw) ? (-Math.PI*2/this.ttl) : (Math.PI*2/this.ttl),
        }
        this.setupTracedOutline();
        this.flashP = new FlashParticle(this.trace.x, this.trace.y, flashWidth, flashHue, ttl, flashRotate);

    }

    setupOutline(x, y, radius, startAngle) {
        this.outlineLen = Math.PI * 2 * radius;
        this.outline = new Path2D();
        this.outline.arc(x, y, radius, startAngle, startAngle+Math.PI*2);
        this.outline.closePath();
    }

    setupTracedOutline() {
        this.tracedOutline = new Path2D();
        if (this.trace.speed > 0) {
            this.tracedOutline.arc(this.trace.center.x, this.trace.center.y, this.trace.radius, this.trace.startAngle, this.trace.angle);
        } else {
            this.tracedOutline.arc(this.trace.center.x, this.trace.center.y, this.trace.radius, this.trace.angle, this.trace.startAngle);
        }
    }

    update(delta_time) {
        if (this.done) return;
        // update trace
        this.trace.angle += this.trace.speed * delta_time;
        this.setupTracedOutline();
        this.trace.x = this.trace.center.x+Math.cos(this.trace.angle)*this.trace.radius;
        this.trace.y = this.trace.center.y+Math.sin(this.trace.angle)*this.trace.radius;
        // update flash particle
        this.flashP.x = this.trace.x;
        this.flashP.y = this.trace.y;
        this.flashP.update(delta_time);
        // update ttl
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) {
                this.done = true;
            }
        }
    }

    draw(canvas_context) {
        this.flashP.draw(canvas_context);
        // draw outline
        canvas_context.lineWidth = this.outlineWidth;
        canvas_context.strokeStyle = this.outlineColor;
        canvas_context.stroke(this.outline);
        // draw traced outline
        canvas_context.strokeStyle = this.tracedOutlineColor;
        canvas_context.stroke(this.tracedOutline);
        // draw trace
        canvas_context.fillStyle = this.trace.traceColor;
        canvas_context.fillRect(this.trace.x-1,this.trace.y-1, 3, 3);
        canvas_context.beginPath();
        canvas_context.moveTo(this.trace.origin.x, this.trace.origin.y);
        canvas_context.lineTo(this.trace.x, this.trace.y);
        canvas_context.closePath();
        canvas_context.strokeStyle = this.trace.traceColor;
        canvas_context.stroke();
    }

}

class ComboLockParticle extends Particle {
    constructor(spec) {
        // parse spec/assign defaults
        let x = spec.x || 0;
        let y = spec.y || 0;
        let lockColor = spec.lockColor || new Color(200,0,0);
        let unlockColor = spec.unlockColor || new Color(0,200,0);
        let lockWidth = spec.lockWidth || 1;
        let unlockWidth = spec.unlockWidth || 1;
        let unlockAngle = spec.unlockAngle || Math.PI*.25;
        let spinTTL = spec.spinTTL || 1;
        let unlockTTL = spec.unlockTTL || 1;
        let radius = spec.radius || 10;
        let endAngle = spec.endAngle || -Math.PI*.5;  // default straight up
        let rotation = spec.rotation || Math.PI;
        // super constructor
        super(x, y);
        // local vars
        this.ttl = (unlockTTL + spinTTL) * 1000;
        this.radius = radius;
        this.unlockAngle = unlockAngle;
        this.lockAngle = Math.PI*2 - unlockAngle;
        this.lockWidth = lockWidth;
        this.unlockWidth = unlockWidth;
        this.lockColor = lockColor;
        this.unlockColor = unlockColor;
        this.rotation = rotation;
        this.speed = rotation/(spinTTL*1000);
        this.endAngle = endAngle;
        this.angle = this.endAngle + this.rotation;
    }

    update(delta_time) {
        if (this.done) return;
        // rotation/angle
        let deltaRotation = this.speed * delta_time;
        if ((this.rotation - deltaRotation)*this.rotation > 0) {
            this.rotation -= this.speed * delta_time;
            this.angle = this.endAngle + this.rotation;
        } else {
            this.rotation = 0;
            this.angle = this.endAngle;
        }
        // update ttl
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) {
                this.done = true;
            }
        }
    }

    draw(canvas_context) {
        // draw lock ring
        canvas_context.beginPath();
        canvas_context.lineWidth = this.lockWidth;
        canvas_context.strokeStyle = this.lockColor;
        let startAngle = this.angle + this.unlockAngle*.5;
        let endAngle = startAngle + this.lockAngle;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, startAngle, endAngle);
        canvas_context.stroke();
        // draw unlock ring
        canvas_context.beginPath();
        canvas_context.lineWidth = this.unlockWidth;
        canvas_context.strokeStyle = this.unlockColor;
        startAngle = this.angle - this.unlockAngle*.5;
        endAngle = startAngle + this.unlockAngle;
        canvas_context.arc(Math.round(this.x), Math.round(this.y), this.radius, startAngle, endAngle);
        canvas_context.stroke();
    }

}

class ScanLineParticle extends Particle {
    static down = 1;
    static up = 2;
    static left = 3;
    static right = 4;

    constructor(spec) {
        // parse spec/assign defaults
        let x = spec.x || 0;
        let y = spec.y || 0;
        super(x, y);
        this.lineColor = spec.lineColor || new Color(0,200,200);
        this.lineWidth = spec.lineWidth || 3;
        this.ttl = (spec.ttl || 1) * 1000;
        this.travel = spec.travel || 64;
        this.span = spec.span || 64;
        this.scanTrail = spec.scanTrail || 5;
        this.scanDir = spec.scanDir || ScanLineParticle.down;
        this.floaters = spec.floaters || 2;
        this.floaterPct = spec.floaterPct || .25;
        this.floaterColor = spec.floaterColor || new Color(this.lineColor.r, this.lineColor.g, this.lineColor.b, this.lineColor.a*.75);
        this.floaterTTL = spec.floaterTTL || .5;
        this.floaterWidth = spec.floaterWidth || 2;
        // local vars
        this.speed = this.travel/this.ttl;
        if (this.scanDir === ScanLineParticle.down || this.scanDir === ScanLineParticle.right) {
            this.speed = this.travel/this.ttl;
            this.scan = -this.travel*.5;
        } else {
            this.speed = -this.travel/this.ttl;
            this.scan = this.travel*.5;
        }
        this.alphaShift = this.lineColor.a/(this.scanTrail+5);
        this.subparticles = [];
    }

    get done() {
        if (!this._done) return false;
        let subdone = true;
        for (let i=0; i<this.subparticles.length; i++) {
            subdone &= this.subparticles[i].done;
        }
        return subdone;
    }
    set done(value) {
        this._done = (value) ? true : false;
    }

    update(delta_time) {
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].update(delta_time);
        }
        if (this.done) return;
        // update ttl
        if (this.ttl) {
            this.ttl -= delta_time;
            if (this.ttl <= 0) {
                this.done = true;
            }
        }
        // scan
        this.scan += this.speed*delta_time;
        if (this.scan < -this.span*.5 || this.scan > this.span*.5) return;
        // floaters
        if (this.floaters && Math.random() < this.floaterPct) {
            for (let i=0; i<this.floaters; i++) {
                let ppx, ppy, dx, dy;
                if (this.scanDir === ScanLineParticle.down || this.scanDir === ScanLineParticle.up) {
                    ppx = this.x + random_int(-this.span*.5, this.span*.5);
                    ppy = this.y + this.scan;
                    dx = random_float(-2, 2);
                    dy = (this.scanDir === ScanLineParticle.down) ? random_float(-10, 0) : random_float(0, 10);
                } else {
                    ppx = this.x + this.scan;
                    ppy = this.y + random_int(-this.span*.5, this.span*.5);
                    dx = (this.scanDir === ScanLineParticle.right) ? random_float(-10, 0) : random_float(0, 10);
                    dy = random_float(-2, 2);
                }
                let ttl = random_float(this.floaterTTL*.75,this.floaterTTL*1.5);
                let width = random_float(1, this.floaterWidth);
                let fp = new FadeParticle(ppx, ppy, dx, dy, width, this.floaterColor.copy(), ttl);
                this.subparticles.push(fp);
            }
        }

    }

    draw(canvas_context) {
        // draw scan line
        if (this.scan >= -this.span*.5 && this.scan <= this.span*.5) {
            canvas_context.beginPath();
            canvas_context.lineWidth = this.lineWidth;
            canvas_context.strokeStyle = this.lineColor;
            if (this.scanDir === ScanLineParticle.down || this.scanDir === ScanLineParticle.up) {
                canvas_context.moveTo(this.x-this.span*.5, this.y+this.scan);
                canvas_context.lineTo(this.x+this.span*.5, this.y+this.scan);
            } else {
                canvas_context.moveTo(this.x+this.scan, this.y-this.span*.5);
                canvas_context.lineTo(this.x+this.scan, this.y+this.span*.5);
            }
            canvas_context.stroke();
        }
        // draw trail
        for (let i=0; i<this.scanTrail; i++) {
            let trailscan = this.scan;
            if (this.scanDir === ScanLineParticle.down || this.scanDir === ScanLineParticle.right) {
                trailscan -= (this.lineWidth*.5 + this.lineWidth*i);
            } else {
                trailscan += (this.lineWidth*.5 + this.lineWidth*i);
            }
            let alpha = this.lineColor.a - (this.alphaShift*(i+5));
            if (trailscan>-this.travel*.5 && trailscan<this.travel*.5) {
                canvas_context.strokeStyle = this.lineColor.asRGB(alpha);
                canvas_context.lineCap = "round";
                //canvas_context.moveTo(this.x-this.span*.5, this.y+y);
                //canvas_context.lineTo(this.x+this.span*.5, this.y+y);
                if (this.scanDir === ScanLineParticle.down || this.scanDir === ScanLineParticle.up) {
                    canvas_context.moveTo(this.x-this.span*.5, this.y+trailscan);
                    canvas_context.lineTo(this.x+this.span*.5, this.y+trailscan);
                } else {
                    canvas_context.moveTo(this.x+trailscan, this.y-this.span*.5);
                    canvas_context.lineTo(this.x+trailscan, this.y+this.span*.5);
                }
                canvas_context.stroke();
            }
        }
        // draw sub particles
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].draw(canvas_context);
        }
    }

}

class CollapseOrbParticle extends Particle {

    constructor(spec) {
        // parse spec/assign defaults
        let x = spec.x || 0;
        let y = spec.y || 0;
        super(x, y);
        this.color = spec.color || new Color(0,255,255, .5);
        let ttl = (spec.ttl || 1.5) * 1000;
        let growthPct = spec.growthPct || .15;
        this.growthTTL = ttl * growthPct;
        this.collapseTTL = ttl - this.growthTTL;
        this.maxRadius = spec.maxRadius || 32;
        this.radius = 0;
        // local vars
        this.growthRate = this.maxRadius/this.growthTTL;
        this.collapseRate = this.maxRadius/this.collapseTTL;
        this.lightningInterval = spec.lightningInterval * 1000 || 100;
        this.lightningTTL = spec.lightningInterval * 1000 || 60;
        this.lightning = spec.lightning || {
            x: x,
            y: y,
        }
        this.lightningCount = (this.lightning.hasOwnProperty("count")) ? this.lightning.count : 5;
        this.subparticles = [];
    }

    genLightning(spec) {
        //debug.log("spec: " + spec);
        let distance = this.radius;
        let x = spec.x || 0;
        let y = spec.y || 0;
        let targetx = spec.x;
        let targety = spec.y;
        let segments = spec.segments || random_int(10,15);
        let width = spec.width || random_int(1,2);
        let color = (spec.color || new Color(0,255,255)).copy();
        color.a = random_float(.25,1);
        let angle = random_float(0,Math.PI*2);
        let originx = spec.x + Math.cos(angle) * distance;
        let originy = spec.y + Math.sin(angle) * distance;
        let variance = spec.variance || 1.5;
        let endWidth = spec.endWidth || 10;
        let ttl = spec.ttl || .1;
        let floaterPct = spec.floaterPct || 0;
        let p = new LightningParticle({x: originx, y:originy}, {x: targetx, y: targety}, segments, width, color, endWidth, variance, ttl, floaterPct);
        this.subparticles.push(p);
        //debug.log("sp len: " + this.subparticles.length);
    }

    get done() {
        if (!this._done) return false;
        let subdone = true;
        for (let i=0; i<this.subparticles.length; i++) {
            subdone &= this.subparticles[i].done;
        }
        return subdone;
    }
    set done(value) {
        this._done = (value) ? true : false;
    }

    update(delta_time) {
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].update(delta_time);
        }
        if (this.done) return;
        // growth
        if (this.growthTTL > 0) {
            this.growthTTL -= delta_time;
            if (this.growthTTL < 0) this.growthTTL = 0;
            this.radius += this.growthRate*delta_time;
            if (this.radius > this.maxRadius) this.radius = this.maxRadius;
        // collapse
        } else {
            this.collapseTTL -= delta_time;
            if (this.collapseTTL <= 0) {
                this.done = true;
            }
            this.radius -= this.collapseRate*delta_time;
            if (this.radius < 0) this.radius = 0;
        }
        if (this.collapseTTL <= 0) return;
        // lightning
        this.lightningTTL -= delta_time;
        if (this.lightningTTL <= 0) {
            this.lightningTTL = this.lightningInterval;
            for (let i=0; i<this.lightningCount; i++) {
                this.genLightning(this.lightning);
            }
        }
    }

    draw(canvas_context) {
        // draw orb
        canvas_context.beginPath();
        canvas_context.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        canvas_context.fillStyle = this.color.toString();
        canvas_context.fill();
        // draw sub particles
        for (let i=0; i<this.subparticles.length; i++) {
            this.subparticles[i].draw(canvas_context);
        }
    }

}