// This file contains the graphic system implementation.
// It provides utilities to display anything graphic.


export {
  initialize,
  clear,
  Sprite,
  TileGrid,
  draw_text,
  canvas_center_position,
};

import * as spatial from "./spatial.js"

var canvas, canvasContext;

class Sprite {
  transform = new spatial.Transform();
  size = new spatial.Vector2({ x:10.0, y: 10.0 });
  source_image = undefined; // If null, draw a colored rectangle
  source_transform = new spatial.Transform(); // not sure we'll need this one in the end
  source_size = new spatial.Vector2({ x:1.0, y: 1.0 }); // ?

  get position() { return this.transform.position; }
  set position(new_position) { this.transform.position = new_position; }

  draw(){ // TODO: take a camera into account
    if(this.source_image){
      // TODO: complete by using all the sprite info
      canvasContext.save(); // TODO : this should be done by the caller, probably
      canvasContext.translate(this.transform.position.x, this.transform.position.y);
      canvasContext.rotate(this.transform.orientation.degrees); // TODO: check if t's radian or degrees
      // canvasContext.drawImage(this.source_image,this.size.width,this.size.height);
      canvasContext.drawImage(this.source_image, this.source_image.width, this.source_image.height); // TODO: replace by specified size
      canvasContext.restore();
    } else {
      // We don't have an image so we draw a colored rectangle instead.
      const empty_sprite_color = "grey"; // TODO: use a proper color, maybe fushia
      colorRect(new spatial.Rectangle( { position: this.position, size: this.size } ), empty_sprite_color);
    }
  }
};

// 2D grid of sprites to display as one block.
// Allows opportunities for optimization by generating one sprite
// with the part of the grid we actually need to display.
class TileGrid
{
  background_color = "orange"; // Color displayed where there is no sprite in the grid.

  constructor(info = {}){

  }

  draw(){ // TODO: take a camera into account
    // TODO: write a proper implementation :P
    colorRect(new spatial.Rectangle({ position: {x:0, y:0}, size: {x: canvas.width, y: canvas.height }}) , this.background_color);
  }

};


function initialize(){
  if(canvasContext || canvas)
    throw "Graphic system already initialized.";

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
