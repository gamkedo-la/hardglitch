
export {
    CharacterStatus,

}

import * as ui from "../system/ui.js";
import * as texts from "../definitions-texts.js";
import { invoke_on_members, set_on_members } from "../system/utility.js";
import { Character, StatValue } from "../core/character.js";
import { Vector2 } from "../system/spatial.js";
import { config } from "../game-config.js";
import { show_info } from "./ui-infobox.js";

const bar_text = {
    font: "18px Space Mono",
    color: "white",
    background_color: "#00000030",
};

const stats_text = bar_text; // For now, use the same.

const bar_size = {
    width: 260,
    height: 24,
    space_between: 8,
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

        this.character_name = new ui.Text(Object.assign(stats_text, {
            text: "Unknown Character Name",
            position: position.translate({ x: 80, y: -36 }),
        }));

        this.health_bar = new ui.Bar({
            position: position,
            width: bar_size.width, height: bar_size.height,
            bar_name: "Integrity",
            help_text: bar_text,
            visible: false,
            bar_colors:{
                value: "#FF006E",
                change_negative: "#FB5607",
                change_positive: "#ffffff",
                preview: "#8338EC",
                background:"#3A86FF",
            }
        });
        this.health_bar.helptext._events = {
            on_mouse_over: ()=> show_info(texts.ui.integrity),
        };

        this.health_recovery_text = new ui.Text(Object.assign(stats_text, {
            text: "",
            position: this.health_bar.position.translate({ x: this.health_bar.width + 4 }),
            visible: false,
        }));

        this.action_bar = new ui.Bar({
            position: position.translate({ y: bar_size.height + bar_size.space_between }),
            width: bar_size.width, height: bar_size.height,
            bar_name: "Action Points",
            help_text: bar_text,
            visible: false,
            bar_colors:{
                value: "#ffbe0b",
                change_negative: "#FB5607",
                change_positive: "#ffffff",
                preview: "#8338ec",
                background:"#3A86FF",
            }
        });
        this.action_bar.helptext._events = {
            on_mouse_over: ()=> show_info(texts.ui.action_points),
        };

        this.action_recovery_text = new ui.Text(Object.assign(stats_text, {
            text: "",
            position: this.action_bar.position.translate({ x: this.action_bar.width + 4 }),
            visible: false
        }));


    }

    hide(){
        set_on_members(this, "visible", false);
    }

    show(){
        set_on_members(this, "visible", true);
    }

    update(delta_time, character){
        this.character = character;

        if(this.character instanceof Character){
            this.show();
        } else {
            this.hide();
            return;
        }

        this.health_bar.helptext_always_visible = config.enable_stats_bar_value_always_visible;
        this.action_bar.helptext_always_visible = config.enable_stats_bar_value_always_visible;

        update_stat_bar(this.health_bar, this.character.stats.integrity);
        update_stat_bar(this.action_bar, this.character.stats.action_points);

        this.character_name.text = this.character.name;
        const text_value_per_cycle = (value)=> value !== 0 ? `${ value >= 0 ? "+":""}${value}/Cycle` : "";
        const health_recovery = this.character.stats.int_recovery.value;
        const action_recovery = this.character.stats.ap_recovery.value;
        this.health_recovery_text.text = text_value_per_cycle(health_recovery);
        this.action_recovery_text.text = text_value_per_cycle(action_recovery);

        invoke_on_members(this, "update", delta_time);

        if(this.character_name.is_mouse_over){
            show_info(texts.ui.character_name);
        } else if(this.health_recovery_text.is_mouse_over){
            show_info(texts.ui.integrity_per_cycle);
        }else if(this.action_recovery_text.is_mouse_over){
            show_info(texts.ui.ap_per_cycle);
        }
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


