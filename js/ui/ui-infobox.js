export {
    InfoBox,
    show_info,
}

import * as debug from "../system/debug.js";
import * as ui from "../system/ui.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as texts from "../definitions-texts.js";

import { sprite_defs } from "../game-assets.js";
import { Vector2, Rectangle, is_point_under } from "../system/spatial.js";
import { add_text_line } from "../system/utility.js";
import { config } from "../game-config.js";
import { mouse_grid_position } from "../game-input.js";
import { graphic_position } from "../view/entity-view.js";

const info_box_background_style = "#111177a0";
const info_box_border_style = "orange";
const info_box_background_margin = 4;
const info_box_text_font = "14px Space Mono";
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
            position: this.position.translate({ x: 4, y:4 }),
            font: info_box_text_font,
            color: info_box_text_color,
            background_color: "#00000000",
            margin_horizontal: 1,
            margin_vertical: 2,
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

        current_info_box = this;

        this.offset = 0;
    }

    get position() { return new Vector2(this._area.position); }
    get is_mouse_over() { return this.is_under(input.mouse.position); }
    is_under(position) { return is_point_under(position, this._area)
                             || (this.visible ? this._button_hide.is_under(position) : this._button_show.is_under(position))
                             ;
                        }

    get _is_open() { return config.enable_infobox; }
    set _is_open(is_it) { config.enable_infobox = is_it; }
    get visible() { return this._is_open; }

    add_text(new_text){
        debug.assertion(()=>typeof new_text === "string");
        this._text = add_text_line(this._text, new_text);
    }

    update(delta_time){
        this._last_delta_time = delta_time;

        this._button_hide.update(delta_time);
        this._button_show.update(delta_time);

        if(this.is_mouse_over){
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

    _setup_line(canvas_context){
        canvas_context.fillStyle =info_box_background_style;
        canvas_context.strokeStyle =info_box_border_style;
        canvas_context.lineWidth = 6;
        canvas_context.lineCap = "round";
        canvas_context.lineDashOffset = 8;
        canvas_context.setLineDash([16, 16]);

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

            this._setup_line(canvas_context);
            if(this._text_display.visible){ // Line dash animation
                this.offset += this._last_delta_time * 0.05;
            }
            canvas_context.lineDashOffset = Math.round(this.offset);
            canvas_context.fill();
            canvas_context.stroke();

            canvas_context.restore();

            this._text_display.draw(canvas_context);

            if(config.enable_infobox_pointer
            && this._text_display.visible > 0 // Draw a line to the thing being described.
            ){
                const mouse_pos = mouse_grid_position();
                if(mouse_pos){
                    const pointed_gfx_pos = graphic_position(mouse_pos.translate({x:1, y:1})).translate(graphics.camera.position.inverse);

                    canvas_context.save();
                    canvas_context.beginPath();
                    this._setup_line(canvas_context);
                    canvas_context.fillStyle = info_box_border_style;

                    canvas_context.arc(pointed_gfx_pos.x, pointed_gfx_pos.y, 10, 0, Math.PI * 2, true);
                    canvas_context.moveTo(pointed_gfx_pos.x, pointed_gfx_pos.y);
                    canvas_context.lineTo(this._area.position.x, this._area.position.y);
                    canvas_context.fill();
                    canvas_context.stroke();
                    canvas_context.restore();
                }
            }

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

