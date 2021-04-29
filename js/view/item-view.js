// This file provides the code presenting items in the game.


export {
    ItemView,
}

import * as debug from "../system/debug.js";
import { EntityView } from "./entity-view.js";
import * as concepts from "../core/concepts.js";
import { item_description } from "../definitions-texts.js";

import * as ui from "../system/ui.js";
import { center_in_rectangle } from "../system/spatial.js";

class ItemView extends EntityView {
    constructor(item){
        debug.assertion(()=>item instanceof concepts.Item);
        super(item.id, item.position, item.assets);
        this.name = item.name;
        this._item = item;
        this.is_floating = item.is_floating;

        if(Number.isInteger(this._item.count)){ // This is an item with limited usage: display that usage.
            this.usage_count_text = new ui.Text({
                text: "XXX",
            });
        }

        this.position = this.position;
        this._update_usage_count_text();
    }

    get description() { return item_description(this._item); }

    get position() { return super.position; }
    set position(new_pos){
        super.position = new_pos;
        this._update_usage_count_position();
    }

    update(delta_time){
        super.update(delta_time);


    }

    render_graphics(canvas_context){
        super.render_graphics(canvas_context);

        if(this.usage_count_text
        && (this.is_visible || this.force_visible)
        ){
            this.usage_count_text.update(1);
            this._update_usage_count_text();
            this.usage_count_text.draw(canvas_context);
        }
    }

    _update_usage_count_text(){
        if(this.usage_count_text){
            this.usage_count_text.text = `${this._item.count}`;
            if(this._item.count == 0){
                this.usage_count_text.color = "red";
            } else {
                this.usage_count_text.color = "black";
            }
            this._update_usage_count_position(); // Because the size of the text have changed.
        }
    }

    _update_usage_count_position(){
        if(!this.usage_count_text)
            return;

        if(this.active){
            this.usage_count_text.position = center_in_rectangle(this.usage_count_text, this.area).position;
        } else {
            this.usage_count_text.position = this.position.translate({
                x: this.width - this.usage_count_text.width,
                y: this.height - this.usage_count_text.height
            });
        }
    }

    on_dragging_begin(){
        if(this.usage_count_text){
            this.usage_count_text.visible = false;
        }
    }

    on_dragging_end(){
        if(this.usage_count_text){
            this.usage_count_text.visible = true;
        }
    }

    on_active_begin(){
        this.active = true;
    }

    on_active_end(){
        this.active = false;
    }

};

