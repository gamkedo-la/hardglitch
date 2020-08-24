
export {
    CharacterStatus,

}

import * as ui from "../system/ui.js";
import { invoke_on_members } from "../system/utility.js";
import { Character, StatValue } from "../core/character.js";
import { Vector2 } from "../system/spatial.js";

const bar_text = {
    font: "18px Arial",
    color: "white",
    background_color: "#ffffff00",
};

function update_stat_bar(bar, stat){
    console.assert(bar instanceof ui.Bar);
    console.assert(stat instanceof StatValue);
    bar.max_value = stat.max;
    bar.value = stat.value;
}

class CharacterStatus{
    constructor(position){
        console.assert(position instanceof Vector2);


        this.health_bar = new ui.Bar({
            position: position,
            width: 200, height: 30,
            bar_name: "Integrity",
            help_text: bar_text,
        });

        this.action_bar = new ui.Bar({
            position: position.translate({ y: 36 }),
            width: 200, height: 30,
            bar_name: "Action Points",
            help_text: bar_text,
        });

        this.health_bar.helptext_always_visible = true;
        this.action_bar.helptext_always_visible = true;
    }

    update(delta_time, character){
        this.character = character;
        if(!(this.character instanceof Character))
            return;

        update_stat_bar(this.health_bar, this.character.stats.integrity);
        update_stat_bar(this.action_bar, this.character.stats.action_points);

        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        if(!(this.character instanceof Character))
            return;
        invoke_on_members(this, "draw", canvas_context);
    }

    begin_preview_costs(preview_values){
        this.health_bar.show_preview_value(preview_values.integrity);
        this.action_bar.show_preview_value(preview_values.action_points);
    }

    end_preview_costs(){
        invoke_on_members(this, "hide_preview_value");
    }

};


