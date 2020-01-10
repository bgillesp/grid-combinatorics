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
const MoveBoxOperation = require("../operations/move_box.js");
const SimpleAnimationManager = require("../placeholder/simple_animation_manager.js");
const DiagnosticsTool = require("../tools/diagnostics_tool.js");
const MoveTool = require("../tools/move_tool.js");

const Vector = Two.Vector;

var app = {};

let display = $("#grid-display")[0];
app.display = display;

var grid = new Grid(display, Config);
app.grid = grid;

var grid_overlay = $("#grid-display-overlay");
var grid_display = $("#grid-display");

// var $div = $("<div>", { id: "grid-display-overlay" });

var grid_handler = new DiagnosticsTool(app);

function grid_mousedown(e) {
  console.log("mousedown");
  grid_handler.on_mouse_down(e);
}

function grid_mousemove(e) {
  grid_handler.on_mouse_move(e);
}

function grid_mouseup(e) {
  grid_handler.on_mouse_up(e);
  console.log("mouseup");
}

console.log(display);

grid_display.on("mousedown", grid_mousedown);
grid_display.on("mousemove", grid_mousemove);
grid_display.on("mouseup", grid_mouseup);

var init_queue = [];
var undo_queue = new UndoQueue();

function execute(op) {
  op.execute(app);
  undo_queue.push(op);
}

function undo() {
  var op = undo_queue.pop_undo();
  if (!_.isNull(op)) {
    op.undo(app);
  }
}

function redo() {
  var op = undo_queue.pop_redo();
  if (!_.isNull(op)) {
    op.execute(app);
  }
}

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
  op.execute(app);
}

// Add movement operations to execute, undo, redo, etc.

let moves = [
  [new Vector(2, 0), new Vector(2, 1)],
  [new Vector(1, 0), new Vector(2, 0)],
  [new Vector(0, 0), new Vector(1, 0)],
  [new Vector(0, 2), new Vector(1, 2)],
  [new Vector(0, 1), new Vector(0, 2)],
  [new Vector(1, 2), new Vector(2, 2)],
  [new Vector(1, 1), new Vector(1, 2)],
  [new Vector(1, 0), new Vector(1, 1)]
];
moves.reverse();

moves.forEach(([old_coord, new_coord]) => {
  let [{ x: old_x, y: old_y }, { x: new_x, y: new_y }] = [old_coord, new_coord];
  let op = new MoveBoxOperation(old_x, old_y, new_x, new_y);
  undo_queue.redo_queue.push(op);
});

let viewport_params = grid.set_viewport(0, 4, 0, 5);

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

var animation_group = app.grid.get_animation_manager().get_tween_group();
grid.two.bind("update", function(frameCount) {
  // This code is called everytime two.update() is called.
  // Effectively 60 times per second.
  animation_group.update();
});

grid.two.bind("onmousedown", function() {
  console.log("mousedown");
});

// module.exports = app;
