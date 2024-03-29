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

    Position_origin,
    Position_unit_x,
    Position_unit_y,
    Position_negative_unit_x,
    Position_negative_unit_y,
    Position_unit,

    __entity_serialization_ignore_list,

    reset_ids,
    enable_id_increments,
};

import * as debug from "../system/debug.js";
import { is_number, clamp } from "../system/utility.js";
import { Grid } from "../system/grid.js";

let is_positions_update_necessary = true; // THIS IS FOR OPTIMIZATION ;__;

let is_id_increments_enabled = true;
function enable_id_increments(value){
    debug.assertion(()=>typeof value === "boolean");
    is_id_increments_enabled = value;
}


let next_entity_id = 0;
function new_entity_id(){
    if(is_id_increments_enabled)
        return ++next_entity_id;
}

let next_actor_id = 0;
function new_actor_id(){
    if(is_id_increments_enabled)
        return ++next_actor_id;
}


function reset_ids(){
    next_entity_id = 0;
    next_actor_id = 0;
}

// An action is when an Actor changes something (using its Body) in the world, following the
// world's rules.
class Action {
    constructor(id, name, target_position){
        debug.assertion(()=>typeof id === 'string');
        debug.assertion(()=>target_position === undefined || target_position instanceof Position);
        debug.assertion(()=>typeof name === 'string');
        this.id = id;                       // Used internally to identify this Action in some special code (for example to identify special moves to bind to keyboard keys)
        this.target_position = target_position; // Position of the target of this action. Could refer to the acting character, another character, an item or a tile at that position.
        this.name = name,                   // Name that will be displayed to the player.
        this.is_basic = false;              // Basic actions are visible directly in the game.
        this.is_generated = false;          // Generated actions might not be part of the previsible set of actions.
        this.is_safe = true;                // If false, means that this action should not be available unless explicitely attempted.
    }

    static get action_type_name() { return "MISSING ACTION TYPE NAME" };
    static get action_type_description() { return "MISSING ACTION TYPE DESCRIPTION" };
    static get costs(){ throw "must set costs!" } // Must return an object with costs per Character attribute.

    // Apply the action, transform the world.
    // Must return events corresponding to what happened.
    execute(world, body){
        return [];
    }
};


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

    // True if it's an event which is not tied to a particular set of entities.
    get is_world_event() { return false; }

    // Array of Position that are important for this event.
    get focus_positions() { throw "focus_positions not implemented"; }

    // Animation to perform when viewing this event. Set to null to disable animation.
    // view: object representing the view of the game to be manipulated by this event.
    *animation(view){ throw "animation not implemented"; }
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
    decide_next_action(world, body, possible_actions){
        throw "decide_next_action not implemented";
    }
};

// Special Actor representing the player.
// Any Body having this Actor will let the player chose what to do.
class Player extends Actor {

