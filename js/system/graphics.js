// This file contains the graphic system implementation.
// It provides utilities to display anything graphic.


export {
  initialize,
  clear,
  Sprite,
  TileGrid,
  draw_text,
  measure_text,
  draw_rectangle,
  canvas_center_position,
  canvas_rect,
  draw_grid_lines,
  from_grid_to_graphic_position,
  from_graphic_to_grid_position,
  camera,
};

import * as spatial from "./spatial.js"
import { is_number, index_from_position } from "./utility.js";

var canvas, screen_canvas_context, loaded_assets;


// Return a vector in the graphic-world by interpreting a fixed-size grid position.
function from_grid_to_graphic_position(vec2, square_size, graphics_origin = {x:0, y:0}){
  console.assert(vec2);
  console.assert(Number.isInteger(square_size));
  return new spatial.Vector2({ x: graphics_origin.x + (vec2.x * square_size)
                             , y: graphics_origin.y + (vec2.y * square_size)
                             });
}

// Return a vector in the game-world by interpreting a graphic-world position.
function from_graphic_to_grid_position(vec2, square_size, graphics_origin = {x:0, y:0}){
  console.assert(vec2 && vec2.x != undefined && vec2.y != undefined);
  console.assert(Number.isInteger(square_size));
  return new spatial.Vector2({ x: Math.floor((vec2.x - graphics_origin.x) / square_size)
                             , y: Math.floor((vec2.y - graphics_origin.y) / square_size)
                             });
}

class Camera{
  transform = new spatial.Transform();
  _in_screen_rendering = false;

  get position() { return new spatial.Vector2(this.transform.position); }
  set position(new_pos) {
    console.assert(new_pos instanceof spatial.Vector2);
    this.transform.position = new_pos;
    screen_canvas_context.resetTransform();
    const translation = new_pos.inverse;
    screen_canvas_context.translate(translation.x, translation.y);
  }

  center(position_at_center){
    console.assert(position_at_center instanceof spatial.Vector2);
    this.position = position_at_center.translate({ x: -(canvas.width / 2), y: -(canvas.height / 2) });
  }


  translate(translation){
    console.assert(translation instanceof spatial.Vector2);
    this.transform.position = this.transform.position.translate(translation);
    translation = translation.inverse;
    screen_canvas_context.translate(translation.x, translation.y);
  }

  get rectangle() { return new spatial.Rectangle({ position: this.position, width: canvas.width, height: canvas.height }); }

  can_see(rect){
    if(this._in_screen_rendering == true)
      return spatial.is_intersection(rect, { position: {x:0, y:0}, width: canvas.width, height: canvas.height });
    else
      return spatial.is_intersection(rect, this.rectangle);
  }

  get is_rendering_in_screen() { return this._in_screen_rendering; }

  // Any draw call after calling this function will be in the canvas space instead of the game's space.
  // This is useful to display things that should appear as part of the interface.
  // BEWARE: don't call this if you didn't call end_in_screen_rendering() before!!!
  begin_in_screen_rendering(){
    console.assert(!this._in_screen_rendering);
    this._in_screen_rendering = true;
    screen_canvas_context.save();
    screen_canvas_context.resetTransform();
  }

  // Back to in-world space rendering (any draw after calling this function will be relative to the position of the camera)
  // BEWARE: will only work if you called begin_in_screen_rendering() first before!!!
  end_in_screen_rendering(){
    console.assert(this._in_screen_rendering);
    screen_canvas_context.restore();
    this._in_screen_rendering = false;
  }

  on_canvas_resized() {
    this.position = this.position; // Recalculate the position assuming it didn't change but the canvas size might have changed.
  }

};
const camera = new Camera();

class Sprite {
  transform = new spatial.Transform();
  animation_time = 0.0;
  animation_keyframe_idx = 0;
  origin = new spatial.Vector2(); // Point in the sprite that corresponds to the origin

  _frame_changed_since_update = false;

  // Setup the sprite using a sprite definition if provided.
  // A sprite definition looks like this:
  //
  //    sprite_def = {
  //      image: some_image_object_used_as_spritesheet,
  //      frames: [ // Here we define 2 frames inside the image.
  //                { x:0, y:0 , width:image.width / 2, height:image.height, origin: { x: 0, y: 64 } },
  //                { x:image.width / 2, y:0, width:image.width / 2, height:image.height },
  //              ],
  //      animations: { // One object per animation
  //                    normal: {
  //                      loop: true,   // Loops if true, stay on the last frame otherwise.
  //                      timeline: [   // Sequence of frames
  //                                  { frame: 0, duration: 1000 }, // Frame is the frame index to display, duration is in millisecs
  //                                  { frame: 1, duration: 1000 }
  //                                ],
  //                     },
  //                  },
  //    };
  //
  // By default we use the first frame if specified, or the whole image if not.
  constructor(sprite_def){
    if(sprite_def){
      this.source_image = loaded_assets.images[sprite_def.image];
      this.frames = sprite_def.frames;
      this.animations = sprite_def.animations;
      if(this.frames) {
        this.force_frame(0);
      }
      if(this.animations){
        // Use the first animation by default. TODO: reconsider...
        this.start_animation(Object.keys(this.animations)[0]);
      }
    }
  }

