/*

  HTML Canvas 2D Game Framework
  Developed by Nub with help from Slime_Cubed

*/

"use strict";

// Big table that contains all the framework variables
let ngf = {};

ngf.objects = new Map(); // Map containing all objects.
ngf.runningAnims = new Map(); // Map containing animations.
ngf.indexes = 0; // Existing objects. Goes up one every time something is created.
ngf.mouse = {pos: [-1, -1], clicked: false}; // Mouse tracking
ngf.canvas = null; // The canvas to add the mouse tracking to.
ngf.context = null; // The context to draw on (from canvas).
ngf.fps = 0; // 0 is as many frames as possible; any higher number is an actual fps.
ngf.nextTick = Date.now(); // When the next tick should happen.
ngf.tickRate = 20; // Tickrate of every `object.think()`

// function: v(x, y)
//  -> Vector, used for defining pos and size.
function v(x, y = x){
  return [x, y];
}

// function rgb(red, green, blue)
//  -> Used for defining color.
function rgb(r, g = r, b = r){
  return [r, g, b];
}

// function isHovering
//  -> Used to check if the mouse is over a canvas element.
function isHovering(obj){
  // If the object, object position, object size/radius, or mouse don't exist, exit the function.
  if(!obj || !obj.pos || !(obj.size || obj.radius) || !ngf.mouse) return false;

  // Since text displays from bottom left instead of top left, we want to account for that.
  if(obj instanceof Text) {
    ngf.context.font = obj.font;
    // h (height) = the height of the text, the first part of the font before the px.
    let h = Number(ngf.context.font.substring(0, ngf.context.font.split(/ +/g)[0].length - 2));
    return (ngf.mouse.pos[0] >= obj.pos[0] && ngf.mouse.pos[0] <= obj.pos[0] + obj.size[0]) && (ngf.mouse.pos[1] >= obj.pos[1] + h && ngf.mouse.pos[1] <= (obj.pos[1] + h) + obj.size[1]);
    ngf.context.font = "16px Arial";

    // Since the circle doesn't have a size, we want to use the radius.
  } else if(obj instanceof Circle){
    let x = obj.pos[0] - obj.radius;
    let y = obj.pos[1] - obj.radius;
    return (ngf.mouse.pos[0] >= x && ngf.mouse.pos[0] <= x + obj.radius * 2) && (ngf.mouse.pos[1] >= y && ngf.mouse.pos[1] <= y + obj.radius * 2);
  }

  return (ngf.mouse.pos[0] >= obj.pos[0] && ngf.mouse.pos[0] <= obj.pos[0] + obj.size[0]) && (ngf.mouse.pos[1] >= obj.pos[1] && ngf.mouse.pos[1] <= obj.pos[1] + obj.size[1]);
}

// function lerp(startValue, endValue, progress)
//  -> Linear Interpolation, used for animations.
function lerp(start, end, prog){
  return start * (1 - prog) + end * prog;
}

// Used for easing animations (currently unused)
function smoothStep(x) {
  return -2 * Math.pow(x, 3) + 3 * Math.pow(x, 2);
}


// function setCanvas(canvas)
//  -> This has all the mouse events.
function setCanvas(canvas){
  ngf.canvas = canvas;

  // Mouse movement tracking
  ngf.canvas.onmousemove = function(e){
    let rect = this.getBoundingClientRect();
    ngf.mouse.pos[0] = (e.clientX - rect.x) / rect.width * this.width;
    ngf.mouse.pos[1] = (e.clientY - rect.y) / rect.height * this.height;
  }

  // Track mouse clicks
  ngf.canvas.onmousedown = function(){
    ngf.mouse.clicked = true;
  }

  // Track mouse releases
  window.onmouseup = function(){
    ngf.mouse.clicked = false;
  }

  // Track when the mouse leaves the canvas
  ngf.canvas.onmouseout = function(){
    ngf.mouse.clicked = false;
    ngf.mouse.pos = [-1, -1];
  }
}

// Set the context, this is how we actually draw.
function setContext(ctx){
  ngf.context = ctx;
  ngf.context.font = "16px Arial";
  ngf.context.fillStyle = "rgb(255, 255, 255)";
  ngf.context.imageSmoothingEnabled = false;
  ngf.context.lineWidth = 1;
  ngf.context.strokeStyle = "rgb(255, 255, 255)";
}


// function setFPS(frames_per_second)
//  -> Set the canvas refresh rate
function setFPS(fps = 0){
  ngf.fps = fps;
}

// function setTickRate(milliseconds)
//  -> Set the thinking rate of events (any entity.think();)
function setTickRate(ms = 20){
  ngf.tickRate = ms;
}

