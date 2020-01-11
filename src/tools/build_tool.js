const GridTool = require("./grid_tool.js");
const CreateBoxOperation = require("../operations/create_box.js");
const DeleteBoxOperation = require("../operations/delete_box.js");

class BuildTool extends GridTool {
  constructor(app) {
    super(app);
    this._state = {
      mouse_pressed: false,
      create_mode: false,
      delete_mode: false,
      edit_mode: false
    };
  }

  on_mouse_down(e) {
    if (e.button == 0) {
      if (this.has_box(e)) {
        this._set_mode("edit");
        // initialize edit mode
      } else {
        this._set_mode("create");
        this.make_box(e);
      }
    } else if (e.button == 2) {
      this._set_mode("delete");
      this.delete_box(e);
    }
    this._state.mouse_pressed = true;
  }

  _set_mode(mode) {
    const state = this._state;
    state.create_mode = false;
    state.delete_mode = false;
    state.edit_mode = false;
    if (mode == "create") {
      state.create_mode = true;
    } else if (mode == "delete") {
      state.delete_mode = true;
    } else if (mode == "edit") {
      state.edit_mode = true;
    }
  }

  on_mouse_move(e) {
    if (this._state.mouse_pressed) {
      if (this._state.create_mode) {
        this.make_box(e);
      } else if (this._state.delete_mode) {
        this.delete_box(e);
      } else if (this._state.edit_mode) {
      }
    }
  }

  on_mouse_up(e) {
    this._set_mode(null);
    this._state.mouse_pressed = false;
  }

  has_box(e) {
    const loc = this.get_local_coords(e);
    return !!this._grid.get(Math.floor(loc.x), Math.floor(loc.y));
  }

  // make a box with no label at the location of e, if possible
  make_box(e) {
    const loc = this.get_local_coords(e);
    const [x, y] = [Math.floor(loc.x), Math.floor(loc.y)];
    const box = this._grid.get(x, y);
    if (!box) {
      let create_op = new CreateBoxOperation(x, y);
      this._app.execute(create_op);
    }
  }

  delete_box(e) {
    const loc = this.get_local_coords(e);
    const [x, y] = [Math.floor(loc.x), Math.floor(loc.y)];
    const box = this._grid.get(x, y);
    if (box) {
      let delete_op = new DeleteBoxOperation(x, y);
      this._app.execute(delete_op);
    }
  }
}

module.exports = BuildTool;

// if left click on empty square, enter "create boxes" mode, and each tick check if a
// box can be created at the current coordinates; if so, create it.  No labels.

// if right click on a full square, enter "delete boxes" mode, and each tick
// check if a box can be deleted at the current coordinates; if so, delete it.

// if left click on non-empty square, enter "edit" mode.
//   current box is slightly highlighted (how?)
//   any alphanumeric keyboard input appends to label
//   delete key truncates label
//   arrow keys move current location
//   tab moves one position to the right
//     or wraps if no square to right, but is a square on a lower row
//     does nothing if at last square on bottom row
//   shift+tab inverts this
//   enter moves one position down
//   shift+enter moves one position up
//   left click off of square to exit mode, or esc
