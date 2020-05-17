
import * as concepts from "../core/concepts.js";

export { MovementRules, Move, Moved }

class Moved extends concepts.Event {
    constructor(agent, body, from_pos, to_pos) {
        super(agent.agent_id, body.body_id);
        this.from_pos = from_pos;
        this.to_pos = to_pos;
    }

};


class Move extends concepts.Action {

    constructor(new_position){
        console.assert(new_position);
        super();
        this.new_position = new_position;
    }

    execute(world, agent) {
        console.assert(agent.body);
        const initial_pos = agent.body.position;
        agent.body.position = this.new_position;
        return [ new Moved(agent, agent.body, initial_pos, this.new_position) ];
    }
};


// Rule: agents with a body can move (depending on what is arround).
// Movement can be done only 1 square per turn.
class MovementRules extends concepts.Rule {

    get_actions_for(agent, world) {

        let actions = {};

        if (agent.body) {
            // TODO: check if we CAN move (or not) in each direction, add actions accordingly
            // TEMPORARY HIDDEN WALLS:
            const boundaries = { top : 0, left : 0, bottom : 10, right : 14 };

            const current_pos = agent.body.position;
            console.assert(current_pos);

            if( current_pos.x > boundaries.left )   actions.move_west  = new Move(current_pos.west);
            if( current_pos.x < boundaries.right )  actions.move_east  = new Move(current_pos.east);
            if( current_pos.y > boundaries.top )    actions.move_north = new Move(current_pos.north);
            if( current_pos.y < boundaries.bottom ) actions.move_south = new Move(current_pos.south);
        }

        return actions;
    }

};
