// This file provides a generic finite state machine based on coroutines.
export {
    State,
    StateMachine,
}

class State {

    // Called when we enter the state.
    // This is a coroutine to allow smooth trantions, called instead of update() if we are leaving the state.
    // Each yield will receive a delta_time value to use for updating.
    *enter(...data) {}

    // Called when we exit the state.
    // This is a coroutine to allow smooth trantions, called instead of update() if we are leaving the state.
    // Each yield will receive a delta_time value to use for updating.
    *leave(...data){}

    // Once entered the state and not leaving, this function will be called at every update.
    update(delta_time){}

};

// const exemple = {
//     action_1 : "action 1",
//     action_2 : "action 2",
// };

// const example_states = {
//     main_menu : new MainMenuState(),
//     game_session : new GameSessionState(),
//     editor : new EditorState(),
//     credits : new EditorState(),
// }

// const example_transition_table = {
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

class StateMachine {

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
        this.transition_table = transition_table;
        this.states = states;
        for(const state of Object.values(this.states)){
            state.state_machine = this;
        }
    }

    start(){
        this._begin_state_transition(this.transition_table.initial_state);
    }

    get_state(state_id){
        const state = this.states[state_id];
        console.assert(state instanceof State);
        return state;
    }

    update(delta_time){
        if(this._transition_sequence !== undefined){
            if(this._transition_sequence.next(delta_time).done){
                this._transition_sequence = undefined;
                if(this._next_state_id !== undefined){
                    this._end_state_transition();
                }
            }
        }
        if(this._current_state)
            this._current_state.update(delta_time);
    }

    push_action(action, ...data){
        console.assert(action !== undefined);
        const next_state_id = this._find_transition(this._current_state_id, action);
        if(next_state_id){
            this._begin_state_transition(next_state_id, ...data);
        }
    }

    _find_transition(state_id, action){
        const state_transitions = this.transition_table[state_id];
        if(state_transitions instanceof Object){
            const new_state_id = state_transitions[action];
            return new_state_id; // Could be undefined.
        }
    }

    _begin_state_transition(next_state_id, ...data){
        console.assert(this._next_state_id === undefined);
        this._transition_data = data;
        this._next_state_id = next_state_id;
        if(this._current_state){
            this._transition_sequence = this._current_state.leave(...this._transition_data);
        } else {
            this._end_state_transition();
        }
    }

    _end_state_transition(){
        console.assert(this._next_state_id !== undefined);
        const next_state = this.get_state(this._next_state_id);
        console.assert(next_state instanceof State);
        this._current_state = next_state;
        this._current_state_id = this._next_state_id;
        const data = this._transition_data;
        this._transition_data = undefined;
        this._next_state_id = undefined;
        this._transition_sequence = this._current_state.enter(...data);
    }

};

