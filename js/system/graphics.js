// This file contains the graphic system implementation.
// It provides utilities to display anything graphic.


export {
  initialize,
  clear,
  Sprite,
  TileGrid,
  draw_text,
  canvas_center_position,
  draw_grid_lines,
  from_grid_to_graphic_position,
  from_graphic_to_grid_position,
};

import * as spatial from "./spatial.js"
import { is_number } from "./utility.js";

var canvas, canvasContext, loaded_assets;

// Return a vector in the graphic-world by interpreting a fixed-size grid position.
function from_grid_to_graphic_position(vec2, square_size, graphics_origin = {x:0, y:0}){
  return new spatial.Vector2({ x: graphics_origin.x + (vec2.x * square_size)
                             , y: graphics_origin.y + (vec2.y * square_size)
                             });
}

// Return a vector in the game-world by interpreting a graphic-world position.
function from_graphic_to_grid_position(vec2, square_size, graphics_origin = {x:0, y:0}){
  return new spatial.Vector2({ x: ((vec2.x - graphics_origin) / square_size)
                             , y: ((vec2.y - graphics_origin) / square_size)
                             });
}


class Sprite {
  transform = new spatial.Transform();
  animation_time = 0.0;
  animation_keyframe_idx = 0;

  // Setup the sprite using a sprite definition if provided.
  // A sprite definition looks like this:
  //
  //    sprite_def = {
  //      image: some_image_object_used_as_spritesheet,
  //      frames: [ // Here we define 2 frames inside the image.
  //                { x:0, y:0 , width:image.width / 2, height:image.height },
  //                { x:image.width / 2, y:0, width:image.width / 2, height:image.height },
  //              ],
  //      animations: [ // One object per animation
  //                    {
  //                      loop: true,   // Loops if true, stay on the last frame otherwise.
  //                      timeline: [   // Sequence of frames
  //                                  { frame: 0, duration: 1000 }, // Frame is the frame index to display, duration is in millisecs
  //                                  { frame: 1, duration: 1000 }
  //                                ],
  //                     },
  //                  ],
  //    };
  //
  // By default we use the first frame if specified, or the whole image if not.
  constructor(sprite_def){
    if(sprite_def){
      this.source_image = loaded_assets.images[sprite_def.image];
      this.frames = sprite_def.frames;
      this.animations = sprite_def.animations;
      if(this.frames) {
        this.change_frame(0);
      }
      if(this.animations){
        this.change_animation(0);
      }

    }
  }

  get position() { return this.transform.position; }
  set position(new_position) { this.transform.position = new_position; }

  change_frame(frame_idx) {
    console.assert(is_number(frame_idx));
    console.assert(frame_idx >= 0 && frame_idx < this.frames.length);
    this._current_frame = this.frames[frame_idx];
  }

  change_animation(animation_idx){
    console.assert(is_number(animation_idx));
    console.assert(animation_idx >= 0 && animation_idx < this.animations.length);
    this._current_animation = this.animations[animation_idx];
    this.animation_time = 0.0;
    this.animation_keyframe_idx = 0;
  }

  draw(){ // TODO: take a camera into account
    if(this.source_image){

      canvasContext.save(); // TODO : this should be done by the caller? probably
      canvasContext.translate(this.transform.position.x, this.transform.position.y);
      canvasContext.rotate(this.transform.orientation.degrees); // TODO: check if t's radian or degrees
      if(this._current_frame)
      {
        // TODO: handle scaling and other deformations
        canvasContext.drawImage(this.source_image,
          this._current_frame.x, this._current_frame.y, this._current_frame.width, this._current_frame.height, // source
          0, 0, this._current_frame.width, this._current_frame.height, // destination
        );
      }
      else
      {
        // No frame, use the whole image.
        // TODO: handle scaling and other deformations
        canvasContext.drawImage(this.source_image, this.source_image.width, this.source_image.height);
      }
      canvasContext.restore();
    } else {
      // We don't have an image so we draw a colored rectangle instead.
      // TODO: handle scaling and other deformations
      const empty_sprite_color = "#ff00ff";
      colorRect(new spatial.Rectangle( { position: this.position, size: this.size } ), empty_sprite_color);
    }
  }

  update(delta_time){
    // Update the animation if any
    if(!this._current_animation)
      return;

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
      this.change_frame(current_keyframe.frame);
    }
  }
};

// 2D grid of sprites to display as one block.
// Allows opportunities for optimization by generating one sprite
// with the part of the grid we actually need to display.
class TileGrid
{
  background_color = "orange"; // Color displayed where there is no sprite in the grid.

  constructor(position, size, sprites, index_grid){
    console.assert(position instanceof Vector2);
    console.assert(size instanceof Vector2);
    console.assert(sprites instanceof Object);
    console.assert(index_grid instanceof Array);
    this.position = position;
    this.size = size;
    this.sprites = sprites;
    this.index_grid = index_grid;
  }

  draw(){ // TODO: take a camera into account
    // TODO: write a proper implementation :P
    colorRect(new spatial.Rectangle({ position: this.position, size: this.size}) , this.background_color);
  }

};


function initialize(assets){
  console.assert(assets);
  console.assert(assets.images);
  if(canvasContext || canvas || loaded_assets)
    throw "Graphic system already initialized.";

  loaded_assets = assets;

  canvas = document.getElementById('gameCanvas');
  canvasContext = canvas.getContext('2d');
  canvas_resize_to_window();
  window.addEventListener('resize', on_window_resized);
}

function canvas_resize_to_window(){
  canvasContext.canvas.width  = window.innerWidth;
  canvasContext.canvas.height = window.innerHeight;
}

function on_window_resized(){
  // TODO: handle camera stuffs here.
  canvas_resize_to_window();
}

function colorRect(rectangle, fillColor) {
  canvasContext.fillStyle = fillColor;
  canvasContext.fillRect(rectangle.position.x, rectangle.position.y,
    rectangle.width, rectangle.height);
}

function colorCircle(centerX, centerY, radius, fillColor) {
  canvasContext.fillStyle = fillColor;
  canvasContext.beginPath();
  canvasContext.arc(centerX, centerY, radius, 0, Math.PI*2, true);
  canvasContext.fill();
}

function drawBitmapCenteredAtLocationWithRotation(graphic, atX, atY,withAngle) {
  canvasContext.save(); // allows us to undo translate movement and rotate spin
  canvasContext.translate(atX,atY); // sets the point where our graphic will go
  canvasContext.rotate(withAngle); // sets the rotation
  canvasContext.drawImage(graphic,-graphic.width/2,-graphic.height/2); // center, draw
  canvasContext.restore(); // undo the translation movement and rotation since save()
}

function clear(){
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}



function draw_text(text, position, font="24px arial", color="black"){
  canvasContext.font = font; // TODO: replace this by proper font handling.
  canvasContext.fillStyle = color;
  canvasContext.fillText(text, position.x, position.y);
}

function canvas_center_position(){
  return {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
}

function draw_grid_lines(square_size, start_position={x:0, y:0}){
  const grid_line_color = "#aa00aa";
  canvasContext.strokeStyle = grid_line_color;

  for(let x = start_position.x; x < canvas.width; x += square_size){
    canvasContext.beginPath();
    canvasContext.moveTo(x, start_position.y);
    canvasContext.lineTo(x, canvas.height - start_position.y);
    canvasContext.stroke();
  }

  for(let y = start_position.y; y < canvas.height; y += square_size){
    canvasContext.beginPath();
    canvasContext.moveTo(start_position.x, y);
    canvasContext.lineTo(canvas.width - start_position.x, y);
    canvasContext.stroke();
  }

}

