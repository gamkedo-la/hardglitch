export const state = {
    menu : 1,
    running : 2,
    editor: 3
}

export class GameState {
    constructor(states, initialState) {
        this.state = states;
        this.currentState = states[initialState]
        this.isActive = true;
    }

    start() {
        if (this.currentState != null && this.currentState != undefined) {
            this.isActive = true;
        }
        this.currentState.enter();
    }

    changeState(newState) {
        if(this.currentState == newState) return;
        this.changeState.exit();
        this.currentState = this.states[newState];
        this.currentState.enter(this.currentState);
    }

    update(deltaTime) {
        if(!this.isActive) return;
        this.currentState.update(deltaTime);
        const nextState = this.currentState;
        if (nextState) this.changeState(nextState);
    }

    render() {
        if(!this.isActive) return;
        this.currentState.render();
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }
}

export class State {
    constructor() { if (this.constructor === State) throw new Error("Can't instantiate abstract class."); }
    enter() { if (this.constructor === State) throw new Error("Abstract Method"); }
    update() { if (this.constructor === State) throw new Error("Abstract Method"); }
    render() { if (this.constructor === State) throw new Error("Abstract Method"); }
    exit() { if (this.constructor === State) throw new Error("Abstract Method"); }
}