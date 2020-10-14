// This file provides a generic finite state machine based on coroutines.
export {
    State,
    StateMachine,
}

import * as debug from "../system/debug.js";

class State {

    // Called when we enter the state.
    // This is a coroutine to allow smooth trantions, called instead of update() if we are leaving the state.
    // Each yield will receive a delta_time value to use for updating.
    *enter(...data) {
        throw `${this.constructor.name} misses *entry(...data) generator function - implementation required`;
    }

    // Called when we exit the state.
    // This is a coroutine to allow smooth trantions, called instead of update() if we are leaving the state.
    // Each yield will receive a delta_time value to use for updating.
    *leave(...data){
        throw `${this.constructor.name} misses *leave(...data) generator function - implementation required`;
    }

    // Once entered the state and not leaving, this function will be called at every update.
    update(delta_time){}

    // Set by the state machine this state is owned by.
    get state_machine() { return this._state_machine; }

};

// const example_states = {
//     main_menu : new MainMenuState(),
//     game_session : new GameSessionState(),
//     editor : new EditorState(),
//     credits : new EditorState(),
// }

// const example_transition_table = {
//     initial_state : "main_menu",
//     main_menu : {
//         start_game : "game_session",
//         see_credits : "credits",
//     },
//     game_session : {
//         exit_game : "main_menu",
//         open_editor : "editor",
//     },
//     editor : {
//         back: "game_session",
//     },
//     credits : {
//         back: "main_menu"
//     },
//     "*" : {  // From any state
//         "game": "game_session",
//    }
// };

// This is a Finite State Machine that is also a State.
// It uses coroutines to handle entry and exit of states.
// It's a state to allow having some state act as state machines: they are fsms.
class StateMachine extends State {

    constructor(states, transition_table){
        debug.assertion(()=>transition_table);
        debug.assertion(()=>states instanceof Object);
        debug.assertion(()=>Object.values(states).every(state => state instanceof State));
        debug.assertion(()=>states[transition_table.initial_state] instanceof State); // The initial state must exist in the provided state objects.
        debug.assertion(()=>Object.keys(transition_table)             // Transition table requirements:
            .filter(state_id=> state_id !== "initial_state" && state_id !== "*")     // keys that are not "initial_state" (which is used to specify which state to start with),
            .every(state_id => states[state_id] instanceof State // must exist in the provided states names,
                && Object.values(transition_table[state_id])     // and for each action of a state...
                         .every(next_state_id => states[next_state_id] instanceof State)) // ... we must find the corresponding State to transition to in the provided states.
        );
        super();
        this.transition_table = transition_table;
        this.states = states;
        for(const state of Object.values(this.states)){
            state._state_machine = this;
        }

        this._started = false;
    }

    get current_state() { return this._current_state; }
    get current_state_id() { return this._current_state_id; }
    get is_running() { return this._started; }

    start(...data){
        debug.assertion(()=>this._started === false);
        debug.log(`FSM: ${this.constructor.name} STARTING WITH STATE ${this.transition_table.initial_state}`);
        this._started = true;
        this._begin_state_transition(this.transition_table.initial_state, ...data);
    }

    stop(){
        debug.assertion(()=>this._started === true);
        delete this._transition_sequence;
        delete this._next_state_id;
        delete this._current_state;
        delete this._current_state_id;
        this._started = false;
    }

    *enter(){
        debug.assertion(()=>this.is_running);
    }

    *leave(){
        debug.assertion(()=>this.is_running);
    }

    get_state(state_id){
        debug.assertion(()=>this.is_running);
        const state = this.states[state_id];
        debug.assertion(()=>state instanceof State);
        return state;
    }

    update(delta_time){
        debug.assertion(()=>this.is_running);
        if(this._transition_sequence !== undefined){
            if(this._transition_sequence.next(delta_time).done){
                delete this._transition_sequence;
                if(this._next_state_id !== undefined){
                    this._end_state_transition();
                }
            }
        }
        if(this._current_state)
            this._current_state.update(delta_time);
    }

    // If the action corresponds to a transition in the transition table, switch to the related state, passing it the data.
    // If doesn't corresponds to any transition, pass the action to the current state iff it's a statemachine too.
    // If no transition is found, does nothing.
    // Returns `true` if a transition was started.
    push_action(action, ...data){
        debug.assertion(()=>this.is_running);
        debug.assertion(()=>action !== undefined);
        if(this._next_state_id){
            debug.log(`FSM: ${this.constructor.name} + ${action} (${data}) => IGNORED BECAUSE A TRANSITION TO ${this._next_state_id} IS ONGOING`);
            return false;
        }
        const next_state_id = this._find_transition(this._current_state_id, action);
        debug.log(`FSM: ${this.constructor.name} + ${action} (${data}) => ${next_state_id}`);
        if(next_state_id){
            this._begin_state_transition(next_state_id, ...data);
            return true;
        } else {
            // Forward to potential sub-statemachine.
            return this.current_state instanceof StateMachine
                && this.current_state.push_action(action);
        }
    }

    _find_transition(state_id, action){
        debug.assertion(()=>this.is_running);
        const state_transitions = this.transition_table[state_id];
        if(state_transitions instanceof Object){
            const new_state_id = state_transitions[action];
            if(new_state_id)
                return new_state_id;
        }

        // We need to check global transitions too.
        const global_state_transitions = this.transition_table["*"];
        if(global_state_transitions instanceof Object){
            const new_state_id = global_state_transitions[action];
            return new_state_id; // Could be undefined.
        }
    }

    _begin_state_transition(next_state_id, ...data){
        debug.assertion(()=>this.is_running);
        debug.assertion(()=>this._next_state_id === undefined);
        this._transition_data = data;
        this._next_state_id = next_state_id;
        if(this._current_state){
            debug.log(`FSM: LEAVING ${this._current_state_id} ...`);
            this._transition_sequence = this._current_state.leave(...this._transition_data);
        } else {
            this._end_state_transition();
        }
    }

    _end_state_transition(){
        debug.assertion(()=>this.is_running);
        debug.assertion(()=>this._next_state_id !== undefined);

        if(this._current_state instanceof StateMachine) // If the state we are leaving is a state machine, stop it.
            this._current_state.stop();

        const next_state = this.get_state(this._next_state_id);
        debug.assertion(()=>next_state instanceof State);
        this._current_state = next_state;
        this._current_state_id = this._next_state_id;
        const data = this._transition_data;
        delete this._transition_data;
        delete this._next_state_id;

        debug.log(`FSM: ENTERING ${this._current_state_id} ...`);
        this._transition_sequence = this._current_state.enter(...data);
        this._transition_sequence.next(); // Make sure we executed at least the first part of the entry function.

        if(this._current_state instanceof StateMachine) // If the state we entered is a state machine, also start it.
            this._current_state.start(...data);
    }

};

