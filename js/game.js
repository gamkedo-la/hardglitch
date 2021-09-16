// This files provie the abstract representation of a game
// and how it is setup by default.

export { Game }

import * as debug from "./system/debug.js";
import * as concepts from "./core/concepts.js";
import * as turns from "./core/action-turn.js";
import { random_int, random_sample } from "./system/utility.js";
import * as tiles from "./definitions-tiles.js";
import { is_blocked_position, grid_ID, is_valid_world } from "./definitions-world.js";
import { Character } from "./core/character.js";
import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";

// Abstract but complete representation of a game.
// Create this object for each new game.
// Make it visible using a GameView. See GameSession.
class Game {
    turn_info = null;

    constructor(world, player_character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>is_valid_world(world));
        debug.assertion(()=>player_character === undefined || player_character instanceof Character)
        this.world = world;
        this.world._update_entities_locations();

        // Prepare the game turns to be ready to play (player's turn)
        this.add_player_character_if_none(player_character);
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
            debug.log(`Player Action: ${next_player_action.name}`);

        debug.log(`SOLVING TURNS ...`);
        while(true){
            const turn_iter = this.__turn_sequence.next(next_player_action);
            debug.assertion(()=>turn_iter.done == false); // We should never be able to end.
            debug.assertion(()=>turn_iter.value);
            next_player_action = undefined; // Only push the player action once.

            if(turn_iter.value instanceof concepts.Event){
                const event = turn_iter.value;
                // debug.log(`-> ${event.constructor.name}: ${event.description}` ); // commented for letting the game play faster
                yield event;
            } else if(turn_iter.value instanceof turns.PlayerTurn){
                this.turn_info = turn_iter.value;
                break;
            } else {
                throw "Something is wrong with the turn solver!";
            }
        }

        this.world = this.turn_info.world;

        debug.log(`NEW PLAYER TURN`);
        // debug.log(`Possible Actions: `);
        // for(const action_id in this.turn_info.possible_actions){
        //     const action = this.turn_info.possible_actions[action_id];
        //     debug.log(` - ${action.name}`);
        // }
        return this.turn_info;
    }

    add_player_character_if_none(player_character){
        if(this.world.player_characters.length > 0)
            return;

        return this.add_player_character_at_random_entry_point(player_character);
    }

    add_player_character_at_random_entry_point(player_character){
        const entry_points = this.all_entry_points_positions;
        debug.assertion(()=>entry_points);
        const position = random_sample(entry_points);
        if(position){
            this.add_player_character(position, player_character);
        } else {
            debug.warn("Could not find an entry point for the player character! - Force place it somewhere safe.");
            const random_position = () => new concepts.Position({ x: random_int(0, this.world.width-1), y: random_int(0, this.world.height-1)});
            let attempts = 64;
            while(attempts-- > 0){
                const pos = random_position()
                if(this.is_safely_walkable(pos)){
                    this.add_player_character(pos, player_character);
                    return;
                }
            }
            debug.warn("Could not find a safe place, so inserting it somewhere impossible.");
            this.add_player_character(random_position(), player_character, true);
        }
    }

    add_player_character(position, player_character, force=false){
        debug.assertion(()=>player_character === undefined || player_character instanceof Character);
        debug.assertion(()=>force || this.is_safely_walkable(position));
        const player = player_character ? player_character : new GlitchyGlitchMacGlitchy();
        player.skip_turn = true;
        player.position = position;

        // Make sure we don't keep crucial items from before as crucial for this new level.
        delete player.drops;
        delete player.drops_are_crucial;
        player.inventory.stored_items.forEach(item => {
            if(item instanceof concepts.Item){
                delete item.is_crucial;
                delete item.drops_are_crucial;
            }
        });

        this.world.add_entity(player);
    }

    get all_entry_points_positions(){
        return this.world.grids[grid_ID.surface].matching_positions(tile_id => tile_id == tiles.ID.ENTRY);
    }

    get player_characters(){
        return this.world.bodies.filter(body=>body.is_player_actor);
    }

    is_walkable(game_position){
        return !is_blocked_position(this.world, game_position, tiles.is_walkable);
    }

    is_safely_walkable(game_position){
        return !is_blocked_position(this.world, game_position, tiles.is_safely_walkable);
    }

    get is_finished(){
        return this.world.is_finished;
    }

};



