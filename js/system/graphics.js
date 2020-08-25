// This file contains the graphic system implementation.
// It provides utilities to display anything graphic.


export {
  initialize,
  clear,
  reset,
  Sprite,
  TileGrid,
  create_canvas_context,
  execute_without_transform,
  draw_text,
  measure_text,
  draw_rectangle,
  canvas_center_position,
  canvas_rect,
  centered_rectangle_in_screen,
  draw_grid_lines,
  from_grid_to_graphic_position,
  from_graphic_to_grid_position,
  camera,
  screen_canvas_context,
};
2
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
  _rectangle = new spatial.Rectangle({ position: this.transform.position, width: 0, height: 0 });

  get position() { return new spatial.Vector2(this.transform.position); }
  set position(new_pos) {
    console.assert(new_pos instanceof spatial.Vector2);
    this.transform.position = new_pos;
    this._rectangle.position = new_pos;
    this._rectangle.size = { x:canvas.width, y:canvas.height };
    screen_canvas_context.resetTransform();
    const translation = new_pos.inverse;
    screen_canvas_context.translate(translation.x, translation.y);
  }

  get center_position() { return this.position.translate({ x: canvas.width / 2, y: canvas.height / 2 }); }

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

  get rectangle() { return this._rectangle; }

  can_see(rect){
    if(this._in_screen_rendering)
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

  reset(){
    this.position = spatial.Vector2_origin;
    if(this._in_screen_rendering){
      this.end_in_screen_rendering();
    }
  }

};
const camera = new Camera();

class Sprite {
  transform = new spatial.Transform();
  animation_time = 0.0;
  animation_keyframe_idx = 0;
  origin = new spatial.Vector2(); // Point in the sprite that corresponds to the origin

  _frame_changed_since_update = false;
  _frame_origin = new spatial.Vector2();

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
  //      position: { x: 0, y: 0 },
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
      if(sprite_def.position){
        this.position = sprite_def.position;
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
    this._frame_changed_since_update = true;
    this.reset_origin();
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
      return { width: this.source_image.naturalWidth, height: this.source_image.naturalHeight,
                x: this.source_image.naturalWidth, y: this.source_image.naturalHeight };
    else
      return { width: 64, height: 64, x: 64, y: 64 };
  }

  get area(){
    return new spatial.Rectangle({ x: this.transform.position.x, y: this.transform.position.y,
                                   width: this.size.width, height: this.size.height,
                                 });
  }

  // Change the origin point to the and translate to compensate.
  move_origin_to(origin_translation){
    this.position = this.position.translate(origin_translation);
    this.origin = origin_translation;
  }

  // Change the origin point to the current center and translate to compensate.
  move_origin_to_center(){
    const size = new spatial.Vector2(this.size);
    const origin_translation = this._draw_translation_from_origin();
    const center = size.translate(origin_translation).multiply(0.5);
    this.move_origin_to(center);
  }

  reset_origin(){
    if(this._current_frame && this._current_frame.origin){
      this._frame_origin = new spatial.Vector2(this._current_frame.origin);
    } else {
      this._frame_origin = new spatial.Vector2();
    }
  }

  _draw_translation_from_origin() {
    if(this._current_frame){
      return this.origin.translate(this._frame_origin).inverse;
    } else {
      return this.origin.inverse;
    }
  }

