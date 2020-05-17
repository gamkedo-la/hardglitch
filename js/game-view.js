// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView };

import * as graphics from "./system/graphics.js";
import { random_int } from "./system/utility.js";

import * as concepts from "./core/concepts.js";

import { assets } from "./game-assets.js";
import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";


const PIXELS_PER_TILES_SIDE = 50;
const HALF_PIXELS_PER_TILES_SIDE = PIXELS_PER_TILES_SIDE / 2;

// Return a vector in the graphic-world by interpreting a game-world position.
function graphic_position(vec2){
    return new Vector2({ x: (vec2.x * PIXELS_PER_TILES_SIDE) - HALF_PIXELS_PER_TILES_SIDE
                       , y: (vec2.y * PIXELS_PER_TILES_SIDE) - HALF_PIXELS_PER_TILES_SIDE
                       });
}


// Representation of a body.
class BodyView {
    constructor(body){
        console.assert(body instanceof concepts.Body);
        this.body = body;

        this.sprite = new graphics.Sprite();

        // TODO: make a better logic to let know how to load the body spritesheet
        this.sprite.source_image = assets.images.warrior;
        if(this.body.assets){
            if(this.body.assets.spritesheet)
                this.sprite.source_image = this.body.assets.spritesheet
        }

        this.some_value = -99999.0 + random_int(0, 7);
    }

    update(){
        this.sprite.position = graphic_position(this.body.position);
        this.some_value += 0.5;
        const some_direction = {x:Math.sin(this.some_value), y:Math.cos(this.some_value)};
        this.sprite.position = this.sprite.position.translate(some_direction);
    }

    render_graphics(){
        this.sprite.draw();
    }
};

class GameView {
    tile_grid = new graphics.TileGrid();
    body_views = [];

    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this.reset();
    }

    interpret_last_turn_events(){
        let events = this.game.last_turn_info.events; // turns.PlayerTurn
        // TEMPORARY: for now, just reset to the new state
        this.reset();
    }

    update(){
        this.body_views.forEach(body_view => {
            body_view.update();
        });
    }

    render_graphics(){
        this.tile_grid.draw();
        this.body_views.forEach(body_view => {
            body_view.render_graphics();
        });
    }

    // Re-interpret the game's state from scratch.
    reset(){
        // TODO: reset the tiles

        this.body_views = [];
        this.game.world.bodies.forEach(body => {
            this.body_views.push(new BodyView(body));
        });
    }
};



