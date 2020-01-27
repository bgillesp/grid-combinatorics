const GridTool = require("./grid_tool.js");
const MoveBoxOperation = require("../operations/move_box.js");

/**
 * Regions represented by tuples [a, b, c] for points satisfying inequalities:
 * a * dx + b * dy + c > 0
 */
const regions = [
  {
    name: "right",
    offset: [1, 0],
    inequalities: [
      [1, 0, -0.5], // dx > 0.5
      [1, 1, 0], // dx + dy > 0
      [1, -1, 0] // dx - dy > 0
    ]
  },
  {
    name: "left",
    offset: [-1, 0],
    inequalities: [
      [-1, 0, -0.5], // dx < -0.5
      [-1, -1, 0], // dx + dy < 0
      [-1, 1, 0] // dx - dy < 0
    ]
  },
  {
    name: "up",
    offset: [0, 1],
    inequalities: [
      [0, 1, -0.5], // dy > 0.5
      [1, 1, 0], // dx + dy > 0
      [-1, 1, 0] // dx - dy < 0
    ]
  },
  {
    name: "down",
    offset: [0, -1],
    inequalities: [
      [0, -1, -0.5], // dy < -0.5
      [-1, -1, 0], // dx + dy < 0
      [1, -1, 0] // dx - dy > 0
    ]
  }
];

class MoveTool extends GridTool {
  constructor(app) {
    super(app);
    this._state = {
      mouse_pressed: false,
      current_box: null,
      avail_regions: new Array()
    };
  }

  disable() {
    this._state.mouse_pressed = false;
    this._state.current_box = null;
    this._state.avail_regions = new Array();
  }

  on_mouse_down(e) {
    this._state.mouse_pressed = true;
    const { box } = this.parse_mouse_event(e);
    if (box) {
      this._compute_available_regions(box.x, box.y);
    }
    this._state.current_box = box;
  }

  on_mouse_move(e) {
    if (this._state.mouse_pressed && this._state.current_box) {
      let box = this._state.current_box;
      const { x, y } = this._get_local_coords(e);
      const [x_box, y_box] = [box.x, box.y];
      const [dx, dy] = [x - (x_box + 0.5), y - (y_box + 0.5)];
      this._state.avail_regions.forEach((is_avail, index) => {
        if (is_avail) {
          const region = regions[index];
          if (
            region.inequalities.every(([a, b, c]) => {
              return a * dx + b * dy + c > 0;
            })
          ) {
            // execute move in given direction
            const [x_offset, y_offset] = region.offset;
            let move_op = new MoveBoxOperation(
              x_box,
              y_box,
              x_box + x_offset,
              y_box + y_offset
            );
            this._app.execute(move_op);
            this._compute_available_regions(x_box + x_offset, y_box + y_offset);
          }
        }
      });
      // for each available cardinal direction check if block can move
      // see "regions" variable above
      // if so, initiate move operation, set state to inactive
    }
  }

  on_mouse_up(e) {
    this._state.mouse_pressed = false;
  }

  _compute_available_regions(x, y) {
    const { x_min, x_max, y_min, y_max } = this._grid.viewport_params;
    let avail_regions = this._state.avail_regions;
    regions.forEach((region, index) => {
      const [x_offset, y_offset] = region.offset;
      avail_regions[index] =
        this._grid.grid_coords_visible(x + x_offset, y + y_offset) &&
        !this._grid.get(x + x_offset, y + y_offset);
    });
  }
}

module.exports = MoveTool;
