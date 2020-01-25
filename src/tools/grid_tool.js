class GridTool {
  constructor(app) {
    this._app = app;
    this._grid = app.grid;
  }

  enable() {}

  disable() {}

  reset() {
    this.disable();
    this.enable();
  }

  _get_local_coords(e) {
    const { offsetX: x, offsetY: y } = e;
    return this._grid.get_local_coordinates(x - 1, y - 1);
  }

  parse_mouse_event(e) {
    const loc = this._get_local_coords(e);
    const [x, y] = [Math.floor(loc.x), Math.floor(loc.y)];
    const box = this._grid.get(x, y);
    const frame = this._grid.get_frame();
    return {
      box: box,
      frame: frame,
      loc: loc,
      x: x,
      y: y,
      event: e
    };
  }
}

module.exports = GridTool;
