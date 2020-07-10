export const state = {
    menu : 1,
    running : 2,
    editor: 3
}

export class GameState {
    constructor(state) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }
}