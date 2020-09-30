export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import {
    deserialize_world,
    random_variation,
} from "./level-tools.js";

const defaults = {
    ground : tiles.ID.LVL1A,
    ground_alt: tiles.ID.LVL1B,
    wall : tiles.ID.WALL1A,
    wall_alt : tiles.ID.WALL1B,
};

const startup_rooms = {
    jump : {
        name: "",
        width: 8,
        height: 16,
        grids: {
          floor : [120,120,120,120,120,120,120,120,120,101,101,101,101,101,101,120,120,100,100,100,101,101,101,120,120,100,10,100,101,101,101,120,120,100,100,100,101,120,101,120,120,101,101,101,101,120,101,120,120,120,120,120,101,120,101,120,120,120,100,100,101,120,101,120,120,120,100,120,120,100,100,120,120,120,100,120,100,100,100,120,120,100,100,120,120,120,120,120,30,30,30,30,30,30,30,30,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 3 } },
          { type: "LifeForm_Weak", position: { x: 6, y: 8 } },
          { type: "CryptoFile_Triangle", position: { x: 2, y: 7 }, drops: [ "BadCode" ] },
          { type: "CryptoKey_Triangle", position: { x: 5, y: 8 } },
        ],
      }
};

function generate_world(){
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //


    const level_desc = startup_rooms.jump;
    level_desc.name = "Level 1: Buggy Program";

    return deserialize_world(random_variation(level_desc));
}