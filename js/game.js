// This files provie the abstract representation of a game
// and how it is setup by default.

export { Game }

import * as concepts from "./core/concepts.js";
import * as turns from "./core/action-turn.js";
import { Wait } from "./rules/rules-basic.js";
import { random_sample } from "./system/utility.js";
import * as tiles from "./definitions-tiles.js";
import { sprite_defs, tile_defs } from "./game-assets.js";

class Player extends concepts.Body {
    assets = {
        graphics : {
            sprite_def : sprite_defs.player,
        }
    };

    constructor(){
        super();
        this.actor = new concepts.Player();
    }
}

// Abstract but complete representation of a game.
// Create this object for each new game.
// Make it visible using a GameView.
class Game {
    last_turn_info = null;
    player_turn_count = 0;

    constructor(world){
        console.assert(world instanceof concepts.World);
        this.world = world ? world : new concepts.World();

        // Prepare the game turns to be ready to play (player's turn)
        this.add_player_character_at_random_entry_point();
        this.__turn_sequence = turns.execute_turns_until_players_turn(this.world);
        this.update_until_player_turn(new Wait());
        this.last_turn_info.clear_events(); // Remove previous events, we don't really want to know what happened before the first turn.
    }

    update_until_player_turn(next_player_action) {
        console.log(`Player Action: ${next_player_action.name}`);

        console.log(`SOLVING TURNS ...`);
        const turn_iter = this.__turn_sequence.next(next_player_action);
        console.assert(turn_iter.done == false); // We should never be able to end.

        this.last_turn_info = turn_iter.value;
        ++this.player_turn_count;

        console.log(`NEW PLAYER TURN: ${this.player_turn_count}`);
        console.log(`Characters Positions: `);
        for(const body of this.world.bodies){
            console.log(` - ${body.body_id}: ${JSON.stringify(body.position)}`);
        }
        console.log(`Events Since Last Turn: `);
        for(const event of this.last_turn_info.events){
            console.log(` - ${event.constructor.name} { character: ${event.body_id} }`);
        }
        console.log(`Possible Actions: `);
        for(const action_id in this.last_turn_info.possible_actions){
            const action = this.last_turn_info.possible_actions[action_id];
            console.log(` - ${action.name}`);
        }
        return this.last_turn_info;
    }

    add_player_character_at_random_entry_point(){
        const entry_points = this.all_entry_points_positions;
        console.assert(entry_points);
        const position = random_sample(entry_points);
        this.add_player_character(position);
    }

    add_player_character(position){
        console.assert(this.is_walkable(position));
        const player = new Player();
        player.position = position;
        this.world.add(player);
    }

    get all_entry_points_positions(){
        return this.world._surface_tile_grid.matching_positions(tile_id => tile_id == tiles.ID.ENTRY);
    }

    get player_characters(){
        return this.world.bodies.filter(body=>body.is_player_actor);
    }

    is_walkable(game_position){
        return !this.world.is_blocked_position(game_position, tiles.is_walkable);
    }

};



