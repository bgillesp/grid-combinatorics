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
    this._keymanager = {
      hotkeys: app.hotkeys,
      scope: "build_tool"
    };
    this._keymanager.hotkeys(
      "up,down,left,right,esc,backspace,0,1,2,3,4,5,6,7,8,9",
      this._keymanager.scope,
      (e, handler) => {
        this.on_keypress(e, handler);
      }
    );
  }

  _set_mode(mode) {
    const state = this._state;
    state.create_mode = false;
    state.delete_mode = false;
    state.edit_mode = false;
    this.remove_frame(); // probably refactor this guy
    if (mode == "create") {
      state.create_mode = true;
    } else if (mode == "delete") {
      state.delete_mode = true;
    } else if (mode == "edit") {
      state.edit_mode = true;
    }
  }

  on_mouse_down(e) {
    const { create_mode, delete_mode, edit_mode } = this._state;
    const { x, y, box, frame } = this.parse_mouse_event(e);
    if (e.button == 0) {
      if (box) {
        if (edit_mode) {
          if (!(frame && frame.x == x && frame.y == y)) {
            this.remove_frame();
            this.make_frame(e);
          }
        } else {
          this._set_mode("edit");
          this.make_frame(e);
          // only take keyboard input in edit mode
          this._keymanager.hotkeys.setScope(this._keymanager.scope);
        }
      } else {
        if (edit_mode) {
          this._set_mode(null);
        } else {
          this._set_mode("create");
          this.make_box(e);
        }
      }
    } else if (e.button == 2) {
      if (this._state.edit_mode) {
        this._set_mode(null);
      } else {
        this._set_mode("delete");
        this.delete_box(e);
      }
    }
    this._state.mouse_pressed = true;
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
    if (this._state.create_mode || this._state.delete_mode) {
      this._set_mode(null);
    }
    this._state.mouse_pressed = false;
  }

  on_keypress(e, handler) {
    e.preventDefault();
    if (this._state.edit_mode) {
      switch (handler.key) {
        case "up":
          console.log("You pressed up");
          break;
        case "down":
          console.log("You pressed down");
          break;
        case "left":
          console.log("You pressed left");
          break;
        case "right":
          e.preventDefault();
          console.log("You pressed right");
          break;
        case "esc":
          // end edit mode
          this.remove_frame(e);
          this._keymanager.hotkeys.setScope("all");
          console.log("Exiting edit mode");
          break;
        case "backspace":
          var box = this._grid.get_highlighted_box();
          if (box) {
            var label = box.label;
            if (label.length > 0) {
              label = label.substring(0, label.length - 1);
              box.set_label(label);
            }
          }
          break;
        default:
          var box = this._grid.get_highlighted_box(),
            val = String(handler.key);
          if (box) {
            var label = box.label;
            if (label.length < 2) {
              label += val;
              box.set_label(label);
            }
          }
          break;
      }
    }
  }

  has_box(e) {
    const { box } = this.parse_mouse_event(e);
    return !!box;
  }

  // make a box with no label at the location of e, if possible
  make_box(e) {
    const { x, y, box } = this.parse_mouse_event(e);
    if (!box) {
      let create_op = new CreateBoxOperation(x, y);
      this._app.execute(create_op);
    }
  }

  delete_box(e) {
    const { x, y, box } = this.parse_mouse_event(e);
    if (box) {
      let delete_op = new DeleteBoxOperation(x, y);
      this._app.execute(delete_op);
    }
  }

  make_frame(e) {
    const { x, y } = this.parse_mouse_event(e);
    let frame = this.get_frame();
    if (!frame || (frame.x != x || frame.y != y)) {
      this._grid.add_frame(x, y);
    }
  }

  remove_frame() {
    this._grid.remove_frame();
  }

  get_frame() {
    return this._grid.get_frame();
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
