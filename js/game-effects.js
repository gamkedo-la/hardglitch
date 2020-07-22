import { 
    ParticleEmitter, 
    ParticleGroup, 
    SwirlParticle,
} from "./system/particles.js";

import { random_int, random_float } from "./system/utility.js";

export { GameFx };

class GameFx {

    constructor(pos) {
        this._pos = pos;
        this.relocatables = [];
        this.sentinels = [];
    }

    get pos() {
        return this._pos;
    }

    set pos(value) {
        for (let i=0; i<this.relocatables.length; i++) {
            this.relocatables[i].x = value.x;
            this.relocatables[i].y = value.y;
        }
        this._pos = value;
    }

    get done() {
        let done = true;
        for (let i=0; i<this.sentinels.length; i++) {
            done &= this.sentinels[i].done;
        }
        return done;
    }

    static particleSystem;

    static init(particleSystem) {
        GameFx.particleSystem = particleSystem;
    }

    static destruction(pos) {
        let particles = GameFx.particleSystem;
        let ttl = 2.5;
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
        particles.add( new ParticleEmitter(particles, pos.x, pos.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(pos.x, pos.y, hue, speed, radius, width, collapse, ttl*.25);
            }, 0, 0, 0.1, pburst));

        // creates a slow stream of particles through rest of animation
        particles.add( new ParticleEmitter(particles, pos.x, pos.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let pttl = random_float(minPttl,maxPttl);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(pos.x, pos.y, hue, speed, radius, width, collapse, pttl);
            }, pstreamInterval, pstreamVar, pstream, ttl*.25));
        
        // create fx wrapper
        let fx = new GameFx(pos);
        fx.sentinels.push(this.sentinel);
        return fx;

    }

}