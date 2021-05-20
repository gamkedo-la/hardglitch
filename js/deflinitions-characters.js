

export {
    all_characters_types,
    all_actor_types,
}


import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";
import { LifeForm_Strong, LifeForm_Weak, LifeForm_Aggressive, Crusher, MoveInCircles, MoveUntilYouCant } from "./characters/lifeform.js"
import { RandomActionEnemy, WaitingNPC, RandomActionSelector } from "./characters/test-enemy.js"
import { Virus, VirusBehavior } from "./characters/virus.js";
import { AntiVirus, AnomalyHunter } from "./characters/antivirus.js";
import { Program, ProgramBehavior } from "./characters/program.js";
import { Microcode, Corrupter } from "./characters/microcode.js";
import { Player } from "./core/concepts.js";

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

function all_actor_types() {
    return [
        Player,
        Crusher, MoveInCircles, MoveUntilYouCant,
        AnomalyHunter,
        VirusBehavior,
        ProgramBehavior,
        Corrupter,

        RandomActionSelector,
    ];
}
