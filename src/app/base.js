const _ = require("underscore");
const $ = require("jquery");
const jQuery = $;
// const Backbone = require("backbone");
// const BbLoc = require("backbone.localstorage");
const Two = require("two.js");
const Tween = require("@tweenjs/tween.js");
const Grid = require("../grid.js").Grid;
const Config = require("./config.js");
const UndoQueue = require("../operations/undo_queue.js");
const CreateBoxOperation = require("../operations/create_box.js");

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

var app = {};

let display = $("#grid-display")[0];
app.display = display;

var grid = new Grid(display, Config);
app.grid = grid;
grid.add(1, 1, "H");
grid.remove(1, 1);

var init_queue = [];
var undo_queue = new UndoQueue();

// Initialize application to nontrivial state

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
  let op = new CreateBoxOperation(v.x, v.y, label);
  init_queue.push(op);
}

function execute(op) {
  op.execute(app);
  undo_queue.push(op);
}

function undo() {
  var op = undo_queue.pop_undo();
  if (!_.isUndefined(op)) {
    op.undo(app);
  }
}

function redo() {
  var op = undo_queue.pop_redo();
  if (!_.isUndefined(op)) {
    op.execute(app);
  }
}

// function execute_from_queue(queue) {
//   return e => {
//     if (queue.length > 0) {
//       var op = init_queue.pop();
//       op.execute(app);
//       undo_queue.push(op);
//     }
//   };
// }

function button1_onclick(e) {
  if (init_queue.length > 0) {
    var op = init_queue.pop();
    execute(op);
  }
}
function button2_onclick(e) {
  undo();
}

function button3_onclick(e) {
  redo();
}

let button1 = $("#input1");
button1.on("click", button1_onclick);
let button2 = $("#input2");
button2.on("click", button2_onclick);
let button3 = $("#input3");
button3.on("click", button3_onclick);

// while (init_queue.length > 0) {
//   var op = init_queue.pop();
//   op.execute(app);
//   undo_queue.push(op);
// }

// function add_interactivity(shape) {
//   var onclick = e => {
//     e.preventDefault();
//     console.log(e);
//   };
// }

setViewport(grid.two, 0, 4, 0, 5);

// function animate(time) {
//   requestAnimationFrame(animate);
//   Tween.update(time);
// }
// requestAnimationFrame(animate);

//////////// TEST ANIMATION ///
// let box = grid.get(4);
// let anim1 = new Tween.Tween(box.render.main.translation)
//   .to({ x: 2, y: 1 }, 1000)
//   .easing(Tween.Easing.Quadratic.Out);
//
// let anim2 = new Tween.Tween(box.render.main.translation)
//   .to({ x: 2, y: 0 }, 1000)
//   .easing(Tween.Easing.Quadratic.Out);
//
// anim1.chain(anim2);
// anim2.chain(anim1);
// anim1.start();
///////////// END TEST ANIMATION ///

grid.two.bind("update", function(frameCount) {
  // This code is called everytime two.update() is called.
  // Effectively 60 times per second.
  Tween.update();
});

// module.exports = app;
