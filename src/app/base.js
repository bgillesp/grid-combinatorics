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
const ClearGridOperation = require("../operations/clear_grid.js");
const SimpleAnimationManager = require("../placeholder/simple_animation_manager.js");
const DiagnosticsTool = require("../tools/diagnostics_tool.js");
const MoveTool = require("../tools/move_tool.js");
const BuildTool = require("../tools/build_tool.js");

var app = {};
app.hotkeys = hotkeys;

let display = $("#grid-display")[0];
app.display = display;

let grid = new Grid(display, Config);
app.grid = grid;

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

hotkeys("ctrl+z", "all", () => {
  undo();
});
hotkeys("ctrl+y", "all", () => {
  redo();
});

let grid_handler = null;
let move_tool = new MoveTool(app);
let build_tool = new BuildTool(app);

let build_tool_radio = $("#build_tool_radio");
build_tool_radio.on("click", select_build_tool);
let move_tool_radio = $("#move_tool_radio");
move_tool_radio.on("click", select_move_tool);

function reset_tool() {
  if (grid_handler) grid_handler.reset();
}

function select_tool(tool) {
  if (grid_handler) grid_handler.disable();
  if (tool) tool.enable();
  grid_handler = tool;
}

function select_build_tool(e) {
  build_tool_radio[0].checked = true;
  select_tool(build_tool);
}

function select_move_tool(e) {
  move_tool_radio[0].checked = true;
  select_tool(move_tool);
}

select_build_tool(build_tool);

hotkeys("b", "all", () => {
  select_build_tool();
});
hotkeys("m", "all", () => {
  select_move_tool();
});

// Initialize overlay mouse interaction

let grid_overlay = $("#grid-overlay");
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

function undo_click(e) {
  undo();
}

function redo_click(e) {
  redo();
}

function clear_click(e) {
  reset_tool();
  let clear_grid = new ClearGridOperation();
  execute(clear_grid);
}

let undo_button = $("#undo");
undo_button.on("click", undo_click);
let redo_button = $("#redo");
redo_button.on("click", redo_click);
let clear_button = $("#clear");
clear_button.on("click", clear_click);

// function animate(time) {
//   requestAnimationFrame(animate);
//   Tween.update(time);
// }
// requestAnimationFrame(animate);

var animation_group = app.grid.get_animation_manager().get_tween_group();
grid.two.bind("update", function(frameCount) {
  // This code is called everytime two.update() is called.
  // Effectively 60 times per second.
  animation_group.update();
});

// module.exports = app;
