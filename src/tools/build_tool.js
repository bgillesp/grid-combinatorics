const GridTool = require("./grid_tool.js");
const CreateBoxOperation = require("../operations/create_box.js");
const DeleteBoxOperation = require("../operations/delete_box.js");
const SetBoxLabelOperation = require("../operations/set_box_label.js");

const edit_mode_hotkeys = [
  "up",
  "down",
  "left",
  "right",
  "tab",
  "shift+tab",
  "enter",
  "shift+enter",
  "space",
  "esc",
  "backspace",
  "*"
];

const tab_stop_reset_hotkeys = ["up", "down", "left", "right"];

class BuildTool extends GridTool {
  constructor(app) {
    super(app);
    this._state = {
      mouse_pressed: false,
      create_mode: false,
      delete_mode: false,
      edit_mode: false,
      tab_stop: null
    };
    this._keymanager = {
      hotkeys: app.hotkeys,
      scope: "build_tool"
    };
    let e_hotkeys = "";
    edit_mode_hotkeys.forEach((str, i) => {
      e_hotkeys += str;
      if (i != edit_mode_hotkeys.length - 1) e_hotkeys += ",";
    });
    this._keymanager.hotkeys(
      e_hotkeys,
      this._keymanager.scope,
      (e, handler) => {
        this.on_keypress(e, handler);
      }
    );
  }

  enable() {
    super.enable();
  }

  disable() {
    super.disable();
    this._set_mode(null);
    // this._keymanager.hotkeys.setScope("all");
  }

  _set_mode(mode) {
    const state = this._state;
    switch (mode) {
      case "create":
        state.create_mode = true;
        state.delete_mode = false;
        state.edit_mode = false;
        state.tab_stop = null;
        this._grid.remove_frame();
        this._keymanager.hotkeys.setScope("all");
        break;
      case "delete":
        state.create_mode = false;
        state.delete_mode = true;
        state.edit_mode = false;
        state.tab_stop = null;
        this._grid.remove_frame();
        this._keymanager.hotkeys.setScope("all");
        break;
      case "edit":
        state.create_mode = false;
        state.delete_mode = false;
        state.edit_mode = true;
        state.tab_stop = null;
        this._grid.remove_frame();
        this._keymanager.hotkeys.setScope(this._keymanager.scope);
        break;
      default:
        state.create_mode = false;
        state.delete_mode = false;
        state.edit_mode = false;
        state.tab_stop = null;
        this._grid.remove_frame();
        this._keymanager.hotkeys.setScope("all");
        break;
    }
  }

  on_mouse_down(e) {
    const { x, y, box, frame } = this.parse_mouse_event(e);
    const { create_mode, delete_mode, edit_mode } = this._state;
    if (e.ctrlKey) {
      if (e.button == 0) {
        this._set_mode("create");
        if (this._grid.grid_coords_visible(x, y)) {
          this.make_box(x, y);
        }
      } else if (e.button == 2) {
        this._set_mode("delete");
        if (box) this.delete_box(x, y);
      }
    } else {
      if (e.button == 0) {
        if (this._grid.grid_coords_visible(x, y)) {
          if (edit_mode) {
            if (!(frame && frame.x == x && frame.y == y)) {
              this._grid.remove_frame();
              this._grid.add_frame(x, y);
            }
          } else {
            this._set_mode("edit");
            this._grid.add_frame(x, y);
          }
        }
      } else if (e.button == 2) {
        this._set_mode("delete");
        if (box) this.delete_box(x, y);
      }
    }
    // if (e.button == 0) {
    //   // left click
    //   if (e.ctrlKey) {
    //     // ctrl
    //     if (this._grid.grid_coords_visible(x, y)) {
    //       if (edit_mode) {
    //         if (!(frame && frame.x == x && frame.y == y)) {
    //           this._grid.remove_frame();
    //           this._grid.add_frame(x, y);
    //         }
    //       } else {
    //         this._set_mode("edit");
    //         this._grid.add_frame(x, y);
    //       }
    //     }
    //   } else {
    //     // not ctrl
    //     if (box) {
    //       if (edit_mode) {
    //         if (!(frame && frame.x == x && frame.y == y)) {
    //           this._grid.remove_frame();
    //           this._grid.add_frame(x, y);
    //         }
    //       } else {
    //         this._set_mode("edit");
    //         this._grid.add_frame(x, y);
    //       }
    //     } else {
    //       if (edit_mode) {
    //         this._set_mode(null);
    //       } else {
    //         this._set_mode("create");
    //         if (this._grid.grid_coords_visible(x, y)) {
    //           this.make_box(x, y);
    //         }
    //       }
    //     }
    //   }
    // } else if (e.button == 2) {
    //   // right click
    //   if (this._state.edit_mode) {
    //     this._set_mode(null);
    //   } else {
    //     this._set_mode("delete");
    //     if (box) this.delete_box(x, y);
    //   }
    // }
    this._state.mouse_pressed = true;
  }