    decide_next_action(world, body, possible_actions){
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
            debug.assertion(()=>is_number(position.x));
            debug.assertion(()=>is_number(position.y));
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

    get north_west() { return new Position({ x: this.x - 1, y: this.y - 1 }); }
    get north_east() { return new Position({ x: this.x + 1, y: this.y - 1 }); }
    get south_west() { return new Position({ x: this.x - 1, y: this.y + 1 }); }
    get south_east() { return new Position({ x: this.x + 1, y: this.y + 1 }); }

    get adjacents() { return [this.north, this.east, this.west, this.south]; }
    get adjacents_diags() { return [ ...this.adjacents, this.north_east, this.north_west, this.south_east, this.south_west ]; }

    equals(other_position){
        debug.assertion(()=>Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return other_position.x === this.x && other_position.y === this.y;
    }

    distance(other_position){
        debug.assertion(()=>Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return Math.abs(this.x - other_position.x) + Math.abs(this.y - other_position.y);
    }

    translate(translation){
        debug.assertion(()=>Number.isInteger(translation.x) && Number.isInteger(translation.y));
        return new Position({ x: this.x + translation.x, y: this.y + translation.y });
    }

    substract(other_position){
        debug.assertion(()=>Number.isInteger(other_position.x) && Number.isInteger(other_position.y));
        return new Position({ x: this.x - other_position.x, y: this.y - other_position.y });
    }

    multiply(scalar){
        debug.assertion(()=>Number.isInteger(scalar));
        return new Position({ x: this.x * scalar, y: this.y * scalar });
    }

    absolute(){
        return new Position({ x: Math.abs(this.x), y: Math.abs(this.y) })
    }

    normalize(){
        return new Position({ x: Math.ceil(clamp(this.x, -1, 1)), y: Math.ceil(clamp(this.y, -1, 1)) });
    }

    get inverse() {
        return new Position({x: -this.x, y: -this.y });
    }

};

const Position_origin = Object.freeze(new Position());
const Position_unit_x = Object.freeze(new Position({ x: 1, y:0 }));
const Position_unit_y = Object.freeze(new Position({ x: 0, y: 1 }));
const Position_negative_unit_x = Object.freeze(new Position({ x: -1, y: 0 }));
const Position_negative_unit_y = Object.freeze(new Position({ x: 0, y: -1 }));
const Position_unit = Object.freeze(new Position({ x: 1, y: 1 }));



const __entity_serialization_ignore_list = [
    "assets", // Don't de/serialize asset information associated with that entity.
    "description", // No need to serialized descriptions.
    "name", // Names depends on types. (?)
    "owner", // Character owning another entity (in it's inventory)
    "world", // Never serialize a reference to the world.
];

// Entities are things that have a "physical" existence, that is it can be located in the space of the game (it have a position).
// For example a body, a pen in a bag, a software in a computer in a bag.
class Entity {
    _position = new Position();
    _entity_id = new_entity_id();
    get description(){ return "NO DESCRIPTION FOR THIS ENTITY"; }

    get __serialization_ignore_list(){ return __entity_serialization_ignore_list; }

    constructor(name){
        debug.assertion(()=>typeof name === 'string');
        this.name = name;
    }

    get position() { return this._position; }
    set position(new_pos){
        this._position = new Position(new_pos);
        is_positions_update_necessary = true;
    }
    get id() {
        debug.assertion(()=>Number.isInteger(this._entity_id) || !is_id_increments_enabled);
        return this._entity_id;
    }

    is_blocking_vision = false; // Some entities can block visibility, so don't.
};

// Items are entities that cannot ever move by themselves.
// However, they can be owned by bodies and have a position in the world (like all entities).
// They provide Actions and modifiers for the body stats that activate them.
class Item extends Entity {
    actions = [];

    get item_id() { return this.id; }

    // Return all the types of Action that this item provides to its owner.
    // Must return an array of types inheriting from the provided Action type.
    get_enabled_action_types() {
        return [];
    }

    // Returns a sequence of names of the different actions enabled by this item.
    get_enabled_actions_names() {
        return this.get_enabled_action_types()
                   .map(action_type => action_type.action_type_name)
                   ;
    }

    // Called when an action provided by this item have been used.
    on_action_used(){

    }

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
    _entity_locations = null; // This is for optimizations.
    grids = {};      // Grids that makes this world, each layer adding information/content. Grids are named and order of addition is important. See: https://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order/38218582#38218582
    is_finished = false; // True if this world is in a finished state, in which case it should not be updated anymore. TODO: protect against manipulations
    has_entity_list_changed = false; // True if the list of entities existing have changed since the last turn update.
    turn_id = 0;

    constructor(name, width, height, grids){
        debug.assertion(()=>typeof name === "string" && name.length > 0);
        debug.assertion(()=>Number.isInteger(width) && width > 1);
        debug.assertion(()=>Number.isInteger(height) && height > 1);
        debug.assertion(()=>grids instanceof Object);
        debug.assertion(()=>Object.values(grids).every(grid => grid instanceof Grid && grid.width == width && grid.height == height));
        this.name = name;
        this.width = width;
        this.height = height;
        this.size = this.width * this.height;
        this.grids = grids;
        this._all_grids = Object.values(this.grids); // Optimization: we assume that the grids entities will not change much after creation.
        is_positions_update_necessary = true;
    }

    get bodies() { return Object.values(this._bodies); }
    get items() { return Object.values(this._items); }
    get entities() { return [ ...this.bodies, ...this.items ]; }
    get all_grids() { return this._all_grids; }

    get_entity(entity_id){
        debug.assertion(()=>Number.isInteger(entity_id));
        const body = this._bodies[entity_id];
        if(body) return body;
        const item = this._items[entity_id];
        return item;
    }

    add_grid(grid_id, grid = new Grid(this.width, this.height)){
        debug.assertion(()=>grid_id !== undefined);
        debug.assertion(()=>this.grids[grid_id] === undefined);
        debug.assertion(()=>grid instanceof Grid && grid.width == this.width && grid.height == this.height);
        this.grids[grid_id] = grid;
        this._all_grids = Object.values(this.grids); // Optimization: we assume that the grids entities will not change much after creation.
        return grid;
    }

    remove_grid(grid_id){
        debug.assertion(()=>grid_id !== undefined);
        const grid = this._grids[grid_id];
        delete this.grids[grid_id];
        this._all_grids = Object.values(this.grids); // Optimization: we assume that the grids entities will not change much after creation.
        return grid;
    }

    // Adds an entity to the world (a Body or an Item), setup the necessary spatial information.
    add_entity(entity){
        debug.assertion(()=>entity instanceof Entity);
        debug.assertion(()=>entity.position);
        this.has_entity_list_changed = true;

        while(this.get_entity(entity.id) != null) {
            // We are in a case where the entity was taken from another world (probably between levels).
            // Just assign a new id for this world.
            entity._entity_id = new_entity_id();
        }

        if(entity instanceof Body){
            debug.assertion(()=>this._bodies[entity.id] == null);
            this._bodies[entity.id] = entity;
            if(entity.update_perception) // HACK! TODO: find a way to avoid this code to know that this function exits...
                entity.update_perception(this);
        }
        else if(entity instanceof Item){
            debug.assertion(()=>this._items[entity.id] == null);
            this._items[entity.id] = entity;
        }
        else throw "Tried to add to the World an unknown type of Entity";
    }

    remove_entity(...ids){
        const removed = [];

        const remove = (entity_id, entity_set)=>{
            if(entity_set[entity_id] instanceof Entity){
                const entity = entity_set[entity_id];
                removed.push(entity);
                delete entity_set[entity_id];
                this.has_entity_list_changed = true;
                return true;
            }
            else return false;
        };

        for(const entity_id of ids){
            if(!remove(entity_id, this._items))
                remove(entity_id, this._bodies);
        }

        return removed;
    }

    remove_entity_at(...positions){
        const entity_ids_to_remove = [];
        for(const position of positions){
            const entity = this.entity_at(position);
            if(entity)
                entity_ids_to_remove.push(entity.id);
        }
        return this.remove_entity(...entity_ids_to_remove);
    }

    // Set a list of rules that should be ordered as they should be applied.
    set_rules(...rules){
        debug.assertion(()=>rules instanceof Array);
        debug.assertion(()=>rules.every(rule => rule instanceof Rule));
        this._rules = rules;
    }

    // Returns a set of possible actions according to the current rules, for the specified body.
    gather_possible_actions_from_rules(body){
        debug.assertion(()=>body instanceof Body);
        debug.assertion(()=>!body.actor || body.actor instanceof Actor); // If the body have an Actor to control it, then it needs to be an Actor.
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
        return position && position.x >= 0 && position.x < this.width
            && position.y >= 0 && position.y < this.height
            ;
    }

    find_body(body_id){
        return this._bodies[body_id];
    }

    get player_characters(){
        return this.bodies.filter(body => body.is_player_actor);
    }

    body_at(position){
        const found = this.entity_at(position);
        return found instanceof Body ? found : null;
    }

    item_at(position){
        const found = this.entity_at(position);
        return found instanceof Item ? found : null;
    }

    entity_at(position){
        debug.assertion(()=>this.is_valid_position(position));
        this._update_entities_locations();
        const found = this._entity_locations.get_at(position);
        debug.assertion(()=> found == null || (found instanceof Entity && found.position.equals(position)));
        return found;
    }

    tiles_at(position){
        debug.assertion(()=>this.is_valid_position(position));
        const things = this.all_grids.map(grid => grid.get_at(position));
        return things.filter(thing => thing !== undefined && thing !== null);
    }

    everything_at(position){
        debug.assertion(()=>this.is_valid_position(position));

        const things = [];
        this.all_grids.forEach(grid => {
            const thing = grid.get_at(position);
            if(thing != null) things.push(thing);
        })

        const entity = this.entity_at(position);
        if(entity != null) things.push(entity);

        return things;
    }

    _update_entities_locations(){ // This is an optimization
        if(this._entity_locations != null
        && !is_positions_update_necessary
        && !this.has_entity_list_changed
        ) return;

        this._entity_locations = new Grid(this.width, this.height);
        this.entities.forEach(entity => {
            debug.assertion(()=>entity instanceof Entity);
            this._entity_locations.set_at(entity, entity.position);
        });
        is_positions_update_necessary = false;
    }

};
