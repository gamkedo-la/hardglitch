// This file describes the core concepts that exist in the game mechanics.
// This is not a modelisation of these concept, just rules of how things
// work in the game system. For example, we can say what an "entity" is,
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
    Entity,
    Item,
    Body,
    Position,
    perform_action,
};

import { is_number } from "../system/utility.js";
import { Grid } from "../system/grid.js";


let next_entity_id = 0;
function new_entity_id(){
    return ++next_entity_id;
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
        console.assert(target_position === undefined || target_position instanceof Position);
        console.assert(typeof name === 'string');
        console.assert(typeof description === 'string');
        this.id = id;                       // Used internally to identify this Action in some special code (for example to identify special moves to bind to keyboard keys)
        this.target_position = target_position; // Position of the target of this action. Could refer to the acting character, another character, an item or a tile at that position.
        this.name = name,                   // Name that will be displayed to the player.
        this.description = description;     // Description that will be displayed to the player.
        this.is_basic = false;              // Basic actions are visible directly in the game.
        this.is_safe = true;                // If false, means that this action should not be available unless explicitely attempted.
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
    return action.execute(world, body);
}

// Represents the record of something that happened in the past.
class Event{
    allow_parallel_animation = false; // Will be played in parallel with other parallel animations if true, will be animated alone otherwise.

    constructor(options){
        if(options){
            this.allow_parallel_animation = options.allow_parallel_animation;
            this._desc = options.description;
        }
    }

    get description(){ return this._desc || `${this.constructor.name}`; }

    // Animation to perform when viewing this event.
    // view: object representing the view of the game to be manipulated by this event.
    *animation(view){} // Do nothing by default
};


// Actors are entities that can take decisions and produce actions.
// Think of them as the "mind" part of the Body.
// In some cases, an Actor can control several bodies. In this case the bodies
// will refer to the same Actor instance.
class Actor {
    actor_id = new_actor_id();

    // Decides what to do for this turn for a specific body, returns an Action or null if players must decide.
    // `possible_actions` is a map of { "action_id" : action_object } possibles.
    // Therefore the Action object can be used directly (for example: `possible_actions.move.execute(...)`).
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
        console.assert(Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return other_position.x === this.x && other_position.y === this.y;
    }

    distance(other_position){
        console.assert(Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return Math.abs(this.x - other_position.x) + Math.abs(this.y - other_position.y);
    }

    translate(translation){
        console.assert(Number.isInteger(translation.x) && Number.isInteger(translation.y));
        return new Position({ x: this.x + translation.x, y: this.y + translation.y });
    }

    substract(other_position){
        console.assert(Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return new Position({ x: this.x - other_position.x, y: this.y - other_position.y });
    }

    absolute(){
        return new Position({ x: Math.abs(this.x), y: Math.abs(this.y) })
    }

    normalize(){
        return new Position({ x: Math.ceil(Math.clamp(this.x, -1, 1)), y: Math.ceil(Math.clamp(this.y, -1, 1)) });
    }
};



// Entities are things that have a "physical" existence, that is it can be located in the space of the game (it have a position).
// For example a body, a pen in a bag, a software in a computer in a bag.
class Entity {
    _position = new Position();
    _entity_id = new_entity_id();

    constructor(name, description = ""){
        console.assert(typeof name === 'string');
        console.assert(typeof description === 'string');
        this.name = name;
        this.description = description;
    }

    get position() { return this._position; }
    set position(new_pos){
        this._position = new Position(new_pos);
    }
    get id() {
        console.assert(this._entity_id);
        return this._entity_id;
    }
};

// Items are entities that cannot ever move by themselves.
// However, they can be owned by bodies and have a position in the world (like all entities).
// They provide Actions and modifiers for the body stats that equip them.
class Item extends Entity {
    actions = [];
    // TODO: Action mechanisms here.

    get item_id() { return this.id; }
};


// Bodies are special entities that have "physical" existence and can perform action,
// like entities, but they can move by themselves.
// Each Body owns an Actor that will decide what Actions to do when it's the Body's turn.
class Body extends Entity {
    actor = null; // Actor that controls this body. If null, this body cannot take decisions.
    items = []; // Items owned by this body. They don't appear in the World's list unless they are put back in the World (not owned anymore).

    get body_id() { return this.id; }

    // True if the control of this body is to the player, false otherwise.
    // Note that a non-player actor can also decide to let the player chose their action
    // by returning null.
    get is_player_actor() { return this.actor instanceof Player; }

};

// This is the world as known by the game.
// It's mainly a big container of every entities that makes the world.
class World
{
    // BEWARE: Avoid using these members directly, prefer using the functions below, if you can (sometime yuo can't).
    _items = {};     // Items that are in the space of the world, not in other entities (not owned by Bodies).
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
    get entities() { return [ ...this.bodies, ...this.items ]; }

    // Adds an entity to the world (a Body or an Item), setup the necessary spatial information.
    add(entity){
        console.assert(entity instanceof Entity);
        console.assert(entity.position);
        if(entity instanceof Body)
            this._bodies[entity.id] = entity;
        else if(entity instanceof Item)
            this._items[entity.id] = entity;
        else throw "Tried to add to the World an unknown type of Entity";
        // TODO: add the necessary info in the system that handles space partitionning
    }

    remove_entity(...ids){
        for(const entity_id of ids){
            delete this._bodies[entity_id];
            delete this._items[entity_id];
        }
    }

    remove_entity_at(...positions){
        const entity_ids_to_remove = [];
        for(const position of positions){
            const entity = this.entity_at(position);
            if(entity)
                entity_ids_to_remove.push(entity.id);
        }
        this.remove_entity(...entity_ids_to_remove);
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

    is_valid_position(position){
        return position.x >= 0 && position.x < this.width
            && position.y >= 0 && position.y < this.height
            ;
    }

    // Returns true if the position given is blocked by an entity (Body or Item) or a tile that blocks (wall).
    // The meaning of "blocking" depends on the provided predicate.
    is_blocked_position(position, predicate_tile_is_blocking){

        if(!this.is_valid_position(position))
            return true;

        const floor_tile = this._floor_tile_grid.get_at(position);
        if(!floor_tile || !predicate_tile_is_blocking(floor_tile))
            return true;

        const surface_tile = this._surface_tile_grid.get_at(position);
        if(surface_tile && !predicate_tile_is_blocking(surface_tile))
            return true;

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
        console.assert(this.is_valid_position(position));
        // TODO: optimize this if necessary
        for(const body of this.bodies){
            if(body.position.equals(position))
                return body;
        }
        return null;
    }

    item_at(position){
        console.assert(this.is_valid_position(position));
        // TODO: optimize this if necessary
        for(const item of this.items){
            if(item.position.equals(position))
                return item;
        }
        return null;
    }

    entity_at(position){
        console.assert(this.is_valid_position(position));
        const body = this.body_at(position);
        if(body)
            return body;
        const item = this.item_at(position);
        return item;
    }

    tiles_at(position){
        console.assert(this.is_valid_position(position));
        const things = [
            this._surface_tile_grid.get_at(position),
            this._floor_tile_grid.get_at(position),
        ];
        return things.filter(thing => thing != undefined);
    }

    everything_at(position){
        console.assert(this.is_valid_position(position));
        const things = [
            this._surface_tile_grid.get_at(position),
            this._floor_tile_grid.get_at(position),
            this.item_at(position),
            this.body_at(position),
        ];
        return things.filter(thing => thing != undefined);
    }

};