  draw(canvas_context = screen_canvas_context){

    const size = this.size;

    if(this.source_image){
      canvas_context.save();
      canvas_context.imageSmoothingEnabled = false;

      const origin_translation = this._draw_translation_from_origin();
      const position = this.transform.position;
      canvas_context.translate(position.x, position.y);
      canvas_context.rotate(this.transform.orientation.radian);
      canvas_context.scale(this.transform.scale.x, this.transform.scale.y);
      if(this._current_frame)
      {
        canvas_context.drawImage(this.source_image,
          this._current_frame.x, this._current_frame.y, size.width, size.height, // source
          origin_translation.x, origin_translation.y, size.width, size.height, // destination
        );
      }
      else
      {
        // No frame, use the whole image.
        canvas_context.drawImage(this.source_image, origin_translation.x, origin_translation.y, size.width, size.height);
      }

      canvas_context.restore();
    } else {
      // We don't have an image so we draw a colored rectangle instead.
      // TODO: handle scaling and other deformations
      const empty_sprite_color = "#ff00ff";
      draw_rectangle(canvas_context, new spatial.Rectangle( { position: this.position, size: size } ), empty_sprite_color);
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

function create_canvas_context(width, height){
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const canvas_context = canvas.getContext('2d');
  canvas_context.imageSmoothingEnabled = false;
  return canvas_context;
}

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
    for(const sprite_id of tile_id_grid){
      const sprite_def = sprite_defs[sprite_id];

      if(sprite_def && this.sprites[sprite_id] === undefined)
        this.set_tile_type(sprite_id, sprite_def);
    }


    this._offscreen_canvas_context = create_canvas_context(this.size.x * square_size, this.size.y * square_size);
    this._rendering_requests = [];

    this.request_redraw({});
  }

  // Adds a sprite that can be used for tiles,
  set_tile_type(tile_id, sprite_def){
    //console.log("set_tile_type: " + tile_id + " sprite_def: " + sprite_def);
    console.assert(tile_id !== undefined);
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
    this.request_redraw_square(position);
  }

  _render_offscreen(x_begin=0, x_end=this.size.x, y_begin=0, y_end=this.size.y, with_clear=true, position_predicate){
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

    if(with_clear || position_predicate){
      this._offscreen_canvas_context.fillStyle = "#00000000";
      this._offscreen_canvas_context.fillRect(render.x, render.y, render.width, render.height);
    }

    if(!position_predicate)
      position_predicate = () => true;

    for(let y = grid.y; y < grid.height; ++y){
      for(let x = grid.x; x < grid.width; ++x){
        if(!position_predicate({x, y}))
          continue;

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

  _handle_rendering_requests(position_predicate){
    while(this._rendering_requests.length != 0){
      const request = this._rendering_requests.shift();
      this._render_offscreen(request.x_begin, request.y_begin, request.x_end, request.y_end, request.with_clear, position_predicate);
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

  request_redraw_square(position) {
    this.request_redraw({ x_begin: position.x, y_begin: position.y, x_end: position.x+1, y_end: position.y+1, with_clear:false });
  }

  get redraw_requested() { return this._rendering_requests.length > 0;}

  // Request to redraw all sprites
  _request_redraw_tiles_with_sprite(sprite_id) {
    const size = this.size;
    for(let y = 0; y < size.y; ++y){
      for(let x = 0; x < size.x; ++x){
        if(this.tile_sprite_id_at({x, y}) === sprite_id){
          this.request_redraw_square({x,y});
        }
      }
    }
  }

  tile_sprite_id_at(position){
    const tile_idx = this.index(position);
    console.assert(tile_idx >= 0 && tile_idx < this.tile_id_grid.length);
    const tile_sprite_id = this.tile_id_grid[tile_idx];
    return tile_sprite_id;
  }

  index(position){ return index_from_position(this.size.x, this.size.y, position); }

  update(delta_time){
    let any_sprite_changed = false;
    for(const [tile_id, sprite] of Object.entries(this.sprites)){
      sprite.update(delta_time);
      if(sprite.did_frame_change_since_last_update)
        any_sprite_changed = true;
    }
    if(any_sprite_changed){
      this.request_redraw({});
    }
  }

  draw_background(canvas_context, position_predicate){
    // TODO: consider allowing an image as a background
    const background_size = from_grid_to_graphic_position({ x:this.size.x, y:this.size.y }, this.square_size); // TODO: calculate that only when necessary
    canvas_context.fillStyle = this.background_color;
    canvas_context.fillRect(this.position.x, this.position.y, background_size.x, background_size.y);
  }

  draw_tiles(canvas_context, position_predicate){
    this._handle_rendering_requests(position_predicate);
    canvas_context.drawImage(this._offscreen_canvas_context.canvas, 0, 0);
  }

  draw(canvas_context, position_predicate){
    console.assert(canvas_context);
    canvas_context.save();

    if(position_predicate)
      this.request_redraw({});

    if(this.enable_draw_background){
      this.draw_background(canvas_context, position_predicate);
    }

    this.draw_tiles(canvas_context, position_predicate);
    canvas_context.restore();

    return canvas_context;
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

  return screen_canvas_context;
}

function canvas_resize_to_window(){
  console.assert(Number.isInteger(window.innerWidth));
  console.assert(Number.isInteger(window.innerHeight));
  // We want an even picture to avoid weird scaling issues making sprites display weirdly.
  canvas.width  = window.innerWidth % 2 === 0 ? window.innerWidth : window.innerWidth - 1;
  canvas.height = window.innerHeight % 2 === 0 ? window.innerHeight : window.innerHeight - 1;
  screen_canvas_context = canvas.getContext('2d');
  screen_canvas_context.imageSmoothingEnabled = false;
}

function on_window_resized(){
  canvas_resize_to_window();
  camera.on_canvas_resized();
}

function draw_rectangle(canvas_context, rectangle, fillColor) {
  canvas_context.fillStyle = fillColor;
  canvas_context.fillRect(rectangle.position.x, rectangle.position.y,
    rectangle.width, rectangle.height);
}

function draw_circle(canvas_context, centerX, centerY, radius, fillColor) {
  canvas_context.fillStyle = fillColor;
  canvas_context.beginPath();
  canvas_context.arc(centerX, centerY, radius, 0, Math.PI*2, true);
  canvas_context.fill();
}

function drawBitmapCenteredAtLocationWithRotation(canvas_context, graphic, atX, atY,withAngle) {
  canvas_context.save(); // allows us to undo translate movement and rotate spin
  canvas_context.translate(atX,atY); // sets the point where our graphic will go
  canvas_context.rotate(withAngle); // sets the rotation
  canvas_context.drawImage(graphic,-graphic.width/2,-graphic.height/2); // center, draw
  canvas_context.restore(); // undo the translation movement and rotation since save()
}

function execute_without_transform(canvas_context, func){
  const canvas_transform = canvas_context.getTransform();
  canvas_context.resetTransform();
  const result = func(canvas_context);
  canvas_context.setTransform(canvas_transform);
  return result;
}

function clear(canvas_context = screen_canvas_context){
  execute_without_transform(canvas_context, ()=>{
    canvas_context.clearRect(0, 0, canvas_context.canvas.width, canvas_context.canvas.height);
  });
  canvas_context.imageSmoothingEnabled = false;
}

function reset() {
  camera.reset();
  screen_canvas_context.resetTransform();
  clear(screen_canvas_context);
}

const text_defaults = {
  text_align: "left", text_baseline: "top",
  font: "24px arial", color: "black",
};

function text_operation(canvas_context, font, color, operation){
  canvas_context.save();
  canvas_context.font = font;
  canvas_context.fillStyle = color;
  canvas_context.textAlign = text_defaults.text_align;
  canvas_context.textBaseline = text_defaults.text_baseline;
  const result = operation();
  canvas_context.restore();
  return result;
}

function measure_text(canvas_context, text, font=text_defaults.font, color=text_defaults.color){
  return text_operation(canvas_context, font, color, ()=>{
    return canvas_context.measureText(text);
  });
}

function draw_text(canvas_context, text, position, font=text_defaults.font, color=text_defaults.color){
  return text_operation(canvas_context, font, color, ()=>{
    canvas_context.fillText(text, position.x, position.y);
  });
}

function canvas_center_position(){
  return new spatial.Vector2({
    x: Math.round(canvas.width / 2),
    y: Math.round(canvas.height / 2),
  });
}

function canvas_rect(){
  return new spatial.Rectangle({ x: 0, y:0, width:canvas.width, height:canvas.height});
}

function centered_rectangle_in_screen(rect){
  return spatial.center_in_rectangle(rect, canvas_rect());
}

function draw_grid_lines(width, height, square_size, start_position={x:0, y:0}, context=screen_canvas_context){
  context.save();
  const grid_line_color = "#aa00aa";
  context.strokeStyle = grid_line_color;
  const graphic_width = width * square_size;
  const graphic_height = height * square_size;
  for(let x = start_position.x; x <= graphic_width; x += square_size){
    context.beginPath();
    context.moveTo(x, start_position.y);
    context.lineTo(x, graphic_height - start_position.y);
    context.stroke();
  }

  for(let y = start_position.y; y <= graphic_height; y += square_size){
    context.beginPath();
    context.moveTo(start_position.x, y);
    context.lineTo(graphic_width - start_position.x, y);
    context.stroke();
  }
  context.restore();
}


