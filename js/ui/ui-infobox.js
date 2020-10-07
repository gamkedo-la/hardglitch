export {
    InfoBox,
    show_info,
}

import * as ui from "../system/ui.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as texts from "../definitions-texts.js";

import { sprite_defs } from "../game-assets.js";
import { Vector2, Rectangle, is_point_under } from "../system/spatial.js";
import { add_text_line } from "../system/utility.js";

const info_box_background_style = "#111177a0";
const info_box_border_style = "orange";
const info_box_background_margin = 4;
const info_box_text_font = "16px Space Mono"; //Verdana
const info_box_text_color = "white";

let current_info_box;

function show_info(description){
    if(!current_info_box)
        return;

    current_info_box.add_text(description);
}

class InfoBox {
    constructor(rectangle){
        this._area = new Rectangle(rectangle);
        this._text = "";
        this._text_display = new ui.Text({
            text: "",
            position: this.position,
            font: info_box_text_font,
            color: info_box_text_color,
            background_color: "#00000000",
        });

        this._button_hide = new ui.Button({
            sprite_def: sprite_defs.button_info_box_close,
            position: this.position,
            action: ()=>this._hide(),
        });
        this._button_hide.position = this.position.translate({ y: -this._button_hide.height });

        this._button_show = new ui.Button({
            sprite_def: sprite_defs.button_info_box_open,
            position: { x: this.position.x, y: graphics.canvas_rect().height - this._button_hide.height },
            action: ()=>this._show(),
            visible: false,
        });

        this._is_open = true;

        current_info_box = this;
    }

    get position() { return new Vector2(this._area.position); }

    add_text(new_text){
        console.assert(typeof new_text === "string");
        this._text = add_text_line(this._text, new_text);
    }

    update(delta_time){
        this._button_hide.update(delta_time);
        this._button_show.update(delta_time);

        if(is_point_under(input.mouse.position, this._area)){
            this._text = ""; // Clear the previous text.
            show_info(texts.ui.infobox);
        }

        if(this._text.length > 0){
            this._text_display.text = this._text;
            this._text = "";
            this._text_display.visible = true;
        } else {
            this._text_display.visible = false;
        }
        this._text_display.update(delta_time);

    }

    draw(canvas_context){
        if(this._is_open){
            canvas_context.save();
            canvas_context.beginPath();

            canvas_context.rect(this._area.position.x-info_box_background_margin,
                                this._area.position.y-info_box_background_margin,
                                this._area.width+info_box_background_margin,
                                this._area.height+info_box_background_margin
                                );
            canvas_context.fillStyle =info_box_background_style;
            canvas_context.strokeStyle =info_box_border_style;
            canvas_context.lineWidth = 4;
            canvas_context.lineCap = "round";
            canvas_context.lineDashOffset = 8;
            canvas_context.setLineDash([8, 8]);

            canvas_context.fill();
            canvas_context.stroke();

            canvas_context.restore();

            this._text_display.draw(canvas_context);
        }

        this._button_hide.draw(canvas_context);
        this._button_show.draw(canvas_context);
    }

    _hide(){
        this._is_open = false;
        this._button_show.visible = true;
        this._button_hide.visible = false;
    }

    _show(){
        this._is_open = true;
        this._button_show.visible = false;
        this._button_hide.visible = true;
    }

    _switch(){
        if(this._is_open)
            this._hide();
        else
            this._show();
    }
}

