// This file contains the action system and how actions are "solved".
//

export { execute_turns_until_players_turn, PlayerTurn };

import * as concept from "./concepts.js";

// Data needed for the player (or the "view" part of the game code) to:
// - know what happened since last player turn;
// - know what that player agent can and cannot do for this turn;
class PlayerTurn
{
    constructor(world, events, player_agent, possible_actions){
        this.world = world;                         // The world we need an action for.
        this.events = events;                       // Passed events since last time we needed a player action.
        this.player_agent = player_agent;           // Agent that represent the player for this turn.
        this.possible_actions = possible_actions;   // Actions that the player could take.
    }

    clear_events(){
        this.events = [];
    }
};



//////////////////////////////////////////////////////
// NOTES about the Turn System:
// - Each game's "Turn", we go through all the bodies and ask their agents to take decitions on actions to perform with that body.
// - A "Turn Phase" is when we go through all bodie's agents once, and if they can act (if they have enough action points),
//   we ask them to perform one action each.
// - A "Turn" finishes when all characters cannot act anymore (no )
// Consequence: if a character have enough action points to perform several actions per turn,
//    it means they can act more times than the other characters that cannot.
//    This kind of simulates "speed".
//////////////////////////////////////////////////////


// This is the function defining how each character's turn is processed. Basically, a "turn solver".
// Returns a generator of the sequence of events since last time the player was requested to act,
// produced through the turns/actions of the different agents.
function* execute_turns_until_players_turn(world) {
    console.assert(world instanceof concept.World);

    let events_since_last_player_action = []; // Events accumulated since last player's turn.

    function* request_player_action(agent, possible_actions) { // Give back control to the player, request them to set an action in the World object.
        yield new PlayerTurn(world, events_since_last_player_action, agent, possible_actions);
        events_since_last_player_action = []; // Start a new sequence of events until we reach next character's turn.
    }

    while(true){ // This is a virtually infinite sequence of turns.
        //////////////////////////////////////////////////
        // NEW TURN STARTS HERE: CYCLE THROUGH EACH TURN PHASE, THROUGH EACH CHARACTER PER PHASE
        //////////////////////////////////////////////////

        // Make sure there are agents ready to do act!
        if(world.agents.length == 0){ // No agents?
            // In this situation, let the player take control, but don't allow any action.
            yield* request_player_action(null, []);
            continue; // Skip to the beginning of next turn.
        }

        // Apply the rules of the world that must happen at each Turn (before we begin doing characters turns).
        events_since_last_player_action.push(...world.apply_rules_beginning_of_game_turn());

        let looping_agent_sequence = loop_agents_until_end_of_turn(world); // This sequence includes turn phases, so one character with enough action points left can occur more than one time.

        for(const agent of looping_agent_sequence){ // Agents can act several times a turn, but once a phase.
                                                  // There is a new turn phase if after cycling all agents, some still have action points left.
            console.assert(agent instanceof concept.Agent);
            /////////////////////////////////////////////////////////////
            // NEW CHARACTER TURN PHASE START HERE: CHOSE ONE ACTION!
            /////////////////////////////////////////////////////////////

            const possible_actions = world.gather_possible_actions_from_rules(agent);
            let action = agent.decide_next_action(possible_actions);

            if(action == null){ // No decision taken? Only players can hesitate!!!!
                // This is a player: let the player decide what to do (they will store the action in the world state).
                yield* request_player_action(agent, possible_actions); // Give back the control and the list of events done since last turn.
                action = world.player_action; // Extract the player action from the world state.
            }

            console.assert(action); // Ath this point, an action MUST have been defined (even if it's just Wait)
            console.log(`ACTION: ${action.constructor.name}`);
            // Apply the selected action.
            const action_events = action.execute(world, agent);
            events_since_last_player_action.push(...action_events);

            // Update the world according to it's rules.
            const rules_events = world.apply_rules_end_of_characters_turn(agent);
            events_since_last_player_action.push(...rules_events);
        }
    }
}


// Generates a sequence of agents that can perform actions now.
// The filtered agents can appear only once each.
// This is basically a "Turn Phase".
// TODO: specify an order! maybe depending on stats?
function *agents_that_can_act_now(world){
    console.assert(world instanceof concept.World);
    for(const agent of world.agents){
        if (agent.can_perform_actions) {
            yield agent;
        }
    };
}


// Generates a sequence of agents until no agents can act for this turn.
function *loop_agents_until_end_of_turn(world){
    console.assert(world instanceof concept.World);
    let count_agents_that_acted = 0;
    do{
        count_agents_that_acted = 0;
        // New Turn Phase (if any agent can act)
        for(const agent of agents_that_can_act_now(world)){
            yield agent;
            ++count_agents_that_acted;
        }
    } while(count_agents_that_acted > 0);
    // No agents could act for this turn: END OF TURN!
}


