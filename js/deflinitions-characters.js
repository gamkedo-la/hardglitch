

export {
    all_characters_types,
}


import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";
import { LifeForm_Strong, LifeForm_Weak, LifeForm_Aggressive } from "./characters/lifeform.js"
import { RandomActionEnemy, WaitingNPC } from "./characters/test-enemy.js"
import { Virus } from "./characters/virus.js";
import { AntiVirus } from "./characters/antivirus.js";
import { Program } from "./characters/program.js";
import { Microcode } from "./characters/microcode.js";

// TODO: define potential character prefabs here.


function all_characters_types() {
    return [
        GlitchyGlitchMacGlitchy,
        LifeForm_Strong,
        LifeForm_Weak,
        LifeForm_Aggressive,
        RandomActionEnemy,
        WaitingNPC,
        Virus,
        AntiVirus,
        Program,
        Microcode,
    ];
}


