// This file describes the core concepts that exist in the game mechanics.
// This is not a modelisation of these concept, just rules of how things
// work in the game system. For example, we can say what an "element" is,
// what rules can be applied on it and what interface it should have to work
// in our system.
// Think about it this way: code here could be reused to make another similar
// game, without being changed too much.
// We will describe what kind of entities can exist here.

import { is_number } from "../system/utility.js";
import { Grid } from "../system/grid.js";

export {
    World,
    Event,
    Action,
    Actor,
    Player,
    Rule,
    Element,
    Body,
    Position,
    perform_action,
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
    constructor(id, name, target_position, description = "MISSING ACTION DESCRIPTION"){
        console.assert(typeof id === 'string');
        console.assert(target_position instanceof Position);
        console.assert(typeof name === 'string');
        console.assert(typeof description === 'string');
        this.id = id;                       // Used internally to identify this Action in some special code (for example to identify special moves to bind to keyboard keys)
        this.target_position = target_position; // Position of the target of this action. Could refer to the acting character, another character, an item or a tile at that position.
        this.name = name,                   // Name that will be displayed to the player.
        this.description = description;     // Description that will be displayed to the player.
    }

    // Apply the action, transform the world.
    // Must return events corresponding to what happened.
    execute(world, body){
        return [];
    }
};

// Properly performs an action after having spent the action points from the body etc.
// Returns events resulting from performing the action.
function perform_action(action, body, world){
    // TODO: Spend the action points etc. HERE
    body.disable_further_actions(); // TEMPORARY/TODO: REPLACE THIS BY PROPER ACTION POINT SPENDING

    // Then execute the action:
    return action.execute(action, body);
}

// Represents the record of something that happened in the past.
class Event{
    allow_parallel_animation = false; // Will be played in parallel with other parallel animations if true, will be animated alone otherwise.

    constructor(body_id, options){
        console.assert(Number.isInteger(body_id)); // 0 means it's a world event
        this.body_id = body_id;
        if(options && options.allow_parallel_animation)
            this.allow_parallel_animation = options.allow_parallel_animation;
    }

    // Animation to perform when viewing this event.
    *animation(body_view){} // Do nothing by default
};


// Actors are entities that can take decisions and produce actions.
// Think of them as the "mind" part of the Body.
// In some cases, an Actor can control several bodies. In this case the bodies
// will refer to the same Actor instance.
class Actor {
    actor_id = new_actor_id();

    // Decides what to do for this turn for a specific body, returns an Action or null if players must decide.
    // `possible_actions` is a map of { "action_id" : action_object } possibles.
    // Therefore the Action element can be used directory (for example: `possible_actions.move.execute(...)`).
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
    update_world_after_character_turn(world, body){
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
    constructor(position){
        if(position){
            console.assert(is_number(position.x));
            console.assert(is_number(position.y));
            this.x = position.x;
            this.y = position.y;
        } else {
            this.x = 0;
            this.y = 0;
        }

    }
    // TODO: add useful constants and functions here.

    get west() { return new Position({ x: this.x - 1, y: this.y }); }
    get east() { return new Position({ x: this.x + 1, y: this.y }); }
    get north() { return new Position({ x: this.x, y: this.y - 1 }); }
    get south() { return new Position({ x: this.x, y: this.y + 1 }); }

    equals(other_position){
        return other_position.x == this.x && other_position.y == this.y;
    }
};



// Elements are things that have a "physical" existence, that is it can be located in the space of the game (it have a position).
// For example a body, a pen in a bag, a software in a computer in a bag.
class Element {
    _position = new Position();
    get position() { return this._position; }
    set position(new_pos){
        this._position = new Position(new_pos);
    }
};

// Items are elements that cannot ever move by themselves.
// However, they can be owned by bodies and have a position in the world (like all elements).
// They provide Actions and modifiers for the body stats that equip them.
class Item extends Element {
    actions = [];
    // TODO: Action mechanisms here.
};


// Bodies are special entities that have "physical" existence and can perform action,
// like elements, but they can move by themselves.
// Each Body owns an Actor that will decide what Actions to do when it's the Body's turn.
class Body extends Element {
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

    // True if the control of this body is to the player, false otherwise.
    // Note that a non-player actor can also decide to let the player chose their action
    // by returning null.
    get is_player_actor() { return this.actor instanceof Player; }

