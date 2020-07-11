
export {
    Rule_ActionPoints,
    Event_ActionPointsRestored,
 }

import * as concepts from "../core/concepts.js";

class Event_ActionPointsRestored extends concepts.Event {
    constructor(character, restored_points){
        super({
            description: `Restored AP of entity ${character.id}`
        });
        this.restored_points = restored_points;
        this.character_position = character.position;
    }

    get focus_positions() { return [ this.character_position ]; }

    *animation(){
        // TODO: display the restored points or something
    }
};

class Rule_ActionPoints extends concepts.Rule {

    update_world_at_the_beginning_of_game_turn(world){
        return restore_characters_action_points(world);
    }
};

function restore_characters_action_points(world){
    const events = [];
    for(const body of world.bodies){
        body.acted_this_turn = false; // TODO: replace this by actual action point logic
        events.push( new Event_ActionPointsRestored(body, 1) ); // TODO: set the real action points restored here.
    }
    return events;
}

