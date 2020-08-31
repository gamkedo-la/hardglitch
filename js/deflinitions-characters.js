

export {
    all_characters_types,
}


import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";
import { LifeForm_Strong, LifeForm_Weak } from "./characters/lifeform.js"
import { RandomActionEnemy, WaitingNPC } from "./characters/test-enemy.js"

// TODO: define potential character prefabs here.


function all_characters_types() {
    return [
        GlitchyGlitchMacGlitchy,
        LifeForm_Strong,
        LifeForm_Weak,
        RandomActionEnemy,
        WaitingNPC,
    ];
}


