// This file contains the action system and how actions are "solved".
//

export {
    execute_turns_v2 as execute_turns,
    turn_sequence,
    PlayerTurn,
    VisionUpdate,
    NewTurn,
};

import * as debug from "../system/debug.js";
import * as concepts from "./concepts.js";
import { Body as Character } from "./concepts.js";

import * as audio from "../system/audio.js"; // FIXME: this file should never be exposed to this.
import { config } from "../game-config.js";
import { wait } from "../system/animation.js";

// Data needed for the the "view" part of the game code to:
// - know what happened since last character's turn;
// - know what that player characters can and cannot do for this turn;
class PlayerTurn {

    constructor(turn_id, world, player_character, possible_actions){
        debug.assertion(()=>Number.isInteger(turn_id) && turn_id > 0);
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>!player_character || (player_character instanceof Character && player_character.is_player_actor));
        debug.assertion(()=>!possible_actions || possible_actions instanceof Object);

        this.turn_id = turn_id;                     // Number of world turns.
        this.world = world;                         // The world we need an action for.
        this.player_character = player_character;   // Character controlled by the player for this turn.
        this.possible_actions = possible_actions;   // Actions that the player could take.
    }
};

// Gives the order of turns of characters.
function ordered_characters(world){
    debug.assertion(()=>world instanceof concepts.World);
    return world.bodies.sort((left, right)=>{
        return right.is_player_actor - left.is_player_actor; // Put the player characters first in turn, always.
    });
}

// Return the sequence of ids of characters per turn for this turn and for the next.
function turn_sequence(world){
    debug.assertion(()=>world instanceof concepts.World);
    const character_sequence = ordered_characters(world);
    const this_turn_ids = [];
    const next_turn_ids = [];
    for(const character of character_sequence){
        if(character.can_perform_actions){
            this_turn_ids.push(character.id);
        } else if(character.can_perform_actions_next_turn){
            next_turn_ids.push(character.id);
        }
    }
    return { this_turn_ids, next_turn_ids };
}


// Event: New game turn begins!
class NewTurn extends concepts.Event {
    constructor(turn_id, world){
        super({
            description: `======== New Game Turn: ${turn_id} ========`
        });
        this.allow_parallel_animation = true;
        this.turn_id = turn_id;
        this.turn_ids_sequence = turn_sequence(world);
    }

    get focus_positions() { return []; }

    get is_world_event() { return true; }

    *animation(game_view){
        // TODO: make this code external from this file.
        game_view._last_turn_ids_sequence = this.turn_ids_sequence;
        game_view.ui.timeline.request_refresh(this.turn_ids_sequence);
        yield* wait(1000 / 8);
        if(config.enable_turn_sound)
            audio.playEvent('newCycle');
    }
};

class VisionUpdate extends concepts.Event {
    constructor(character, world){
        super();
        this.allow_parallel_animation = true;
        this.character_position = character.position;
        this.turn_ids_sequence = turn_sequence(world);
    }
    get focus_positions() { return [ this.character_position ]; }

    get is_world_event() { return true; }

    *animation(game_view){
        // TODO: make this code external from this file.
        game_view._last_turn_ids_sequence = this.turn_ids_sequence;
        game_view.ui.timeline.request_refresh(this.turn_ids_sequence);
    }

    force_skip_animation = true;
};

// Generates a sequence of character's bodies that can perform actions now.
// The filtered bodies can appear only once each.
// This is basically a "Turn Phase".
// TODO: specify an order! maybe depending on stats? initiative points?
function* characters_that_can_act_now(world){
    debug.assertion(()=>world instanceof concepts.World);

    let character_body_list = ordered_characters(world);
    while(character_body_list.length > 0){
        const character_body = character_body_list.shift(); // Pop from the front
        debug.assertion(()=>character_body instanceof Character);
        if (character_body.can_perform_actions) {
            yield character_body;
            character_body_list.push(character_body); // Push back at the end
            if(world.has_entity_list_changed){
                // Removes characters that have been removed - the other characters will be taken into account next turn.
                character_body_list = character_body_list.filter(body=> ordered_characters(world).includes(body));

                world.has_entity_list_changed = false; // OK changes have been taken into account.
            }
        }
    }
}


