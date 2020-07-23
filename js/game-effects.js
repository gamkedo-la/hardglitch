import { 
    ParticleEmitter, 
    ParticleGroup, 
    SwirlParticle,
    FlashParticle,
    RingParticle,
} from "./system/particles.js";

import { random_int, random_float } from "./system/utility.js";

export { GameFx };

class GameFx {

    constructor(position) {
        this._position = position;
        this.relocatables = [];
        this.sentinels = [];
        this._done = false;
    }

    get position() {
        return this._position;
    }

    set position(value) {
        console.log("setting position: " + value);
        for (let i=0; i<this.relocatables.length; i++) {
            this.relocatables[i].x = value.x;
            this.relocatables[i].y = value.y;
        }
        this._position = value;
    }

    get done() {
        if (this._done) return true;
        let done = true;
        for (let i=0; i<this.sentinels.length; i++) {
            done &= this.sentinels[i].done;
        }
        return done;
    }

    set done(value) {
        value = (value) ? true : false;
        this._done = true;
        for (let i=0; i<this.sentinels.length; i++) {
            this.sentinels[i].done = value;
        }
    }

    toString() {
        return "[GameFx:" + this._position.x + "," + this._position.y + "]";
    }

    static particleSystem;

    static initialize(particleSystem) {
        GameFx.particleSystem = particleSystem;
    }

    static destruction(position) {
        let particles = GameFx.particleSystem;
        let ttl = 1.5;
        let minHue = 130;
        let maxHue = 200;
        let minSpeed = 25;
        let maxSpeed = 200;
        let minRadius = 50;
        let maxRadius = 55;
        let minPttl = 1;
        let maxPttl = 2;
        let minWidth = 1;
        let maxWidth = 3;
        let pburst = 250;
        let pstreamInterval = .1;
        let pstreamVar = 25;
        let pstream = 5;
        // creates a sentinel object used to control all particles for swirl fx
        this.sentinel = new ParticleGroup(ttl);
        particles.add(this.sentinel);
        // creates an object used to control collapse of all particles at the same time
        let collapse = new ParticleGroup(ttl*.65);
        particles.add(collapse);
        // creates a burst of particles at beginning of animation
        let burstEmitter = new ParticleEmitter(particles, position.x, position.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, hue, speed, radius, width, collapse, ttl*.25);
            }, 0, 0, 0.1, pburst);
        particles.add(burstEmitter);

        // creates a slow stream of particles through rest of animation
        let trickleEmitter = new ParticleEmitter(particles, position.x, position.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let pttl = random_float(minPttl,maxPttl);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, hue, speed, radius, width, collapse, pttl);
            }, pstreamInterval, pstreamVar, pstream, ttl*.25);
        particles.add(trickleEmitter);
        
        // create fx wrapper
        let fx = new GameFx(position);
        fx.sentinels.push(collapse);
        fx.sentinels.push(burstEmitter);
        fx.sentinels.push(trickleEmitter);
        return fx;
    }

    static damage(position){
        const effect = new ParticleEmitter(GameFx.particleSystem, position.x, position.y, (emitter) => {
            const xoff = random_int(-15,15);
            const yoff = random_int(-15,15);
            const width = random_int(20,40);
            const hue = random_int(150, 250);
            const ttl = .1;
            return new FlashParticle(emitter.x + xoff, emitter.y + yoff, width, hue, ttl);
        }, .1, 0, 0, 10);
        GameFx.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }

    static missile(position){
        const effect = new ParticleEmitter(GameFx.particleSystem, position.x, position.y, (emitter) => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let radius = random_int(8,16);
            let ttl = random_float(.75,1.5);
            let hue = random_int(200, 500);
            return new RingParticle(emitter.x+xoff, emitter.y+yoff, radius, hue, ttl, 10);
        }, 1 / 16, 25);
        GameFx.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }


}