// tick function
function tick(){
  // Update every object
  ngf.objects.forEach((obj, id, map) => {
    if(obj && obj.think instanceof Function) obj.think();
  });

  let now = Date.now();

  // Calculate next tick
  ngf.nextTick += ngf.tickRate;

  setTimeout(tick, Math.max(ngf.nextTick - now, 0));
}
tick();

// function getObjectByID(id)
//  -> get an object by id
function getObjectByID(id){
  return ngf.objects.get(id);
}

// function deleteObj(id)
//  -> delete an object by id
function deleteObj(id){
  delete ngf.objects.delete(id);
}


// Parent class entity. Everything must use this.
// Tree:
// Entity
//   Graphic
//     Box
//       Button
//       CheckBox
//       TextEntry
//       Img
//         SpriteSheet
//     Text
//     Circle
//     Poly
//     Line
//   Animation
//   NPC
//   PlayerController
class Entity {
  constructor(){
    this.id = ngf.indexes++;
  }
}

// Graphic class, inherits from Entity
class Graphic extends Entity {
  constructor(par){
    // Variables
    super();
    this.pos = v(0);
    this.color = rgb(255);
    this.visible = true;

    // Copy the values in par to this
    Object.assign(this, par);

    // Internal Variables
    this.isClicked = false;
    this.isHovered = false;
    this.enabled = true;
    this.clickedTicks = 0;

    // Assigning
    ngf.objects.set(this.id, this);
  }
  think(){
    if(!this.enabled) return;
    // If hovering over this object
    if(isHovering(this)){
      this.isHovered = true;
      this.onHover();
      // If they are clicking on the mouse
      if(ngf.mouse.clicked){
        // Call `onClick` if not already done so
        if(!this.isClicked){
          this.isClicked = true;
          this.onClick();
        }
        // Call `onClickHold`
        this.onClickHold(this.clickedTicks++);
      } else { // If mouse isn't clicked
        // Call onRelease
        if(this.isClicked) this.onRelease();
        this.isClicked = false;
        this.clickedTicks = 0;
      }
    } else { // If mouse isn't even on the object
      if(this.isHovered) this.onStopHover();
      if(this.isClicked) this.onRelease();
      this.isHovered = false;
      this.isClicked = false;
      this.clickedTicks = 0;
    }
  }
  setID(id = ngf.indexes++){
    ngf.objects.delete(this.id);
    this.id = id;
    ngf.objects.set(id, this);
  }

  // These are so you don't get undefined errors
  onClick(){}
  onClickHold(){}
  onRelease(){}
  onHover(){}
  onStopHover(){}
  draw(){}
}

// Box class, inherits from Graphic
class Box extends Graphic {
  constructor(par){
    super(par);

    if(!this.size) this.size = v(16);
    if(!this.radius) this.radius = 0;
  }
  draw(){
    if(this.radius === 0){
      ngf.context.fillStyle = "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")";
      ngf.context.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1], this.color);
    } else {
      ngf.context.fillStyle = "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")";
      let x = this.pos[0];
      let y = this.pos[1];
      let w = this.size[0];
      let h = this.size[1];
      ngf.context.beginPath();
      ngf.context.moveTo(x, y + this.radius);
      ngf.context.lineTo(x, y + h - this.radius);
      ngf.context.arcTo (x, y + h, x + this.radius, y + h, this.radius);
      ngf.context.lineTo(x + w - this.radius, y + h);
      ngf.context.arcTo (x + w, y + h, x + w, y + h - this.radius, this.radius);
      ngf.context.lineTo(x + w, y + this.radius);
      ngf.context.arcTo (x + w, y, x + w - this.radius, y, this.radius);
      ngf.context.lineTo(x + this.radius, y);
      ngf.context.arcTo (x, y, x, y + this.radius, this.radius);
      ngf.context.fill();
      ngf.context.closePath();
    }
  }
}

// Button class, inherits from Box
class Button extends Box {
  constructor(par){
    super(par);

    if(!this.text) this.text = "Lorem";
    if(!this.font) this.font = "8px Arial";
    if(!this.textColor) this.textColor = rgb(0);
  }
  draw(){
    super.draw();

    ngf.context.font = this.font;
    ngf.context.fillStyle = "rgb(" + this.textColor[0] + "," + this.textColor[1] + "," + this.textColor[2] + ")";
    let w = ngf.context.measureText(this.text).width;
    let h = Number(ngf.context.font.substring(0, ngf.context.font.split(/ +/g)[0].length - 2));
    ngf.context.fillText(this.text, this.pos[0] + (this.size[0]/2) - (w/2), this.pos[1] + (this.size[1]/2) + (h/3));
  }
}

