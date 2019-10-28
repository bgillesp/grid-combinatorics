// const _ = require("underscore");
const Two = require("two.js");
const Vector = Two.Vector;
const GridArray = require("./grid_array.js");
const Box = require("./box.js").Box;
const App = require("./app.js");

/**
 * Wrapper class around GridArray to simplify operations needed for Tableau
 */
class GridData extends GridArray {
  /**
   * Set data at specified coordinates.  Raise an error if coordinates already
   * have data.
   * @param {Number} x - The x-coordinate; must be an integer.
   * @param {Number} y - The y-coordinate; must be an integer.
   * @param value      - The value to store.
   */
  add(x, y, value) {
    this._check_unoccupied(x, y);
    this.set(x, y, value);
  }

  /**
   * Move data from starting coordinates to ending coordinates.  Raise an error
   * if ending coordinates already have data.
   * @param  {Number} x_start - The starting x-coordinate; must be an integer.
   * @param  {Number} y_start - The starting y-coordinate; must be an integer.
   * @param  {Number} x_end   - The ending x-coordinate; must be an integer.
   * @param  {Number} y_end   - The ending y-coordinate; must be an integer.
   */
  move(x_start, y_start, x_end, y_end) {
    this._check_unoccupied(x_end, y_end);
    let val = this.get(x_start, y_start);
    this.set(x_end, y_end, val);
    this.remove(x_start, y_start);
  }

  /**
   * Raise an error if specified coordinates have data.
   * @param  {Number} x - The x-coordinate; must be an integer.
   * @param  {Number} y - The y-coordinate; must be an integer.
   */
  _check_unoccupied(x, y) {
    if (this.has(x, y)) {
      throw new Error("target index already occupied");
    }
  }
}

/**
 * Class to manage and coordinate boxes on a grid.
 */
class Grid {
  constructor(domParent) {
    this.parent = domParent;
    this.two = new Two({
      width: App.config.grid_size.width,
      height: App.config.grid_size.height,
      autostart: true
    });
    this.two.appendTo(domParent);
    // copy input Array of boxes
    this.boxes = [];
    this.data = new GridData();
  }

  add(x, y, label) {
    let box = new Box(x, y, label);
    this.boxes.push(box);
    this.two.add(box.render.main);
  }

  get(i) {
    return this.boxes[i];
  }

  move(x_start, y_start, x_end, y_end) {}

  remove(x, y) {}
}

var T = {};
T.GridData = GridData;
T.Grid = Grid;

module.exports = T;