//////////////////////////////////////////////////////
// NOTES about the Turn System - This is an alternative one:
// - Each game's "Turn", we go through all the bodies and ask their actors to take decitions on actions to perform with that character.
// - Each character can play actions until either:
//    - they have 0 or less Action Points, or
//    - they decide to skip the turn (reserving AP for next turn);
// - A "Turn" finishes when all characters (bodies) have finished their turn.
//
// Consequence: if a character have enough action points to perform several actions per turn,
//    it means they can act more times than the other characters that cannot.
//    This kind of simulates "speed".
//    Also: skipping a turn will reserve AP for the next turn.
//////////////////////////////////////////////////////

// This is the function defining how each character's turn is processed. Basically, a "turn solver".
// Returns a generator of the sequence of events since last time the player was requested to act,
// produced through the turns/actions of the different bodies.
function* execute_turns_v2(world) {
    debug.assertion(()=>world instanceof concepts.World);

    function* request_player_action(character, possible_actions) { // Give back control to the player, request them to set an action in the World object.
        const player_action = yield new PlayerTurn(world.turn_id, world, character, possible_actions);
        return player_action;
    }

    function* update_characters_views(current_character){
        const characters = world.bodies;
        current_character.update_perception(world);
        characters.forEach(character => {
            if(character !== current_character
            && character._need_perception_update){
                character.update_perception(world);
            }
        });
        yield new VisionUpdate(current_character, world);
    }

    while(true){ // This is a virtually infinite sequence of turns.

        // Make sure there are characters ready to do act!
        while( world.is_finished         // Game is over
            || world.bodies.length == 0){ // No characters in game?
            // In this situation, do nothing more unless the rest of the game resolve the situation:
            // let the player take control, but don't allow or handle any action.
            yield* request_player_action(null, []);
            continue; // Skip to the beginning of next turn.
        }

        //////////////////////////////////////////////////
        // NEW TURN STARTS HERE: CYCLE THROUGH EACH CHARACTER WHICH CAN ACT THIS TURN
        //////////////////////////////////////////////////
        ++world.turn_id;
        yield new NewTurn(world.turn_id, world);

        // Apply the rules of the world that must happen at each Turn (before we begin doing characters turns).
        yield* world.apply_rules_beginning_of_game_turn();

        const looping_character_sequence = characters_that_can_act_now(world);

        for(const character of looping_character_sequence){
            debug.assertion(()=>character instanceof Character);

            /////////////////////////////////////////////////////////////
            // NEW CHARACTER TURN START HERE: CHOSE ACTIONS UNTIL AP <= 0 OR SKIP TURN!
            /////////////////////////////////////////////////////////////

            const actor = character.actor;
            debug.assertion(()=>actor instanceof concepts.Actor); // At this point we have to have a decision maker.

            while(character.can_perform_actions){ // Characters can take actions until they don't have enough action poitns OR until they skip the turn.

                let player_character_exists = true;
                let action = null;
                while (!action && player_character_exists) { // Update the current possible actions and request an action from the character
                    // until we obtain a usable action.
                    yield* update_characters_views(character); // Make sure decisions are taken relative to an up to date view of the world.
                    const possible_actions = world.gather_possible_actions_from_rules(character);
                    action = actor.decide_next_action(world, character, possible_actions);

                    if (action == null) { // No decision taken? Only players can hesitate!!!!
                        // This is a player: let the player decide what to do (they will store the action in the world state).
                        action = yield* request_player_action(character, possible_actions); // Give back the control and the list of events done since last turn.
                        if (!action) { // Still no action? OK we need to update the world.
                            // Update the world according to it's rules, in case someone is dead etc.
                            const rules_events = world.apply_rules_end_of_characters_turn(character);
                            yield* rules_events;
                            // At this point, it is possible that the player character was destroyed.
                            // In this case we must continue to the next character.
                            if (!world.find_body(character.id))
                                player_character_exists = false;
                        }
                    }
                }

                if (!player_character_exists) // The player character disappeared while selection was occuring (through events or through edition of the world).
                    continue; // Just pass to the next character.

                debug.assertion(()=>action instanceof concepts.Action);// Ath this point, an action MUST have been defined (even if it's just Wait)

                // Apply the selected action.
                const action_events = character.perform_action(action, world);
                yield* action_events;

                // In all cases:
                // Update the world according to it's rules.
                const rules_events = world.apply_rules_end_of_characters_turn(character);
                yield* rules_events;

                // Keep the view of the world up to date after having performed the action and it's consequences.
                if (action_events.length > 0 || rules_events.length > 0) {
                    yield* update_characters_views(character);
                }

            }

        }
    }
}