// Img class, inherits from Box
class Img extends Box {
  constructor(par){
    super(par)

    // Variables
    if(this.url){
      let image = new Image();
      image.src = this.url;
      image.onload = () => {
        this.img = image;
      }
    }
  }
  draw(){
    if(this.img) {
      ngf.context.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }
  }
}

// Text class, inherits from Graphic
class Text extends Graphic {
  constructor(par){
    super(par);

    if(!this.text) this.text = "Lorem Ipsum";
    if(!this.textColor) this.textColor = rgb(0);
    if(!this.font) this.font = "16px Arial";
  }
  draw(){
    ngf.context.font = this.font;
    ngf.context.fillStyle = "rgb(" + this.textColor[0] + "," + this.textColor[1] + "," + this.textColor[2] + ")";;
    ngf.context.fillText(this.text, this.pos[0], this.pos[1] + Number(ngf.context.font.substring(0, ngf.context.font.split(/ +/g)[0].length - 2)));
  }
}

// Circle class, inherits from Graphic
class Circle extends Graphic {
  constructor(par){
    super(par);

    if(!this.radius) this.radius = 16;
  }
  draw(){
    ngf.context.fillStyle = "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")";;
    ngf.context.beginPath();
    ngf.context.arc(this.pos[0], this.pos[1], this.radius, 0, Math.PI * 2);
    ngf.context.fill();
    ngf.context.closePath();
  }
}

// Line class, inherits from Graphic
class Line extends Graphic {
  constructor(par){
    super(par);

    if(!this.start) this.start = v(4);
    if(!this.end) this.end = v(16);
    if(!this.weight) this.weight = 1;
  }
  draw(){
    ngf.context.strokeStyle = "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")";
    ngf.context.lineWidth = this.weight;

    ngf.context.beginPath();
    ngf.context.moveTo(this.start[0], this.start[1]);
    ngf.context.lineTo(this.end[0], this.end[1]);
    ngf.context.stroke();
    ngf.context.closePath();
  }
}

// Poly class, inherits from Graphic
class Poly extends Graphic {
  constructor(par){
    super(par);

    if(!this.points) this.points = [];
  }
  draw(){
    ngf.context.fillStyle = "rgb(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + ")";

    ngf.context.beginPath();
    for(let i = 0; i < this.points.length; i++){
      if(i === 0){
        ngf.context.moveTo(this.points[i][0], this.points[i][1]);
      } else if(i === this.points.length - 1) {
        ngf.context.lineTo(this.points[i][0], this.points[i][1]);
        ngf.context.fill();
        break;
      } else {
        ngf.context.lineTo(this.points[i][0], this.points[i][1]);
      }
    }
    ngf.context.closePath();
  }
}

// Animation class, inherits from Entity
class Animation extends Entity {
  constructor(par){
    super();

    // Variables
    this.obj = {};
    this.property = 0;
    this.end = 0;
    this.dur = 300;

    // Internal Variables
    this.start = this.obj[this.obj];
    this.startTime = 0;
    this.currentTime = 0;

    // Copy the values in par to this
    Object.assign(this, par);
  }
  update(){
    this.currentTime = Date.now() - this.startTime;
    let prog = this.currentTime / this.dur;
    this.obj[this.property] = lerp(this.start, this.end, prog);
    if(this.currentTime >= this.dur){
      this.stop(true);
    }
  }
  play(){
    this.startTime = Date.now();
    this.start = this.obj[this.property];
    ngf.runningAnims.set(this.id, this);
  }
  stop(mte = false){
    if(mte) this.obj[this.property] = this.end;
    ngf.runningAnims.delete(this.id);
    if(this.onFinish instanceof Function) this.onFinish();
  }
  setID(id = ngf.indexes++){
    ngf.runningAnims.delete(this.id);
    this.id = id;
    ngf.runningAnims.set(id, this);
  }

  onFinish(){}
}


// Rendering
function drawFrame(){
  if(ngf.context){ // If the rendering context is defined
    // We want to delete everyting (refresh) so nothing is distorted from animating.
    ngf.context.clearRect(0, 0, ngf.canvas.width, ngf.canvas.height);

    // Update any animation
    ngf.runningAnims.forEach((anim, id, map) => {
      anim.update();
    });

    // Check if they are on a mouse.
    ngf.objects.forEach((obj, id, map) => {
      if(obj.visible && obj.draw instanceof Function) obj.draw();
    });
  }

  // Refresh at 1000/fps if fps > 0
  if(ngf.fps > 0) setTimeout(() => {
    requestAnimationFrame(drawFrame);
  }, Math.round(1000/ngf.fps));
  // Just refresh as soon as the frame is finished if the fps is < 0
  else requestAnimationFrame(drawFrame);
}
requestAnimationFrame(drawFrame);
