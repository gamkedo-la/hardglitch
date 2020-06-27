// This file contains the action system and how actions are "solved".
//

export { execute_turns_until_players_turn, PlayerTurn };

import * as concepts from "./concepts.js";

// Data needed for the player (or the "view" part of the game code) to:
// - know what happened since last player turn;
// - know what that player actor can and cannot do for this turn;
class PlayerTurn
{
    constructor(world, events, player_body, possible_actions){
        this.world = world;                         // The world we need an action for.
        this.events = events;                       // Passed events since last time we needed a player action.
        this.player_body = player_body;             // Body controlled by the player for this turn.
        this.possible_actions = possible_actions;   // Actions that the player could take.
    }

    clear_events(){
        this.events = [];
    }
};


//////////////////////////////////////////////////////
// NOTES about the Turn System:
// - Each game's "Turn", we go through all the bodies and ask their actors to take decitions on actions to perform with that body.
// - A "Turn Phase" is when we go through all bodie's bodies once, and if they can act (if they have enough action points),
//   we ask them to perform one action each.
// - A "Turn" finishes when all characters (bodies) cannot act anymore (no more action points)
// Consequence: if a character have enough action points to perform several actions per turn,
//    it means they can act more times than the other characters that cannot.
//    This kind of simulates "speed".
//////////////////////////////////////////////////////

// Event: New game turn begins!
class NewTurn extends concepts.Event {
    constructor(){
        super(0); // Body_id 0 is used for the World events.
    }
};

// Event: New turn phase begins!
class NewTurnPhase extends concepts.Event {
    constructor(){
        super(0); // Body_id 0 is used for the World events.
    }
};


// This is the function defining how each character's turn is processed. Basically, a "turn solver".
// Returns a generator of the sequence of events since last time the player was requested to act,
// produced through the turns/actions of the different bodies.
function* execute_turns_until_players_turn(world) {
    console.assert(world instanceof concepts.World);

    let events_since_last_player_action = []; // Events accumulated since last player's turn.

    function* request_player_action(body, possible_actions) { // Give back control to the player, request them to set an action in the World object.
        const player_action = yield new PlayerTurn(world, events_since_last_player_action, body, possible_actions);
        events_since_last_player_action = []; // Start a new sequence of events until we reach next character's turn.
        return player_action;
    }

    while(true){ // This is a virtually infinite sequence of turns.
        //////////////////////////////////////////////////
        // NEW TURN STARTS HERE: CYCLE THROUGH EACH TURN PHASE, THROUGH EACH CHARACTER PER PHASE
        //////////////////////////////////////////////////
        events_since_last_player_action.push(new NewTurn());

        // Make sure there are characters ready to do act!
        while( world.is_finished         // Game is over
            || world.bodies.length == 0){ // No characters in game?
            // In this situation, do nothing more unless the rest of the game resolve the situation:
            // let the player take control, but don't allow or handle any action.
            yield* request_player_action(null, []);
            continue; // Skip to the beginning of next turn.
        }

        // Apply the rules of the world that must happen at each Turn (before we begin doing characters turns).
        events_since_last_player_action.push(...world.apply_rules_beginning_of_game_turn());

        let looping_character_sequence = loop_characters_until_end_of_turn(world); // This sequence includes turn phases, so one character with enough action points left can occur more than one time.

        for(const body_or_event of looping_character_sequence){ // Bodies can act several times a turn, but once a phase.
                                                                 // There is a new turn phase if after cycling all bodies, some still have action points left.

            if(body_or_event instanceof NewTurnPhase){ // Ok we are notified that a new Turn Phase starts now.
                events_since_last_player_action.push(body_or_event); // Just keep track that this happened.
                continue;
            }

            const character_body = body_or_event; // Now we know it have to be a character's body.
            console.assert(character_body instanceof concepts.Body);
            /////////////////////////////////////////////////////////////
            // NEW CHARACTER TURN PHASE START HERE: CHOSE ONE ACTION!
            /////////////////////////////////////////////////////////////

            const actor = character_body.actor;
            console.assert(actor instanceof concepts.Actor); // At this point we have to have a decision maker.

            let action = null;
            while(!action){ // Update the current possible actions and request an action from the character
                            // until we obtain a usable action.
                const possible_actions = world.gather_possible_actions_from_rules(character_body);
                action = actor.decide_next_action(possible_actions);

                if(action == null){ // No decision taken? Only players can hesitate!!!!
                    // This is a player: let the player decide what to do (they will store the action in the world state).
                    action = yield* request_player_action(character_body, possible_actions); // Give back the control and the list of events done since last turn.
                }
            }

            console.assert(action instanceof concepts.Action);// Ath this point, an action MUST have been defined (even if it's just Wait)

            // Apply the selected action.
            const action_events = concepts.perform_action(action, character_body, world);
            events_since_last_player_action.push(...action_events);

            // In all cases:
            // Update the world according to it's rules.
            const rules_events = world.apply_rules_end_of_characters_turn(character_body);
            events_since_last_player_action.push(...rules_events);
        }
    }
}

// Generates a sequence of character's bodies that can perform actions now.
// The filtered bodies can appear only once each.
// This is basically a "Turn Phase".
// TODO: specify an order! maybe depending on stats? initiative points?
function *characters_that_can_act_now(world){
    console.assert(world instanceof concepts.World);
    for(const body of world.bodies){
        if (body.can_perform_actions) {
            yield body;
        }
    };
}


// Generates a sequence of characters (bodies) until no character can act for this turn.
function *loop_characters_until_end_of_turn(world){
    console.assert(world instanceof concepts.World);
    while(true){
        // New Turn Phase (if any actor can act)
        yield new NewTurnPhase();
        let some_characters_can_act = false;
        for(const character_body of characters_that_can_act_now(world)){
            yield character_body;
            some_characters_can_act = some_characters_can_act && character_body.can_perform_actions;
        }
        if(!some_characters_can_act) // No character could act last phase cycle.
            break;
    }
    // No characters could act for this turn: END OF TURN!
}


