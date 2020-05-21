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
    Actor,
    Player,
    Rule,
    Object,
    Body,
};

let next_body_id = 0;
function new_body_id(){
    return ++next_body_id;
}

let next_actor_id = 0;
function new_actor_id(){
    return ++next_actor_id;
}


// An action is when an Actor changes something in the world, following the
// world's rules.
class Action {

    // Apply the action, transform the world.
    // Must return events corresponding to what happened.
    execute(world, actor){
        return [];
    }
};

// Represents the record of something that happened in the past.
class Event{

    constructor(actor_id, body_id){
        console.assert(actor_id);
        console.assert(body_id);
        this.actor_id = actor_id;
        this.body_id = body_id;
    }

    // Animation to perform when viewing this event.
    *animation(body_view){
        throw "Event animation not implemented!";
    }

};


// Actors are entities that can take decisions and produce actions.
class Actor {
    actor_id = new_actor_id();

    action_points_left = 0;
    max_action_points = 0;

    // TODO: replace this with action point system!
    // BEWARE, this is a hack to simulate being able to act once per turn.
    acted_this_turn = true;
    get can_perform_actions(){
        const result = this.acted_this_turn;
        this.acted_this_turn = !this.acted_this_turn;
        return result;
    }

    objects = [];
    body = null; // TODO: consider handling more than one body for an actor (like a big boss?)

    // Decides what to do for this turn, returns an Action or null if players must decide.
    // `possible_actions` is a map of { "ActionName" : ActionType } possibles.
    // Therefore one could just instantiate an action with `new possible_actions["Move"]` etc.
    decide_next_action(possible_actions){
        throw "decide_next_action not implemented";
    }
};

// Special Actor representing the player.
class Player extends Actor {

    decide_next_action(possible_actions){
        return null; // By default, let the player decide.
    }
}

// Rules are transformations and checks that apply all the time as long
// as they exist.
class Rule {
    // TODO: add on_something for each case we want to apply rules to.

    // Returns a map of { "action name" : ActionType } this rule allows to the actor.
    // This will be called to get the full list of actions an actor can
    // do, including the ones related to the environment.
    get_actions_for(actor, world){
        return {};
    }

    // Update the world according to this rule after a character performed an action.
    // Called once per actor after they are finished with their action (players too).
    // Returns a sequence of events resulting from changing the world.
    update_world_after_actor_turn(world, actor){
        return [];
    }

    // Update the world according to this rule at the beginning of each game "Turn".
    // Called once per actor after they are finished with their action (players too).
    // Returns a sequence of events resulting from changing the world.
    update_world_at_the_beginning_of_game_turn(world){
        return [];
    }

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



// Objects are things that have a "physical" existence, that is it can
// be located (in space or relative to another object).
// For example a body, a pen in a bag, a software in a computer in a bag.
class Object {
    position = new Position();
};

// Items are objects that cannot ever move by themselves.
// However, they can be owned by bodies and have a position in the world (like all objects).
// They provide Actions and modifiers for the body stats that equip them.
class Item extends Object {
    actions = [];
};




// Bodies are special entities that have "physical" existence and can perform action,
// like objects, but they can move by themselves.
// Most of the time they are owned by actors.
class Body extends Object { // TODO: consider inheriting from Object?
    body_id = new_body_id();
};

// This is the world as known by the game.
// It's mainly a big container of every entities that makes the world.
class World
{
    items = [];     // Items that are in the space of the world, not in other objects.
    bodies = [];    // Bodies are always in the space of the world. They can be controlled by Actors.
    rules = [];
    player_action = null; // TODO: try to find a better way to "pass" the player action to the turn solver.

    World(){

    }

    // Automatically sort out how to store the thing being added to this world.
    add(thing){ // TODO: kill this thing with fire
        if(thing instanceof Item){
            this.items.push(thing);
            // TODO: add here to some spatial partitionning system
        }
        else if(thing instanceof Actor){
            this.actors.push(thing);
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

    // Returns a set of possible actions according to the current rules, for the specified actor.
    gather_possible_actions_from_rules(actor){
        console.assert(actor instanceof Actor);
        let possible_actions = {};
        for(const rule of this.rules){
            const actions_from_rule = rule.get_actions_for(actor, this);
            possible_actions = { ...possible_actions, ...actions_from_rule };
        }
        return possible_actions;
    }

    // Apply all rules to update this world according to them, at the end of a character's turn.
    // Should be called after each turn of an actor.
    apply_rules_end_of_characters_turn(actor){
        const events = [];
        for(const rule of this.rules){
            events.push(...(rule.update_world_after_actor_turn(this, actor)));
        }
        return events;
    }

    // Apply all rules to update this world according to them, at the end of a game turn.
    // Should be at the beginning of each game turn.
    apply_rules_beginning_of_game_turn(){
        const events = [];
        for(const rule of this.rules){
            events.push(...(rule.update_world_at_the_beginning_of_game_turn(this)));
        }
        return events;
    }
};
