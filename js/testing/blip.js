const dfltSpeed = 1;

/**
 * helper class for constructing circuits
 */
class CircuitGenerator {
    /**
     * create a new generator
     * @param {*} board - the board to be associated with the circuit
     */
    constructor(board) {
        this.board = board;
        this.blipGen = new BlipGenerator(board);
        this.maxBlipsPerUnit = .25;
    }

    /**
     * create a new circuit
     * @param {*} path - the path of the circuit, array of points
     */
    create(path) {
        let circuit = new Circuit(path);
        // determine the number of blips by the length of the path
        let length = 0;
        let last;
        for (const node of path || []) {
            if (last) {
                let dx = last.x - node.x;
                let dy = last.y - node.y;
                length += Math.sqrt(dx*dx + dy*dy);
            }
            last = node;
        }
        let raw = Math.random() * this.maxBlipsPerUnit * length;
        let blipCount = Math.floor(raw) + 1;
        for (let i=0; i<blipCount; i++) {
            this.blipGen.create(circuit);
        }
        return circuit;
    }

}

/**
 * helper class to generate a blip
 */
class BlipGenerator {
    /**
     * create a new generator
     * @param {*} board - the board associated w/ the circuits/blips
     * @param {*} blipImg - (optional) main blip image, if not specified, images default to inline b64 encoded images
     * @param {*} sparkMinImg - (optional) lesser spark image
     * @param {*} sparkMaxImg - (optional) major spark image
     */
    constructor(board, blipImg, sparkMinImg, sparkMaxImg) {
        this.board = board;
        if (blipImg) {
            this.blipImg = blipImg;
        } else {
            this.blipImg = new Image();
            this.blipImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAGpJREFUCJljYGBgYGC4t4R377fnfgz3lvAyMDAwMDLcW8IbxiU3e9W3R0qhXHL3Vn97lMq0V8LZ8f2/X3pzhM1NP/z7pbdXwtmRyfnF3v28jCwXU96ePCnAxHbJ+cXe/QwwMw98e+ELMxMAdOgpmvYoUogAAAAASUVORK5CYII=";
        }
        if (sparkMinImg) {
            this.sparkMinImg = sparkMinImg;
        } else {
            this.sparkMinImg = new Image();
            this.sparkMinImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAKJJREFUGJVjYCAShL44xANj8BJQWIQukIVDIVZxhtAXh1Yw3FvCu/fbcz/rpzvdQ18cWoEsz4LMWf3tUWool9xs5xd7lUK55O79+f9vObI8EzJnr4Sz44d/v/TOSnqYfvj3Sy+HX/0/TsWTP95k4GVkuWj8fMdJASa2S84v9u7HqZiVkSnq5b+f8w9IuLTCnITLc8SFBkY4YmrghTF48ClEBgC2gUsgQpNFAwAAAABJRU5ErkJggg==";
        }
        if (sparkMinImg) {
            this.sparkMaxImg = sparkMaxImg;
        } else {
            this.sparkMaxImg = new Image();
            this.sparkMaxImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAAXNSR0IArs4c6QAAAiFJREFUOI21lE9oE0EUxt9MN2mMNjYVapvdS7EYKIV46EXdpro1JJqDYhC8Sy7mIHgRL3rx4kla8VKvIr0UD2JxSAiNDQ3qRUGiAREPkz/GpsYNSbPbZKanQtnuJm2N3/F78/3mvYF5IFPigP8hmZJQjzj9RkPpKXBX4VAdy5S4uh2I+SkZPQBw2ugho+GnRGIAV+0Iv7QBFog4+9sMpuTjJ3TOJtJScNVYw0bjnRSkdoQX2wC3BYRa14or48Yz4UJyECEUsiP8xezCPVAAgD5A+Bjqe+bEQny9rQ1HyxkfAECklPLKlEw7sZB3AF5OioE/Zvk94+/q5tRftuW5NzixOK/mHh3Htpra3jofHRi/NafmLqSl4JpVtqMipZQ3XEjGfuq1X/DjxYdvzerm5WJyYafzQ+t6MXUjUEhk83qdBwqJ7MPKpwfdMqZvuqNoOePbYJo0PzQ1JtJX758OTY2tNdfrkVLK2yln+aYAADIl5+64vCsLte/3z/S7bR+1ihYbOP14Ts3NurCtsuxRsgeChgtJtxMLtNjaDJ0UHOWlkZlctJzxfdXVo6PCkXiDtUSNM5wQL20Ys6bjK/m4uwnsSoO1xLQUXF0amckBADwfPvvZje3VBmtJdWjfZcBNmzKF6pxNcs7fvvEoVWPttediVuMMYQ5PdM5u7utLm/1lK/kpkWRKYt2AnbeNdc58u1nuw/2DFaPxT0BLcK8kU+LYBsfT5A44S06zAAAAAElFTkSuQmCC";
        }
        this.minSpeed = .25;
        this.maxSpeed = 2;
    }