  get position() { return new spatial.Vector2(this.transform.position); }
  set position(new_position) { this.transform.position = new spatial.Vector2(new_position); }

  get did_frame_change_since_last_update(){
    return this._frame_changed_since_update;
  }

  force_frame(frame_idx) {
    console.assert(is_number(frame_idx));
    console.assert(frame_idx >= 0 && frame_idx < this.frames.length);
    this._current_frame = this.frames[frame_idx];
    if(this._current_frame.origin){
      this.origin = new spatial.Vector2(this._current_frame.origin);
    } else {
      this.origin = new spatial.Vector2();
    }
    this._frame_changed_since_update = true;
  }

  start_animation(animation_id){
    console.assert(animation_id);
    const animation = this.animations[animation_id];
    console.assert(animation);
    this._current_animation = animation;
    this.animation_time = 0.0;
    this.animation_keyframe_idx = 0;
  }

  get size(){
    if(this._current_frame)
      return { width: this._current_frame.width, height: this._current_frame.height,
               x: this._current_frame.width, y: this._current_frame.height };
    else if(this.source_image)
      return { width: this.source_image.width, height: this.source_image.height,
                x: this.source_image.width, y: this.source_image.height };
    else
      return { width: 64, height: 64, x: 64, y: 64 };
  }

  draw(canvas_context){
    if(!canvas_context)
      canvas_context = screen_canvas_context;

    const size = this.size;

    if(this.source_image){

      canvas_context.save(); // TODO : this should be done by the caller? probably
      const position = this.transform.position.translate(this.origin.inverse);
      canvas_context.translate(position.x, position.y);
      canvas_context.rotate(this.transform.orientation.degrees); // TODO: check if t's radian or degrees
      canvas_context.scale(this.transform.scale.x, this.transform.scale.y);
      if(this._current_frame)
      {
        canvas_context.drawImage(this.source_image,
          this._current_frame.x, this._current_frame.y, size.width, size.height, // source
          0, 0, size.width, size.height, // destination
        );
      }
      else
      {
        // No frame, use the whole image.
        canvas_context.drawImage(this.source_image, 0, 0, size.width, size.height);
      }
      canvas_context.restore();
    } else {
      // We don't have an image so we draw a colored rectangle instead.
      // TODO: handle scaling and other deformations
      const empty_sprite_color = "#ff00ff";
      draw_rectangle(new spatial.Rectangle( { position: this.position.translate(this.origin.inverse), size: size } ), empty_sprite_color);
    }
  }

  // Update the animation if necessary,
  update(delta_time){
    this._frame_changed_since_update = false;

    // Update the animation if any
    if(!this._current_animation)
      return ;

    this.animation_time += delta_time;
    let need_to_change_frame = false;
    while(true){ // Try to find the right keyframe to display
      const current_keyframe = this._current_animation.timeline[this.animation_keyframe_idx];
      if(this.animation_time < current_keyframe.duration)
        break; // nothing to do, we are in the right keyframe
      // We need to switch to the next frame if any, and take into account the time passed beyond the time required.
      this.animation_time -= current_keyframe.duration;
      ++this.animation_keyframe_idx; // Next keyframe
      if(this.animation_keyframe_idx >= this._current_animation.timeline.length){
         // no more keyframes
         if(this._current_animation.loop){
          // loop to the first frame
          this.animation_keyframe_idx = 0;
         }else{
           // stay on the last frame
          this.animation_keyframe_idx = this._current_animation.timeline.length - 1;
         }
      }
      need_to_change_frame = true;
    }

    // Only change the frame if we need to.
    if(need_to_change_frame){
      const current_keyframe = this._current_animation.timeline[this.animation_keyframe_idx];
      this.force_frame(current_keyframe.frame);
    }

  }
};

// 2D grid of sprites to display as one block.
// Allows opportunities for optimization by generating one sprite
// with the part of the grid we actually need to display.
class TileGrid
{
  background_color = "orange"; // Color displayed where there is no sprite in the grid.
  enable_draw_background = false;

