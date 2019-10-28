// const _ = require("underscore");
const $ = require("jquery");
const jQuery = $;
// const Backbone = require("backbone");
// const BbLoc = require("backbone.localstorage");
const Two = require("two.js");
const Tween = require("@tweenjs/tween.js");
const Grid = require("./grid.js").Grid;
const App = require("./app.js");

const Vector = Two.Vector;

// add set_viewport function call to Two objects
/**
 * Set the transform of a Two.js object to view a specified coordinate range.
 * Sets scaling so the entire specified range, plus a proportional border, is
 * visible with a 1:1 aspect ratio.
 * @param {Two} two             - Two.js renderer instance
 * @param {Number} x_min        - Viewport minimum x-coordinate.
 * @param {Number} x_max        - Viewport maximum x-coordinate.
 * @param {Number} y_min        - Viewport minimum y-coordinate.
 * @param {Number} y_max        - Viewport maximum y-coordinate.
 * @param {Number} [border=0.1] - Extra border size, specified as a proportion
 *                                of the smaller of the x- and y-dimensions
 */
function setViewport(two, x_min, x_max, y_min, y_max, border = 0.1) {
  // set transform to view specified coordinate range
  // rescales to maintain 1:1 aspect ratio and include all of
  //   requested domain; border added on each side, specified
  //   as a proportion of the smaller dimension of the stage
  var w = two.width;
  var h = two.height;
  var border_px = Math.min(w, h) * border;
  var scale = Math.min(
    (w - 2 * border_px) / (x_max - x_min),
    (h - 2 * border_px) / (y_max - y_min)
  );
  var origin_x = scale * x_min - border_px;
  var origin_y = scale * y_min - border_px;
  two.scene.scale = scale;
  two.scene.translation = new Vector(-origin_x, -origin_y);
}

let display = $("#grid-display")[0];
var grid = new Grid(display, App);

let coords = [
  new Vector(0, 0),
  new Vector(1, 0),
  new Vector(0, 1),
  new Vector(1, 1),
  new Vector(2, 0),
  new Vector(3, 0),
  new Vector(4, 0),
  new Vector(0, 2),
  new Vector(0, 3)
];
let labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

for (let i = 0; i < coords.length; i++) {
  let v = coords[i];
  let label = labels[i];
  grid.add(v.x, v.y, label);
}

setViewport(grid.two, 0, 4, 0, 5);

// function animate(time) {
//   requestAnimationFrame(animate);
//   Tween.update(time);
// }
// requestAnimationFrame(animate);

let box = grid.get(4);
let anim1 = new Tween.Tween(box.render.main.translation)
  .to({ x: 2, y: 1 }, 1000)
  .easing(Tween.Easing.Quadratic.Out);

let anim2 = new Tween.Tween(box.render.main.translation)
  .to({ x: 2, y: 0 }, 1000)
  .easing(Tween.Easing.Quadratic.Out);

anim1.chain(anim2);
anim2.chain(anim1);
anim1.start();

grid.two.bind("update", function(frameCount) {
  // This code is called everytime two.update() is called.
  // Effectively 60 times per second.
  Tween.update();
});

module.exports = App;