    /**
     * Create a new blip for the given circuit
     * @param {*} circuit 
     */
    create(circuit) {
        // calculate random speed
        let speed = Math.random()*(this.maxSpeed-this.minSpeed) + this.minSpeed;
        // make speed an even quarter step
        speed = Math.floor(speed*4)*.25;
        // create the blip
        let blip = new PingPongBlip(this.board, circuit.path, speed, this.blipImg, this.sparkMinImg, this.sparkMaxImg);
        // assign blip images
        blip.blipImg = this.blipImg;
        blip.sparkMinImg = this.sparkMinImg;
        blip.sparkMaxImg = this.sparkMaxImg;
        circuit.add(blip);
        return blip;
    }
}

/** 
 * the board class represents the entire circuit board associated with a tile.
 */
class Board {
    /**
     * Create a new board
     * @param {*} pos - {x,y} position of board in pixels
     * @param {*} paths - array of paths, where each path is {x,y} object representing grid position of a point in the path
     */
    constructor(pos, paths) {
        this.gridSize = 8;
        this.gridWidth = 8;
        this.maskLeft = true;
        this.maskRight = true;
        this.maxX = this.gridSize * this.gridWidth;
        this.circuits = [];
        this.pos = pos;

        // generate circuits
        let circuitGen = new CircuitGenerator(this);
        for (const path of paths) {
            let circuit = circuitGen.create(path);
            this.add(circuit);
        }
    }

    /**
     * add circuit to board
     * @param {*} circuit 
     */
    add(circuit) {
        if (circuit) this.circuits.push(circuit);
    }

    /**
     * draw all circuits associated with the board
     */
    draw(ctx) {
        for (const circuit of this.circuits) {
            circuit.draw(ctx, this.pos);
        }
    }
}

/**
 * a circuit represents a single path on the circuit board tiles as well as any transmission blips associated with that path
 */
class Circuit {
    /**
     * create a new circuit
     * @param {*} path - array of path points.  each point is {x:...,y:...} and uses grid/board indices (vs. pixel count)
     */
    constructor(path) {
        this.path = path;
        this.blips = [];
    }

    /**
     * add a blip to the circuit
     * @param {*} blip - blip to add
     */
    add(blip) {
        if (blip) {
            this.blips.push(blip);
            blip.circuit = this;
        }
    }

    /**
     * determine the nearest range of other blips on the circuit
     * @param {*} blip 
     * @returns float - distance to nearest blip on the same circuit
     */
    nearestRange(blip) {
        let sqr = 1000;
        for (const other of this.blips) {
            if (other === blip) continue;
            let dx = other.x - blip.x;
            let dy = other.y - blip.y;
            let or = dx*dx + dy*dy;
            if (or < sqr) sqr = or;
        }
        return Math.sqrt(sqr);
    }

    /**
     * draw the circuit (just the blips)
     */
    draw(ctx, pos) {
        for (const blip of this.blips) {
            blip.draw(ctx, pos);
        }
    }

}

/**
 * A ping-pong blip that travels back and forth along the given path
 */
