class GridTool {
  constructor(app) {
    this._app = app;
    this._grid = app.grid;
  }

  get_local_coords(e) {
    const { offsetX: x, offsetY: y } = e;
    return this._grid.get_local_coordinates(x - 1, y - 1);
  }
}

module.exports = GridTool;
