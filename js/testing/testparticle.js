
class Color {
    constructor(r, g, b, a=1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString() {
        return("rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")");
    }
}

class ParticleEmitter {
    constructor(psys, genFcn, ticks) {
        this.psys = psys;
        this.genFcn = genFcn;
        this.ticks = ticks;
        this.currentTick = 0;
    }

    update() {
        this.currentTick++;
        if (this.currentTick >= this.ticks) {
            this.currentTick = 0;
            let p = this.genFcn();
            this.psys.add(p);
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    add(p) {
        this.particles.push(p);
    }

    remove(p) {
        let idx = this.particles.indexOf(p);
        if (idx >= 0) {
            this.particles.splice(idx, 1);
        }
    }

    update() {
        for (let i=this.particles.length-1; i>=0; i--) {
            // update each particle
            this.particles[i].update();
            // if any particles are done, remove them
            if (this.particles[i].done) {
                this.particles.splice(i, 1);
            }
        }
    }
}

class Particle {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this._done = false;
    }

    get done() {
        return this._done;
    }

}

class FadeParticle extends Particle {
    constructor(ctx, x, y, dirX, dirY, size, color, ticks) {
        super(ctx, x, y);
        this.dirX = dirX;
        this.dirY = dirY;
        this.size = size;
        this.color = color;
        // ctx.strokeStyle = 'rgba(r,g,b,a)';
        this.ticks = ticks;
        this.fadePerTick = 1/ticks;
        this.fade = 1;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
        this.ctx.fillStyle = this.color.toString();
        //this.ctx.fillStyle = "#8c5523";
        //this.ctx.fillStyle = 'rgba(255,0,0,1)';
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

class Env {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
        // setup environment
        this.ps = new ParticleSystem();
        let ctx = this.ctx;

        this.pe = new ParticleEmitter(this.ps, () => {
            let o = (Math.random() * 10) - 5;
            let v = (Math.random() * -2);
            let s = (Math.random() * 4);
            let t = (Math.random() * 40);
            return new FadeParticle(ctx, 100+o, 100, 0, -1+v, 1+s, new Color(0,255,255), 10+t);
        }, 10);

        this.pe2 = new ParticleEmitter(this.ps, () => {
            let o = (Math.random() * 10) - 5;
            let v = (Math.random() * -2);
            let s = (Math.random() * 4);
            let t = (Math.random() * 40);
            return new FadeParticle(ctx, 100+o, 100, 0, -1+v, 1+s, new Color(255,255,0), 10+t);
        }, 10);

        //this.ps.add(p);
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ps.update();
        this.pe.update();
        this.pe2.update();
    }

    setup() {
        return new Promise((resolve) => {
            console.log("env: setup complete");
            resolve();
        });
    }

    start() {
        let runningId = -1;
        if (runningId == -1) {
            console.log("env: starting loop...");
            runningId = setInterval(() => { this.loop(); }, this.INTERVAL);
        }
    }
}

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}