  constructor(position, size, square_size, sprite_defs, tile_id_grid){
    console.assert(position instanceof spatial.Vector2);
    console.assert(size instanceof spatial.Vector2);
    console.assert(is_number(square_size));
    console.assert(tile_id_grid instanceof Array);
    console.assert(tile_id_grid.length == size.x * size.y);
    console.assert(sprite_defs);

    this.position = position;
    this.size = size;
    this.square_size = square_size;
    this.tile_id_grid = tile_id_grid;
    this.sprites = {};
    for(const sprite_id in sprite_defs){
      this.set_tile_type(sprite_id, sprite_defs[sprite_id]);
    }


    this._offscreen_canvas = document.createElement('canvas');
    this._offscreen_canvas_context = this._offscreen_canvas.getContext('2d');
    this._rendering_requests = [];
    this._offscreen_canvas.width = this.size.x * square_size;
    this._offscreen_canvas.height = this.size.y * square_size;
  }

  // Adds a sprite that can be used for tiles,
  set_tile_type(tile_id, sprite_def){
    //console.log("set_tile_type: " + tile_id + " sprite_def: " + sprite_def);
    console.assert(tile_id);
    console.assert(sprite_def);
    const sprite = new Sprite(sprite_def);
    this.sprites[tile_id] = sprite;
    return sprite;
  }

  change_tile(position, tile_sprite_id, sprite_def){
    console.assert(position && Number.isInteger(position.x) && Number.isInteger(position.y));

    // First make sure that the sprite is available.
    console.assert(tile_sprite_id);
    let sprite = this.sprites[tile_sprite_id];
    if(!sprite){
      console.assert(sprite_def);
      sprite = set_tile_type(tile_sprite_id, sprite_def);
    }
    console.assert(sprite);

    // Then record the change.
    this.tile_id_grid[this.index(position)] = tile_sprite_id;
    this.request_redraw({ x_begin:position.x, x_end:position.x+1, y_begin:position.y, y_end:position.y+1 });
  }

  _render_offscreen(x_begin=0, x_end=this.size.x, y_begin=0, y_end=this.size.y){
    const grid = {
      x: x_begin, y:y_begin,
      width: x_end - x_begin,
      height: y_end - x_begin,
    }
    const render = {
      x: grid.x * this.square_size,
      y: grid.y * this.square_size,
      width: grid.width * this.square_size,
      height: grid.height * this.square_size,
    }
    this._offscreen_canvas_context.fillStyle = "#00000000";
    this._offscreen_canvas_context.fillRect(render.x, render.y, render.width, render.height);

    for(let y = grid.y; y < grid.height; ++y){
      for(let x = grid.x; x < grid.width; ++x){
        const sprite_id = this.tile_sprite_id_at({x, y});
        if(sprite_id === undefined) // Undefined means we display no sprite.
          continue;
        const sprite = this.sprites[sprite_id];
        console.assert(sprite);
        const graphic_pos = from_grid_to_graphic_position({x, y}, this.square_size, this.position);
        sprite.position = graphic_pos;
        sprite.draw(this._offscreen_canvas_context);
      }
    }
  }

  _handle_rendering_requests(){
    while(this._rendering_requests.length != 0){
      const request = this._rendering_requests.shift();
      this._render_offscreen(request.x_begin, request.y_begin, request.x_end, request.y_end);
    }
  }

  // Request to redraw some sprites (maybe after changes)
  // {
  //   x_begin: 0, y_begin: 0, // Top left of the squares to redraw
  //   x_end: 42, y_end: 42,   // Bottom right of the squares to redraw
  // }
  request_redraw(rect) {
    //console.assert(rect && Number.isInteger(rect.x_begin) && Number.isInteger(rect.y_begin) && Number.isInteger(rect.x_end) && Number.isInteger(rect.y_end) );
    this._rendering_requests.push(rect);
  }

  tile_sprite_id_at(position){
    const tile_idx = this.index(position);
    console.assert(tile_idx >= 0 && tile_idx < this.tile_id_grid.length);
    const tile_sprite_id = this.tile_id_grid[tile_idx];
    return tile_sprite_id;
  }

  index(position){ return index_from_position(this.size.x, this.size.y, position); }

  update(delta_time){
    let is_any_sprite_changed = false;
    for(const sprite of Object.values(this.sprites)){
      // Note if the sprite changed outside of animation updates.
      is_any_sprite_changed = is_any_sprite_changed || sprite.did_frame_change_since_last_update;
      sprite.update(delta_time);
      // Note if the sprite changed because of an animation updates.
      is_any_sprite_changed = is_any_sprite_changed || sprite.did_frame_change_since_last_update;
    }
    if(is_any_sprite_changed){
      // We need to redraw the whole grid.
      this.request_redraw({});
    }
  }

