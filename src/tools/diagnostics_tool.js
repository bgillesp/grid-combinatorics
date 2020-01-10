const Two = require("two.js");
const GridTool = require("./grid_tool.js");

class DiagnosticsTool extends GridTool {
  constructor(app) {
    super(app);
    this._state = {
      mouse_pressed: false,
      current_box: null
    };
    this._circle = new Two.Ellipse(0.0, 0.0, 0.1, 0.1);
    this._circle.linewidth = 0.03;
    this._circle.stroke = "red";
    this._circle.noFill();
  }

  on_mouse_down(e) {
    this._state.mouse_pressed = true;
    const loc = this.get_local_coords(e);
    this._circle.translation = loc;
    this._grid.get_render_context().add(this._circle);
  }

  on_mouse_move(e) {
    if (this._state.mouse_pressed) {
      const loc = this.get_local_coords(e);
      this._circle.translation = loc;
    }
    // console.log(loc);
  }

  on_mouse_up(e) {
    this._state.mouse_pressed = false;
    const loc = this.get_local_coords(e);
    this._circle.translation = loc;
    this._grid.get_render_context().remove(this._circle);
  }
}

module.exports = DiagnosticsTool;
