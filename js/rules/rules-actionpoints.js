
export {
    Rule_ActionPoints,
    Event_ActionPointsRestored,
 }

import * as concepts from "../core/concepts.js";
import { Character } from "../core/character.js";

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
        // TODO: display the restored points or something?
    }
};

class Rule_ActionPoints extends concepts.Rule {

    update_world_at_the_beginning_of_game_turn(world){
        return restore_characters_action_points(world);
    }
};

function restore_characters_action_points(world){
    const events = [];
    for(const character of world.bodies){
        console.assert(character instanceof Character);
        character.stats.action_points.increase(character.stats.ap_recovery.value);
        events.push( new Event_ActionPointsRestored(character, character.stats.ap_recovery.value) ); // TODO: set the real action points restored here.
    }
    return events;
}