  draw_background(){
    // TODO: consider allowing an image as a background
    const background_size = from_grid_to_graphic_position({ x:this.size.x, y:this.size.y }, this.square_size); // TODO: calculate that only when necessary
    draw_rectangle(new spatial.Rectangle({ position: this.position, size: background_size }), this.background_color);
  }

  draw_tiles(){
    this._handle_rendering_requests();
    screen_canvas_context.drawImage(this._offscreen_canvas, 0, 0);
  }

  draw(){
    if(this.enable_draw_background){
      this.draw_background();
    }

    this.draw_tiles();
  }

};


function initialize(assets){
  console.assert(assets);
  console.assert(assets.images);
  if(screen_canvas_context || canvas || loaded_assets)
    throw "Graphic system already initialized.";

  loaded_assets = assets;

  canvas = document.getElementById('gameCanvas');
  screen_canvas_context = canvas.getContext('2d');
  screen_canvas_context.imageSmoothingEnabled = false;

  canvas_resize_to_window();
  window.addEventListener('resize', on_window_resized);

  return canvas;
}

function canvas_resize_to_window(){
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function on_window_resized(){
  canvas_resize_to_window();
  camera.on_canvas_resized();
}

function draw_rectangle(rectangle, fillColor) {
  screen_canvas_context.fillStyle = fillColor;
  screen_canvas_context.fillRect(rectangle.position.x, rectangle.position.y,
    rectangle.width, rectangle.height);
}

function draw_circle(centerX, centerY, radius, fillColor) {
  screen_canvas_context.fillStyle = fillColor;
  screen_canvas_context.beginPath();
  screen_canvas_context.arc(centerX, centerY, radius, 0, Math.PI*2, true);
  screen_canvas_context.fill();
}

function drawBitmapCenteredAtLocationWithRotation(graphic, atX, atY,withAngle) {
  screen_canvas_context.save(); // allows us to undo translate movement and rotate spin
  screen_canvas_context.translate(atX,atY); // sets the point where our graphic will go
  screen_canvas_context.rotate(withAngle); // sets the rotation
  screen_canvas_context.drawImage(graphic,-graphic.width/2,-graphic.height/2); // center, draw
  screen_canvas_context.restore(); // undo the translation movement and rotation since save()
}

function clear(){
  screen_canvas_context.save();
  screen_canvas_context.resetTransform();
  screen_canvas_context.clearRect(0, 0, canvas.width, canvas.height);
  screen_canvas_context.restore();
}


const text_defaults = {
  text_align: "left", text_baseline: "top",
  font: "24px arial", color: "black",
};

function text_operation(font, color, operation){
  screen_canvas_context.save();
  screen_canvas_context.font = font;
  screen_canvas_context.fillStyle = color;
  screen_canvas_context.textAlign = text_defaults.text_align;
  screen_canvas_context.textBaseline = text_defaults.text_baseline;
  const result = operation();
  screen_canvas_context.restore();
  return result;
}

function measure_text(text, font=text_defaults.font, color=text_defaults.color){
  return text_operation(font, color, ()=>{
    return screen_canvas_context.measureText(text);
  });
}

function draw_text(text, position, font=text_defaults.font, color=text_defaults.color){
  return text_operation(font, color, ()=>{
    screen_canvas_context.fillText(text, position.x, position.y);
  });
}

function canvas_center_position(){
  return {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
}

function canvas_rect(){
  return new spatial.Rectangle({ x: 0, y:0, width:canvas.width, height:canvas.height});
}

function draw_grid_lines(width, height, square_size, start_position={x:0, y:0}){
  const grid_line_color = "#aa00aa";
  screen_canvas_context.strokeStyle = grid_line_color;
  const graphic_width = width * square_size;
  const graphic_height = height * square_size;
  for(let x = start_position.x; x <= graphic_width; x += square_size){
    screen_canvas_context.beginPath();
    screen_canvas_context.moveTo(x, start_position.y);
    screen_canvas_context.lineTo(x, graphic_height - start_position.y);
    screen_canvas_context.stroke();
  }

  for(let y = start_position.y; y <= graphic_height; y += square_size){
    screen_canvas_context.beginPath();
    screen_canvas_context.moveTo(start_position.x, y);
    screen_canvas_context.lineTo(graphic_width - start_position.x, y);
    screen_canvas_context.stroke();
  }

}


