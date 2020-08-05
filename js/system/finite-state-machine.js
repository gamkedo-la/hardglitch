// This file provides a generic finite state machine based on coroutines.
export {
    State,
    StateMachine,
}

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
//     }
// };

// This is a Finite State Machine that is also a State.
// It uses coroutines to handle entry and exit of states.
// It's a state to allow having some state act as state machines: they are fsms.
class StateMachine extends State {

    constructor(states, transition_table){
        console.assert(transition_table);
        console.assert(states instanceof Object);
        console.assert(Object.values(states).every(state => state instanceof State));
        console.assert(states[transition_table.initial_state] instanceof State);
        console.assert(Object.keys(transition_table)
            .filter(state_id=> state_id !== "initial_state")
            .every(state_id => states[state_id] instanceof State
                && Object.values(transition_table[state_id])
                         .every(next_state_id => states[next_state_id] instanceof State))
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

    start(){
        console.assert(this._started === false);
        console.log(`FSM: ${this.constructor.name} STARTING WITH STATE ${this.transition_table.initial_state}`);
        this._started = true;
        this._begin_state_transition(this.transition_table.initial_state);
    }

    stop(){
        console.assert(this._started === true);
        delete this._transition_sequence;
        delete this._next_state_id;
        delete this._current_state;
        delete this._current_state_id;
        this._started = false;
    }

    *enter(){
        console.assert(this.is_running);
    }

    *leave(){
        console.assert(this.is_running);
    }

    get_state(state_id){
        console.assert(this.is_running);
        const state = this.states[state_id];
        console.assert(state instanceof State);
        return state;
    }

    update(delta_time){
        console.assert(this.is_running);
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
        console.assert(this.is_running);
        console.assert(action !== undefined);
        console.log(`FSM: ACTION PUSHED: ${action} (${data})`);
        const next_state_id = this._find_transition(this._current_state_id, action);
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
        console.assert(this.is_running);
        const state_transitions = this.transition_table[state_id];
        if(state_transitions instanceof Object){
            const new_state_id = state_transitions[action];
            return new_state_id; // Could be undefined.
        }
    }

    _begin_state_transition(next_state_id, ...data){
        console.assert(this.is_running);
        console.assert(this._next_state_id === undefined);
        this._transition_data = data;
        this._next_state_id = next_state_id;
        if(this._current_state){
            console.log(`FSM: LEAVING ${this._current_state_id} ...`);
            this._transition_sequence = this._current_state.leave(...this._transition_data);
        } else {
            this._end_state_transition();
        }
    }

    _end_state_transition(){
        console.assert(this.is_running);
        console.assert(this._next_state_id !== undefined);
        if(this._current_state instanceof StateMachine)
            this._current_state.stop();
        const next_state = this.get_state(this._next_state_id);
        console.assert(next_state instanceof State);
        this._current_state = next_state;
        this._current_state_id = this._next_state_id;
        const data = this._transition_data;
        delete this._transition_data;
        delete this._next_state_id;
        console.log(`FSM: ENTERING ${this._current_state_id} ...`);
        if(this._current_state instanceof StateMachine)
            this._current_state.start();
        this._transition_sequence = this._current_state.enter(...data);
        this._transition_sequence.next(); // Make sure we executed at least the first part of the entry function.
    }

};

