
export {
    FogOfWar,
}

import * as visibility from "../rules/visibility.js";
import * as graphics from "../system/graphics.js";
import { Vector2, Vector2_origin } from "../system/spatial.js";
import { PIXELS_PER_TILES_SIDE } from "./entity-view.js";
import { index_from_position } from "../system/utility.js";
import * as assets from "../game-assets.js";
import * as concepts from "../core/concepts.js";

const fog_sprites_defs = {
    [false] : assets.sprite_defs.void,  // When we cannot see there
};

class FogOfWar {

    constructor(world, field_of_view){
        console.assert(world instanceof concepts.World);
        console.assert(field_of_view instanceof visibility.FieldOfView);
        this.field_of_view = field_of_view;
        this.world = world;

        this._refresh();
    }

    index(position){
        return index_from_position(this.world.width, this.world.height, position);
    }

    _refresh(){
        this.field_of_view.update(this.world);

        const world_size = this.world.width * this.world.height;
        const tile_id_grid = new Array(world_size).fill(false);

        this.field_of_view.visible_positions
            .filter(position => this.world.is_valid_position(position))
            .forEach(position =>{
                tile_id_grid[this.index(position)] = undefined;
            });

        this.tilegrid = new graphics.TileGrid(Vector2_origin,
            new Vector2({ x: this.world.width, y: this.world.height }),
            PIXELS_PER_TILES_SIDE,
            fog_sprites_defs, tile_id_grid);
        this.tilegrid.enable_draw_background = false;
    }

    change_viewer_position(new_pos){
        this.field_of_view.position = new_pos;
        this._refresh();
    }

    update(delta_time){
        this.tilegrid.update(delta_time);
    }

    display(){
        this.tilegrid.draw();
    }

    is_visible(...positions){
        return this.field_of_view.is_visible(...positions);
    }

};


