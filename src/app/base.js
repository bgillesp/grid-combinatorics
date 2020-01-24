const _ = require("underscore");
const $ = require("jquery");
const jQuery = $;
const hotkeys = require("hotkeys-js");
// const Backbone = require("backbone");
// const BbLoc = require("backbone.localstorage");
const Two = require("two.js");
const Vector = Two.Vector;
const Tween = require("@tweenjs/tween.js");
const Grid = require("../grid.js").Grid;
const Config = require("./config.js");
const UndoQueue = require("../operations/undo_queue.js");
const CreateBoxOperation = require("../operations/create_box.js");
const MoveBoxOperation = require("../operations/move_box.js");
const SimpleAnimationManager = require("../placeholder/simple_animation_manager.js");
const DiagnosticsTool = require("../tools/diagnostics_tool.js");
const MoveTool = require("../tools/move_tool.js");
const BuildTool = require("../tools/build_tool.js");

var app = {};
app.hotkeys = hotkeys;
// hotkeys("*", "scope", (e, handler) => {
//   console.log("HOTKEYS WORKS");
// });

let display = $("#grid-display")[0];
app.display = display;

var grid = new Grid(display, Config);
app.grid = grid;

var grid_overlay = $("#grid-overlay");
grid_overlay.on("contextmenu", () => {
  return false;
});

function grid_mousedown(e) {
  grid_handler.on_mouse_down(e);
}

function grid_mousemove(e) {
  grid_handler.on_mouse_move(e);
}

function grid_mouseup(e) {
  grid_handler.on_mouse_up(e);
}

grid_overlay.on("mousedown", grid_mousedown);
grid_overlay.on("mousemove", grid_mousemove);
grid_overlay.on("mouseup", grid_mouseup);

var undo_queue = new UndoQueue();

function execute(op) {
  op.execute(app);
  undo_queue.push(op);
}
app.execute = execute;

function undo() {
  var op = undo_queue.pop_undo();
  if (!_.isNull(op)) {
    op.undo(app);
  }
}
app.undo = undo;

function redo() {
  var op = undo_queue.pop_redo();
  if (!_.isNull(op)) {
    op.execute(app);
  }
}
app.redo = redo;

// Initialize application to nontrivial state

// let coords = [
//   new Vector(0, 0),
//   new Vector(1, 0),
//   new Vector(0, 1),
//   new Vector(1, 1),
//   new Vector(2, 0),
//   new Vector(3, 0),
//   new Vector(4, 0),
//   new Vector(0, 2),
//   new Vector(0, 3)
// ];
// let labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
//
// let coords = [
//   new Vector(0, 0),
//   new Vector(0, 1),
//   new Vector(0, 2),
//   new Vector(0, 3),
//   new Vector(0, 4),
//   new Vector(0, 5),
//   new Vector(0, 6),
//   new Vector(0, 7),
//   new Vector(1, 0),
//   new Vector(1, 1),
//   new Vector(1, 2),
//   new Vector(1, 3),
//   new Vector(1, 4),
//   new Vector(1, 5),
//   new Vector(1, 6),
//   new Vector(1, 7),
//   new Vector(2, 0),
//   new Vector(2, 1),
//   new Vector(2, 2),
//   new Vector(2, 3),
//   new Vector(2, 4),
//   new Vector(2, 5),
//   new Vector(2, 6),
//   new Vector(2, 7)
// ];
//
// for (let i = 0; i < coords.length; i++) {
//   let v = coords[i];
//   let label = "";
//   let op = new CreateBoxOperation(v.x, v.y, label);
//   execute(op);
// }

// Add movement operations to execute, undo, redo, etc.
//
// let moves = [
//   [new Vector(2, 0), new Vector(2, 1)],
//   [new Vector(1, 0), new Vector(2, 0)],
//   [new Vector(0, 0), new Vector(1, 0)],
//   [new Vector(0, 2), new Vector(1, 2)],
//   [new Vector(0, 1), new Vector(0, 2)],
//   [new Vector(1, 2), new Vector(2, 2)],
//   [new Vector(1, 1), new Vector(1, 2)],
//   [new Vector(1, 0), new Vector(1, 1)]
// ];
// moves.reverse();
//
// moves.forEach(([old_coord, new_coord]) => {
//   let [{ x: old_x, y: old_y }, { x: new_x, y: new_y }] = [old_coord, new_coord];
//   let op = new MoveBoxOperation(old_x, old_y, new_x, new_y);
//   undo_queue.redo_queue.push(op);
// });

let viewport_params = grid.set_viewport(0, 4, 0, 5);
// grid.two.scene.scale *= -1;

// function execute_from_queue(queue) {
//   return e => {
//     if (queue.length > 0) {
//       var op = init_queue.pop();
//       op.execute(app);
//       undo_queue.push(op);
//     }
//   };
// }

function undo_click(e) {
  undo();
}

function redo_click(e) {
  redo();
}

let undo_button = $("#undo");
undo_button.on("click", undo_click);
let redo_button = $("#redo");
redo_button.on("click", redo_click);

var move_tool = new MoveTool(app);
var build_tool = new BuildTool(app);

function select_build_tool(e) {
  grid_handler = build_tool;
}

function select_move_tool(e) {
  grid_handler = move_tool;
}

let build_tool_radio = $("#build_tool_radio");
build_tool_radio.on("click", select_build_tool);
let move_tool_radio = $("#move_tool_radio");
move_tool_radio.on("click", select_move_tool);

var grid_handler = build_tool;
build_tool_radio[0].checked = true;

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

// module.exports = app;
