// This file contains the action system and how actions are "solved".
//

export {
    execute_turns_until_players_turn,
    PlayerTurn,
};

import * as concepts from "./concepts.js";
import { Body as Character } from "./concepts.js";

// Data needed for the player (or the "view" part of the game code) to:
// - know what happened since last player turn;
// - know what that player actor can and cannot do for this turn;
class PlayerTurn
{
    constructor(turn_id, phase_id, world, events, player_character, possible_actions){
        console.assert(Number.isInteger(turn_id) && turn_id > 0);
        console.assert(Number.isInteger(phase_id) && phase_id > 0);
        console.assert(world instanceof concepts.World);
        console.assert(events instanceof Array);
        console.assert(!player_character || (player_character instanceof Character && player_character.is_player_actor));
        console.assert(possible_actions instanceof Object);

        this.turn_id = turn_id;                     // Number of world turns.
        this.turn_phase_id = phase_id;              // Number of phases in the turn.
        this.world = world;                         // The world we need an action for.
        this.events = events;                       // Passed events since last time we needed a player action.
        this.player_character = player_character;   // Character controlled by the player for this turn.
        this.possible_actions = possible_actions;   // Actions that the player could take.
    }

    clear_events(){
        this.events = [];
    }
};


//////////////////////////////////////////////////////
// NOTES about the Turn System:
// - Each game's "Turn", we go through all the bodies and ask their actors to take decitions on actions to perform with that character.
// - A "Turn Phase" is when we go through all bodie's bodies once, and if they can act (if they have enough action points),
//   we ask them to perform one action each.
// - A "Turn" finishes when all characters (bodies) cannot act anymore (no more action points)
// Consequence: if a character have enough action points to perform several actions per turn,
//    it means they can act more times than the other characters that cannot.
//    This kind of simulates "speed".
//////////////////////////////////////////////////////

// Event: New game turn begins!
class NewTurn extends concepts.Event {
    constructor(turn_id){
        super({
            description: `======== New Game Turn: ${turn_id} ========`
        });
        this.turn_id = turn_id;
    }

    get focus_positions() { return []; }

    get is_world_event() { return true; }

    *animation(){}
};

// Event: New turn phase begins!
class NewTurnPhase extends concepts.Event {
    constructor(phase_id){
        super({
            description: `---- New Turn Phase: ${phase_id} ----`
        });
        this.turn_phase_id = phase_id;
    }

    get focus_positions() { return []; }

    get is_world_event() { return true; }

    *animation(){}
};


// This is the function defining how each character's turn is processed. Basically, a "turn solver".
// Returns a generator of the sequence of events since last time the player was requested to act,
// produced through the turns/actions of the different bodies.
function* execute_turns_until_players_turn(world) {
    console.assert(world instanceof concepts.World);

    let turn_id = 0;
    let turn_phase_id = 0;

    let events_since_last_player_action = []; // Events accumulated since last player's turn.

    function* request_player_action(character, possible_actions) { // Give back control to the player, request them to set an action in the World object.
        const player_action = yield new PlayerTurn(turn_id, turn_phase_id, world, events_since_last_player_action, character, possible_actions);
        events_since_last_player_action = []; // Start a new sequence of events until we reach next character's turn.
        return player_action;
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
        // NEW TURN STARTS HERE: CYCLE THROUGH EACH TURN PHASE, THROUGH EACH CHARACTER PER PHASE
        //////////////////////////////////////////////////
        ++turn_id;
        events_since_last_player_action.push(new NewTurn(turn_id));

        // Apply the rules of the world that must happen at each Turn (before we begin doing characters turns).
        events_since_last_player_action.push(...world.apply_rules_beginning_of_game_turn());

        const looping_character_sequence = loop_characters_until_end_of_turn(world); // This sequence includes turn phases, so one character with enough action points left can occur more than one time.

        for(const character_or_event of looping_character_sequence){ // Bodies can act several times a turn, but once a phase.
                                                                 // There is a new turn phase if after cycling all bodies, some still have action points left.

            if(character_or_event instanceof concepts.Event){ // Ok we are notified that a new turn event starts now.
                if(character_or_event instanceof NewTurnPhase)
                    turn_phase_id = character_or_event.turn_phase_id;
                events_since_last_player_action.push(character_or_event); // Just keep track that this happened.
                continue;
            }

            const character = character_or_event; // Now we know it have to be a character.
            console.assert(character instanceof Character);
            /////////////////////////////////////////////////////////////
            // NEW CHARACTER TURN PHASE START HERE: CHOSE ONE ACTION!
            /////////////////////////////////////////////////////////////

            const actor = character.actor;
            console.assert(actor instanceof concepts.Actor); // At this point we have to have a decision maker.

            let action = null;
            while(!action){ // Update the current possible actions and request an action from the character
                // until we obtain a usable action.
                character.update_perception(world); // Make sure decisions are taken relative to an up to date view of the world.
                const possible_actions = world.gather_possible_actions_from_rules(character);
                action = actor.decide_next_action(possible_actions);

                if(action == null){ // No decision taken? Only players can hesitate!!!!
                    // This is a player: let the player decide what to do (they will store the action in the world state).
                    action = yield* request_player_action(character, possible_actions); // Give back the control and the list of events done since last turn.
                }
            }

            console.assert(action instanceof concepts.Action);// Ath this point, an action MUST have been defined (even if it's just Wait)

            // Apply the selected action.
            const action_events = character.perform_action(action, world);
            events_since_last_player_action.push(...action_events);

            // In all cases:
            // Update the world according to it's rules.
            const rules_events = world.apply_rules_end_of_characters_turn(character);
            events_since_last_player_action.push(...rules_events);

            // Keep the view of the world up to date after having performed the action and it's consequences.
            character.update_perception(world);
        }
    }
}

// Generates a sequence of character's bodies that can perform actions now.
// The filtered bodies can appear only once each.
// This is basically a "Turn Phase".
// TODO: specify an order! maybe depending on stats? initiative points?
function *characters_that_can_act_now(world){
    console.assert(world instanceof concepts.World);
    for(const character_body of world.bodies){
        console.assert(character_body instanceof Character);
        if (character_body.can_perform_actions) {
            yield character_body;
        }
    };
}


// Generates a sequence of characters (bodies) until no character can act for this turn.
function *loop_characters_until_end_of_turn(world){
    console.assert(world instanceof concepts.World);
    let turn_phase = 0;
    let some_characters_can_still_act = false;
    do{
        // New Turn Phase (if any actor can act)
        yield new NewTurnPhase(++turn_phase);

        some_characters_can_still_act = false;
        for(const character of characters_that_can_act_now(world)){
            yield character;
            some_characters_can_still_act = some_characters_can_still_act || character.can_perform_actions;
        }

    } while(some_characters_can_still_act);
    // No characters could act for this turn: END OF TURN!
}