class PingPongBlip {
    /**
     * create a new blip
     * @param {Board} board - board the blip belongs on
     * @param {*} path - array of path points.  each point is {x,y} and uses grid/board indices (vs. pixel count)
     * @param {*} speed - speed of blip in pixels per tick
     * @param {*} blipImg - main blip image
     * @param {*} sparkMinImg - minor spark image
     * @param {*} sparkMaxImg - major spark image
     */
    constructor(board, path, speed, blipImg, sparkMinImg, sparkMaxImg) {
        this.board = board;
        this.blipImg = blipImg;
        this.sparkMinImg = sparkMinImg;
        this.sparkMaxImg = sparkMaxImg;
        this.sparkRange = 2.5;
        this.range = .1;
        this.path = []
        // convert path from grid position to pixel position
        for (let node of path || []) {
            this.path.push({x:(node.x || 0) * board.gridSize, y:(node.y || 0) * board.gridSize});
        }
        this.speed = speed || dfltSpeed;
        this.x = 0;
        this.y = 0;
        this.forward = true;
        this.targetIdx = 0;
        this.start();
        this.circuit;
        this.maxX = board.gridSize * board.gridWidth;
    }

    /**
     * setup the blip, called once during initialization
     */
    start() {
        if (!this.path || this.path.length == 1) return;
        let idx = Math.floor(Math.random() * this.path.length);
        let start = this.path[idx];
        this.x = start.x;
        this.y = start.y;
        if (idx == 0) {
            this.forward = true;
        } else if (idx == this.path.length-1) {
            this.forward = false;
        } else {
            this.forward = (Math.random() > .5) ? true : false;
        }
        this.targetIdx = (this.forward) ? idx+1 : idx-1;
    }

    /**
     * move the blip, called per tick
     */
    move() {
        // arrived at target?
        let target = this.path[this.targetIdx];
        if (Math.abs(this.x - target.x) <= this.range && Math.abs(this.y - target.y) < this.range) {
            if (this.forward) {
                if (this.targetIdx == this.path.length-1) {
                    this.forward = false;
                    this.targetIdx -= 1;
                } else {
                    this.targetIdx += 1;
                }
            } else {
                if (this.targetIdx == 0) {
                    this.forward = true;
                    this.targetIdx = 1;
                } else {
                    this.targetIdx -= 1;
                }
            }
            target = this.path[this.targetIdx];
        }
        // move towards target
        if (Math.abs(this.x - target.x) >= this.range) {
            let delta = this.speed;
            if (Math.abs(target.x - this.x) < this.speed) {
                delta = Math.abs(target.x - this.x);
            }
            this.x = (this.x > target.x) ? this.x - delta : this.x + delta;
        }
        if (Math.abs(this.y - target.y) >= this.range) {
            let delta = this.speed;
            if (Math.abs(target.y - this.y) < this.speed) {
                delta = Math.abs(target.y - this.y);
            }
            this.y = (this.y > target.y) ? this.y - delta : this.y + delta;
        }


    }

    /**
     * draw the current state of the blip at the given position (offset)
     * @param {*} ctx - canvas context on which to draw
     * @param {*} pos - {x,y} position of starting offset for the grid
     */
    draw(ctx, pos) {
        this.move();
        let nr = (this.circuit) ? this.circuit.nearestRange(this) : 10;
        let img = this.blipImg;
        if (nr <= this.sparkRange*2 && nr >= this.sparkRange) {
            img = this.sparkMinImg;
        } else if ( nr < this.sparkRange) {
            img = this.sparkMaxImg;
        }
        // handle left/right mask for blips traveling past circuit boundary
        if (this.board.maskLeft && this.x < 0) return;
        if (this.board.maskRight && this.x > this.maxX) return;
        let x = (pos) ? pos.x + this.x : this.x;
        let y = (pos) ? pos.y + this.y : this.x;
        x -= Math.floor((img.width)*.5);
        y -= Math.floor((img.height)*.5);
        ctx.drawImage(img, x, y);
    }

    /**
     * convert to string
     */
    toString() {
        return "Blip(" + this.x + "," + this.y + ")";
    }
}

export { BlipGenerator, CircuitGenerator, Circuit, Board };