  on_mouse_move(e) {
    const { x, y, box } = this.parse_mouse_event(e);
    if (this._state.mouse_pressed) {
      if (this._state.create_mode) {
        if (this._grid.grid_coords_visible(x, y) && !box) {
          this.make_box(x, y);
        }
      } else if (this._state.delete_mode) {
        if (box) {
          this.delete_box(x, y);
        }
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
    // (only takes keyboard input in edit mode)
    if (this._state.edit_mode) {
      const frame = this._grid.get_frame(),
        tab_stop = this._state.tab_stop,
        x = frame.x,
        y = frame.y;
      let key = String(handler.key),
        box = this._grid.get_highlighted_box();
      if (key === "*") {
        // check for numerical key inputs
        // this is a workaround for numerical keypad input, which doesn't work
        // on some systems
        const event_key = parseInt(e.key, 10);
        if (Number.isInteger(event_key)) {
          key = String(event_key);
        } else {
          return;
        }
      }
      e.preventDefault();
      switch (key) {
        case "up":
          if (this._grid.grid_coords_visible(x, y - 1)) {
            this._grid.move_frame(x, y - 1);
          }
          break;
        case "down":
          if (this._grid.grid_coords_visible(x, y + 1)) {
            this._grid.move_frame(x, y + 1);
          }
          break;
        case "left":
          if (this._grid.grid_coords_visible(x - 1, y)) {
            this._grid.move_frame(x - 1, y);
          }
          break;
        case "right":
          if (this._grid.grid_coords_visible(x + 1, y)) {
            this._grid.move_frame(x + 1, y);
          }
          break;
        case "space":
          if (!box && this._grid.grid_coords_visible(x, y)) {
            this.make_box(x, y);
          }
          break;
        case "esc":
          // end edit mode
          this._set_mode(null);
          break;
        case "tab":
          if (tab_stop === null) {
            this._state.tab_stop = x;
          }
          this.move_frame(...this._grid.grid_coords_clamped(x + 1, y));
          break;
        case "shift+tab":
          if (tab_stop === null) {
            this._state.tab_stop = x;
          }
          this.move_frame(...this._grid.grid_coords_clamped(x - 1, y));
          break;
        case "enter":
          this.move_frame(
            ...this._grid.grid_coords_clamped(
              tab_stop !== null ? tab_stop : x,
              y + 1
            )
          );
          break;
        case "shift+enter":
          this.move_frame(
            ...this._grid.grid_coords_clamped(
              tab_stop !== null ? tab_stop : x,
              y - 1
            )
          );
          break;
        case "backspace":
          if (box) {
            var label = box.label;
            if (label.length > 0) {
              label = label.substring(0, label.length - 1);
              this.set_label(x, y, label);
            } else {
              this.delete_box(x, y);
            }
          }
          break;
        default:
          if (!box && this._grid.grid_coords_visible(x, y)) {
            this.make_box(x, y, key);
            box = this._grid.get(x, y);
          } else {
            var label = box.label;
            if (label.length < 2) {
              label += key;
              this.set_label(x, y, label);
            }
          }
          break;
      }
      // reset tab stop when otherwise navigating
      if (tab_stop_reset_hotkeys.includes(key)) {
        this._state.tab_stop = null;
      }
    }
  }

  // make a box at the specified location
  make_box(x, y, label = "") {
    let create_op = new CreateBoxOperation(x, y, label);
    this._app.execute(create_op);
  }

  // delete the box at the specified location
  delete_box(x, y) {
    let delete_op = new DeleteBoxOperation(x, y);
    this._app.execute(delete_op);
  }

  // TODO good simple place to implement operation aggregation
  set_label(x, y, label) {
    let set_label = new SetBoxLabelOperation(x, y, label);
    this._app.execute(set_label);
  }

  make_frame(x, y) {
    let frame = this._grid.get_frame();
    if (!frame || (frame.x != x || frame.y != y)) {
      this._grid.add_frame(x, y);
    }
  }

  // move the frame to a given x and y coordinate
  move_frame(x, y) {
    let frame = this._grid.get_frame();
    if (frame) {
      this._grid.move_frame(x, y);
    }
  }

  next_box(x_start, y_start) {
    const { y_min, y_max } = this._grid.data.bounds();
    var x_next = this._grid.data.next_entry_in_row(y_start, x_start + 1);
    if (x_next) {
      return [x_next, y_start];
    } else {
      var dy, y_bound;
      if (this._grid.config.lower_left) {
        dy = -1;
        y_bound = y_min;
      } else {
        dy = 1;
        y_bound = y_max;
      }
      for (let y = y_start + dy; (y_bound - y) * dy >= 0; y += dy) {
        x_next = this._grid.data.next_entry_in_row(y);
        if (x_next !== null) {
          return [x_next, y];
        }
      }
      return null;
    }
  }

  previous_box(x_start, y_start) {
    const { y_min, y_max } = this._grid.data.bounds();
    var x_prev = this._grid.data.previous_entry_in_row(y_start, x_start - 1);
    if (x_prev !== null) {
      return [x_prev, y_start];
    } else {
      var dy, y_bound;
      if (this._grid.config.lower_left) {
        dy = 1;
        y_bound = y_max;
      } else {
        dy = -1;
        y_bound = y_min;
      }
      for (let y = y_start + dy; (y_bound - y) * dy >= 0; y += dy) {
        x_prev = this._grid.data.previous_entry_in_row(y);
        if (x_prev !== null) {
          return [x_prev, y];
        }
      }
      return null;
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
