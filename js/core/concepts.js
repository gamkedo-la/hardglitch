// This file describes the core concepts that exist in the game mechanics.
// This is not a modelisation of these concept, just rules of how things
// work in the game system. For example, we can say what an "object" is,
// what rules can be applied on it and what interface it should have to work
// in our system.
// Think about it this way: code here could be reused to make another similar
// game, without being changed too much.
// We will describe what kind of entities can exist here.

export {
    World,
    Event,
    Action,
    Agent,
    Player,
    Rule,
    Object,
    Body,
};


// An action is when an Agent changes something in the world, following the
// world's rules.
class Action {

    // Apply the action, transform the world.
    // Must return events corresponding to what happened.
    execute(world, agent){
        return [];
    }
};

// Represents the record of something that happened in the past.
class Event{
    Event(agent){
        this.agent = agent;
    }
};


// Agents are entities that can take decisions and produce actions.
class Agent {

    action_points_left = 0;
    max_action_points = 0;

    objects = [];
    body = null; // TODO: consider handling more than one body for an agent (like a big boss?)

    // Decides what to do for this turn, returns an Action or null if players must decide.
    // `possible_actions` is a map of { "ActionName" : ActionType } possibles.
    // Therefore one could just instantiate an action with `new possible_actions["Move"]` etc.
    decide_next_action(possible_actions){
        throw "decide_next_action not implemented";
    }
};

// Special Agent representing the player.
class Player extends Agent {

    decide_next_action(possible_actions){
        return null; // By default, let the player decide.
    }
}

// Rules are transformations and checks that apply all the time as long
// as they exist.
class Rule {
    // TODO: add on_something for each case we want to apply rules to.

    // Returns a map of { "action name" : ActionType } this rule allows to the agent.
    // This will be called to get the full list of actions an agent can
    // do, including the ones related to the environment.
    get_actions_for(agent, world){
        return {};
    }

    // Update the world according to this rule.
    // Called once per agent after they are finished with their action (players too).
    // Returns a sequence of events resulting from changing the world.
    update_world_after_turn(world){
        return [];
    }

};

// Objects are things that have a "physical" existence, that is it can
// be located (in space or relative to another object).
// For example a body, a pen in a bag, a software in a computer in a bag.
// However objects cannot move by themselves.
class Object {

};

// We assume that the world is made of 2D grids.
// This position is one square of that grid, so all the values are integers.
class Position {
    constructor(x = 0, y = 0){
        this.x = x;
        this.y = y;
    }
    // TODO: add useful constants and functions here.

    get west() { return new Position( this.x - 1, this.y ); }
    get east() { return new Position( this.x + 1, this.y ); }
    get north() { return new Position( this.x, this.y - 1 ); }
    get south() { return new Position( this.x, this.y + 1 ); }
};

// Bodies are special entities that have "physical" existence,
// like objects, but they can move by themselves.
// Most of the time they are owned by agents.
class Body { // TODO: consider inheriting from Object?
    position = new Position();
};

// This is the world as known by the game.
// It's mainly a big container of every entities that makes the world.
class World
{
    agents = [];    // Might or might not be associated with one or several bodies.
    objects = [];   // Objects that are in the space of the world, not in other objects.
    bodies = [];    // Bodies are always in the space of the world.
    rules = [];
    player_action = null; // TODO: try to find a better way to "pass" the player action to the turn solver.

    World(){

    }

    // Automatically sort out how to store the thing being added to this world.
    add(thing){ // TODO: kill this thing with fire
        if(thing instanceof Object){
            this.objects.push(thing);
            // TODO: add here to some spatial partitionning system
        }
        else if(thing instanceof Agent){
            this.agents.push(thing);
        }
        else if(thing instanceof Body){
            this.bodies.push(thing);
            // TODO: add here to some spatial partitioning system
        }
        else if(thing instanceof Rule){
            this.rules.push(thing);
        }
        else {
            throw "Unknown type : " + typeof thing;
        }
    }

    set_player_action(action){
        console.assert(action);
        // TODO: add some checks?
        this.player_action = action;
    }

    // Returns a set of possible actions according to the current rules, for the specified agent.
    gather_possible_actions_from_rules(agent){
        console.assert(agent instanceof Agent);
        let possible_actions = {};
        for(const rule of this.rules){
            const actions_from_rule = rule.get_actions_for(agent, this);
            possible_actions = { ...possible_actions, ...actions_from_rule };
        }
        return possible_actions;
    }

    // Apply all rules to update this world according to them.
    // Should be called after each turn of an agent.
    apply_rules(){
        const events = [];
        for(const rule of this.rules){
            events.push(...(rule.update_world_after_turn(this)));
        }
        return events;
    }
};

