// This files provie the abstract representation of a game
// and how it is setup by default.

export { Game }

import * as concepts from "./core/concepts.js";
import * as turns from "./core/action-turn.js";
import { random_sample } from "./system/utility.js";
import * as tiles from "./definitions-tiles.js";
import { sprite_defs } from "./game-assets.js";
import { Character, CharacterStats } from "./core/character.js";

class Player extends Character {
    assets = {
        graphics : {
            sprite_def : sprite_defs.player,
        }
    };

    constructor(){
        super("\"Glitch\"", new CharacterStats());
        this.actor = new concepts.Player();
    }
}

// Abstract but complete representation of a game.
// Create this object for each new game.
// Make it visible using a GameView.
class Game {
    turn_info = null;

    constructor(world){
        console.assert(world instanceof concepts.World);
        this.world = world ? world : new concepts.World();

        // Prepare the game turns to be ready to play (player's turn)
        this.add_player_character_at_random_entry_point();
        this.__turn_sequence = turns.execute_turns(this.world);

        // Make sure we begin at a player's turn.
        const generator = this.update_until_player_turn();
        let waitforit = generator.next();
        while(!waitforit.done) waitforit = generator.next();
    }

    // Updates the turns until we reach the next player's turn (whateve the character player controlled by the player).
    // next_player_action must either be an Action that have been selected by the player to play,
    // or null (or undefined) in which case:
    // - if we were not at a player's turn, the turns will be processed until we do;
    // - if we were already at a player's turn, no turn will proceed but the possible actions will be re-evaluated.
    // So calling this function with no argument is useful when we change the world and want the rules to update what the new state.
    *update_until_player_turn(next_player_action) {
        if(next_player_action)
            console.log(`Player Action: ${next_player_action.name}`);

        console.log(`SOLVING TURNS ...`);
        while(true){
            const turn_iter = this.__turn_sequence.next(next_player_action);
            console.assert(turn_iter.done == false); // We should never be able to end.
            console.assert(turn_iter.value);
            next_player_action = undefined; // Only push the player action once.

            if(turn_iter.value instanceof concepts.Event){
                const event = turn_iter.value;
                console.log(`-> ${event.constructor.name}: ${event.description}` );
                yield event;
            } else if(turn_iter.value instanceof turns.PlayerTurn){
                this.turn_info = turn_iter.value;
                break;
            } else {
                throw "Something is wrong with the turn solver!";
            }
        }

        console.log(`NEW PLAYER TURN`);
        console.log(`Possible Actions: `);
        for(const action_id in this.turn_info.possible_actions){
            const action = this.turn_info.possible_actions[action_id];
            console.log(` - ${action.name}`);
        }
        return this.turn_info;
    }

    add_player_character_at_random_entry_point(){
        const entry_points = this.all_entry_points_positions;
        console.assert(entry_points);
        const position = random_sample(entry_points);
        this.add_player_character(position);
    }

    add_player_character(position){
        console.assert(this.is_safely_walkable(position));
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

    is_safely_walkable(game_position){
        return !this.world.is_blocked_position(game_position, tiles.is_safely_walkable);
    }

};



