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
    Position,
};

let next_body_id = 0;
function new_body_id(){
    return ++next_body_id;
}

let next_actor_id = 0;
function new_actor_id(){
    return ++next_actor_id;
}


// An action is when an Actor changes something (using it's Body) in the world, following the
// world's rules.
class Action {
    constructor(id, name, description = "MISSING ACTION DESCRIPTION"){
        console.assert(typeof id === 'string');
        console.assert(typeof name === 'string');
        console.assert(typeof description === 'string');
        this.id = id;                       // Used internally to identify this Action in some special code (for example to identify special moves to bind to keyboard keys)
        this.name = name,                   // Name that will be displayed to the player.
        this.description = description;     // Description that will be displayed to the player.
    }

    // Apply the action, transform the world.
    // Must return events corresponding to what happened.
    execute(world, body){
        return [];
    }
};

// Represents the record of something that happened in the past.
class Event{

    constructor(body_id){
        console.assert(Number.isInteger(body_id)); // 0 means it's a world event
        this.body_id = body_id;
    }

    // Animation to perform when viewing this event.
    *animation(body_view){
        throw "Event animation not implemented!";
    }

};


// Actors are entities that can take decisions and produce actions.
// Think of them as the "mind" part of the Body.
// In some cases, an Actor can control several bodies. In this case the bodies
// will refer to the same Actor instance.
class Actor {
    actor_id = new_actor_id();

    // Decides what to do for this turn for a specific body, returns an Action or null if players must decide.
    // `possible_actions` is a map of { "action_id" : action_object } possibles.
    // Therefore the Action object can be used directory (for example: `possible_actions.move.execute(...)`).
    decide_next_action(body, possible_actions){
        throw "decide_next_action not implemented";
    }
};

// Special Actor representing the player.
// Any Body having this Actor will let the player chose what to do.
class Player extends Actor {

    decide_next_action(body, possible_actions){
        return null; // By default, let the player decide.
    }
}

// Rules are transformations and checks that apply all the time as long
// as they exist.
class Rule {
    // TODO: add on_something for each case we want to apply rules to.

    // Returns a map of { "action_id" : ActionType } this rule allows to the actor.
    // This will be called to get the full list of actions an actor can
    // do, including the ones related to the environment.
    get_actions_for(body, world){
        return {};
    }

    // Update the world according to this rule after a character performed an action.
    // Called once per actor after they are finished with their action (players too).
    // Returns a sequence of events resulting from changing the world.
    update_world_after_actor_turn(world, body){
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
// This position is one square of that grid, so all the values are integers, not floats.
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

    equals(other_position){
        return other_position.x == this.x && other_position.y == this.y;
    }
};



// Objects are things that have a "physical" existence, that is it can be located in the space of the game (it have a position).
// For example a body, a pen in a bag, a software in a computer in a bag.
class Object {
    position = new Position();
};

// Items are objects that cannot ever move by themselves.
// However, they can be owned by bodies and have a position in the world (like all objects).
// They provide Actions and modifiers for the body stats that equip them.
class Item extends Object {
    actions = [];
    // TODO: Action mechanisms here.
};


// Bodies are special entities that have "physical" existence and can perform action,
// like objects, but they can move by themselves.
// Each Body owns an Actor that will decide what Actions to do when it's the Body's turn.
class Body extends Object {
    body_id = new_body_id();
    actor = null; // Actor that controls this body. If null, this body cannot take decisions.
    items = []; // Items owned by this body. They don't appear in the World's list unless they are put back in the World (not owned anymore).

    ////////////////////////////////
    // Action Point System here.
    action_points_left = 0;
    max_action_points = 0;

    // TODO: replace the following functions implementations with action point system!
    // BEWARE, this is a hack to simulate being able to act once per turn.
    acted_this_turn = false;

    get can_perform_actions(){
        // Cannot perform actions if we don't have an actor to decide which action to perform.
        return this.actor && !this.acted_this_turn;
    }

    disable_further_actions(){
        this.acted_this_turn = true;
    }

    // Describe the possible positions relative to the current ones that could be reached in one step,
    // assuming there is no obstacles.
    // Should be overloaded by bodies that have limited sets of movements.
    // Returns an object: { move_id: target_position, another_move_name: another_position }
    allowed_moves(){ // By default: can go on the next square on north, south, east and west.
        return {
            move_east: this.position.east,
            move_west: this.position.west,
            move_north: this.position.north,
            move_south: this.position.south
        };
    }


};

// This is the world as known by the game.
// It's mainly a big container of every entities that makes the world.
class World
{
    // Avoid using these members directly, prefer using the functions below, if you can (sometime yuo can't).
    items = [];     // Items that are in the space of the world, not in other objects (not owned by Bodies).
    bodies = [];    // Bodies are always in the space of the world. They can be controlled by Actors.
    rules = [];     // Rules that will be applied through this game.
    player_action = null; // TODO: try to find a better way to "pass" the player action to the turn solver.


    // Adds an object to the world (a Body or an Item), setup the necessary spatial information.
    add(object){
        console.assert(object instanceof Object);
        console.assert(object.position);
        if(object instanceof Body)
            this.bodies.push(object);
        else if(object instanceof Item)
            this.items.push(thing);
        else throw "Tried to add to the World an unknown type of Object";
        // TODO: add the necessary info in the system that handles space partitionning
    }

    // Set a list of rules that should be ordered as they should be applied.
    set_rules(...rules){
        console.assert(rules instanceof Array);
        this.rules = rules;
    }

    // Set the next action for player's turn. Called when the player decided the action, set it and then run the turn solver.
    set_next_player_action(action){
        console.assert(action instanceof Action);
        // TODO: add some checks?
        this.player_action = action;
    }

    // Returns a set of possible actions according to the current rules, for the specified body.
    gather_possible_actions_from_rules(body){
        console.assert(body instanceof Body);
        console.assert(!body.actor || body.actor instanceof Actor); // If the body have an Actor to control it, then it needs to be an Actor.
        let possible_actions = {};
        for(const rule of this.rules){
            const actions_from_rule = rule.get_actions_for(body, this);
            possible_actions = { ...possible_actions, ...actions_from_rule };
        }
        return possible_actions;
    }

    // Apply all rules to update this world according to them, at the end of a character's turn.
    // Should be called after each turn of an body.
    apply_rules_end_of_characters_turn(body){
        const events = [];
        for(const rule of this.rules){
            events.push(...(rule.update_world_after_actor_turn(this, body)));
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

    // Returns true if the position given is blocked by an object (Body or Item) or a tile that blocks (wall).
    is_blocked_position(position){
        // TODO: check the tile at that position.


        if(this.body_at(position))
            return true;

        if(this.item_at(position))
            return true;

        return false;
    }

    body_at(position){
        // TODO: optimize this if necessary
        for(const body of this.bodies){
            if(body.position.equals(position))
                return body;
        }
        return null;
    }

    item_at(position){
        // TODO: optimize this if necessary
        for(const item of this.items){
            if(items.position.equals(position))
                return item;
        }
        return null;
    }



};
