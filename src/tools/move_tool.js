const GridTool = require("./grid_tool.js");

/**
 * Regions represented by tuples [a, b, c] for points satisfying inequalities:
 * a * dx + b * dy + c > 0
 */
const regions = {
  up: [
    [0, 1, -0.5], // dy > 0.5
    [1, 1, 0], // dx + dy > 0
    [-1, 1, 0] // dx - dy < 0
  ],
  down: [
    [0, -1, -0.5], // dy < -0.5
    [-1, -1, 0], // dx + dy < 0
    [1, -1, 0] // dx - dy > 0
  ],
  right: [
    [1, 0, -0.5], // dx > 0.5
    [1, 1, 0], // dx + dy > 0
    [1, -1, 0] // dx - dy > 0
  ],
  left: [
    [-1, 0, -0.5], // dx < -0.5
    [-1, -1, 0], // dx + dy < 0
    [-1, 1, 0] // dx - dy < 0
  ]
};

class MoveTool extends GridTool {
  constructor(app) {
    super(app);
    this._state = {
      mouse_pressed: false,
      current_box: null
    };
  }

  on_mouse_down(e) {
    this._state.mouse_pressed = true;
    const { x, y } = this.get_local_coords(e);
    this._state.click_coord = [Math.floor(x) + 0.5, Math.floor(y) + 0.5];
    this._state.current_box = this._grid.get(Math.floor(x), Math.floor(y));
    // check availability of cardinal directions
  }

  on_mouse_move(e) {
    if (this._state.mouse_pressed && this._state.current_box) {
      const { x, y } = this.get_local_coords(e);
      const [click_x, click_y] = this._state.click_coord;
      const [dx, dy] = [x - click_x, y - click_y];
      console.log("dx: ", dx, "dy: ", dy);
      // for each available cardinal direction check if block can move
      // see "regions" variable above
      // if so, initiate move operation, set state to inactive
    }
  }

  on_mouse_up(e) {
    this._state.mouse_pressed = false;
  }
}

module.exports = MoveTool;