    // True if this body can perform actions (have an actor for decisions and have enough action points).
    get can_perform_actions(){ // TODO: use actual action points
        // Cannot perform actions if we don't have an actor to decide which action to perform.
        return this.actor && !this.acted_this_turn;
    }

    disable_further_actions(){
        this.acted_this_turn = true;
    }

    // Describe the possible positions relative to the current ones that could be reached in one step,
    // assuming there is no obstacles.
    // Should be overloaded by bodies that have limited sets of movements.
    // Returns an element: { move_id: target_position, another_move_name: another_position }
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
    // BEWARE: Avoid using these members directly, prefer using the functions below, if you can (sometime yuo can't).
    _items = {};     // Items that are in the space of the world, not in other elements (not owned by Bodies).
    _bodies = {};    // Bodies are always in the space of the world. They can be controlled by Actors.
    _rules = [];     // Rules that will be applied through this game.
    is_finished = false; // True if this world is in a finished state, in which case it should not be updated anymore. TODO: protect against manipulations

    constructor(width, height, floor_tiles, surface_tiles){
        console.assert(Number.isInteger(width) && width > 2);
        console.assert(Number.isInteger(height) && height > 2);
        this.width = width;
        this.height = height;
        this._floor_tile_grid = new Grid(width, height, floor_tiles); // Tiles on the floor layer.
        this._surface_tile_grid = new Grid(width, height, surface_tiles); // Tiles over the floor, including "walls".
    }

    get bodies() { return Object.values(this._bodies); }
    get items() { return Object.values(this._items); }

    // Adds an element to the world (a Body or an Item), setup the necessary spatial information.
    add(element){
        console.assert(element instanceof Element);
        console.assert(element.position);
        if(element instanceof Body)
            this._bodies[element.body_id] = element;
        else if(element instanceof Item)
            this._items[element.item_id] = element;
        else throw "Tried to add to the World an unknown type of Element";
        // TODO: add the necessary info in the system that handles space partitionning
    }

    remove_body(...body_ids){
        for(const body_id of body_ids){
            delete this._bodies[body_id];
        }
    }

    // Set a list of rules that should be ordered as they should be applied.
    set_rules(...rules){
        console.assert(rules instanceof Array);
        console.assert(rules.every(rule => rule instanceof Rule));
        this._rules = rules;
    }

    // Returns a set of possible actions according to the current rules, for the specified body.
    gather_possible_actions_from_rules(body){
        console.assert(body instanceof Body);
        console.assert(!body.actor || body.actor instanceof Actor); // If the body have an Actor to control it, then it needs to be an Actor.
        let possible_actions = {};
        for(const rule of this._rules){
            const actions_from_rule = rule.get_actions_for(body, this);
            possible_actions = { ...possible_actions, ...actions_from_rule };
        }
        return possible_actions;
    }

    // Apply all rules to update this world according to them, at the end of a character's turn.
    // Should be called after each turn of an body.
    apply_rules_end_of_characters_turn(body){
        const events = [];
        for(const rule of this._rules){
            events.push(...(rule.update_world_after_character_turn(this, body)));
        }
        return events;
    }

    // Apply all rules to update this world according to them, at the end of a game turn.
    // Should be at the beginning of each game turn.
    apply_rules_beginning_of_game_turn(){
        const events = [];
        for(const rule of this._rules){
            events.push(...(rule.update_world_at_the_beginning_of_game_turn(this)));
        }
        return events;
    }

    // Returns true if the position given is blocked by an element (Body or Item) or a tile that blocks (wall).
    is_blocked_position(position, predicate_tile_is_walkable){

        if(position.x >= this.width || position.x < 0
        || position.y >= this.height || position.y < 0
        ){
            return true;
        }

        const floor_tile = this._floor_tile_grid.get_at(position);
        if(!floor_tile || !predicate_tile_is_walkable(floor_tile)){
            return true;
        }

        const surface_tile = this._surface_tile_grid.get_at(position);
        if(surface_tile && !predicate_tile_is_walkable(surface_tile)){
            return true;
        }

        if(this.body_at(position))
            return true;

        if(this.item_at(position))
            return true;

        return false;
    }

    find_body(body_id){
        return this._bodies[body_id];
    }

    get player_characters(){
        return this.bodies.filter(body => body.is_player_actor);
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

    everything_at(position){
        const things = [
            this._surface_tile_grid.get_at(position),
            this._floor_tile_grid.get_at(position),
            this.item_at(position),
            this.body_at(position),
        ];
        return things.filter(thing => thing != undefined);
    }

};

