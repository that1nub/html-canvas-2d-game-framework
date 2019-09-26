# HTML Canvas 2D Game Framework
An HTML game framework for a canvas.

# Installing
  1. Download `nub_gf.js`
  2. In the HTML file where the canvas is located, add `<script src="nub_gf.js"></script>` in the header
  3. Make a new JavaScript file in the directory
  4. In the body, after the canvas element is defined, add `<script src="game.js"></script>`, but replace `game.js` with whatever you named it.
  5. In the game's JavaScript file, add
```javascript 
const game = document.getElementById("game");
const ctx = game.getContext("2d");
setCanvas(game);
setContext(ctx);
```
  6. Done!
  
# Sample code:
### HTML:
```html
<html>
  <head>
    <script src="nub_gf.js"></script>
  </head>
  <body>
    <canvas id="game" width="256" height="256"></canvas>
    <script src="game.js"></script>
  </body>
</html>
```
### game.js (this will be updated later to have a simple game)
```javascript
const game = document.getElementById("game");
const ctx = game.getContext("2d");
setCanvas(game);
setContext(ctx);
```
### File structure
![screenshot](http://71.15.105.244/scp_2d/file_structure.png)
