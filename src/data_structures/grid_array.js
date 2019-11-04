const _ = require("underscore");

/** Class representing data arranged in a sparse 2D grid. */
class GridArray {
  /**
   * Create an empty GridArray.
   */
  constructor() {
    this.values = {};
    this.indices = {
      x: [],
      y: []
    };
    this._bounds = {
      x_min: Infinity,
      y_min: Infinity,
      x_max: -Infinity,
      y_max: -Infinity
    };
    this._bounds_dirty = false;
  }

  /**
   * Set a value at specified coordinates.
   * @param {Number} x - The x coordinate; must be an integer.
   * @param {Number} y - The y coordinate; must be an integer.
   * @param value      - The value to store.
   */
  set(x, y, value) {
    GridArray._check_input_coords(x, y);
    if (!(x in this.values)) {
      this.values[x] = {};
    }
    this.values[x][y] = value;
    this._bounds = {
      x_min: Math.min(x, this._bounds.x_min),
      y_min: Math.min(y, this._bounds.y_min),
      x_max: Math.max(x, this._bounds.x_max),
      y_max: Math.max(y, this._bounds.y_max)
    };
  }

  /**
   * Get the value stored at specified coordinates.
   * @param  {Number} x - The x coordinate; must be an integer.
   * @param  {Number} y - The y coordinate; must be an integer.
   * @return              Value stored at specified coordinates, or undefined if
   *                      no value is found.
   */
  get(x, y) {
    if (this.has(x, y)) {
      return this.values[x][y];
    } else {
      return undefined;
    }
  }

  /**
   * Remove the value stored at specified coordinates.
   * @param  {Number} x - The x coordinate; must be an integer.
   * @param  {Number} y - The y coordinate; must be an integer.
   * @return {Boolean}    true if value was removed from specified coordinates,
   *                      or false if no value was found to remove.
   */
  remove(x, y) {
    if (this.has(x, y)) {
      delete this.values[x][y];
      if (_.isEmpty(this.values[x])) {
        delete this.values[x];
      }
      this._bounds_dirty = true;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check if a value is stored at specified coordinates.
   * @param  {Number}  x - The x coordinate; must be an integer.
   * @param  {Number}  y - The y coordinate; must be an integer.
   * @return {Boolean}     true if a value is stored at the specified coordinates,
   *                       or false otherwise.
   */
  has(x, y) {
    GridArray._check_input_coords(x, y);
    if (!(x in this.values)) {
      return false;
    } else {
      return y in this.values[x];
    }
  }

  /**
   * Return the an object representing the bounding box containing the elements
   * currently stored.
   * @return {object} - Object representing the bounding box, specified properties
   *                    are x_min, x_max, y_min, y_max, and represent the
   *                    boundaries of closed intervals.
   */
  bounds() {
    let bounds = {};
    if (this._bounds_dirty) {
      this._compute_bounds();
    }
    _.extend(bounds, this._bounds);
    return bounds;
  }

  /**
   * Recomputes bounding box of GridArray object from scratch.
   */
  _compute_bounds() {
    var x_coords = [];
    var y_coords = [];
    for (let x in this.values) {
      x_coords.push(x);
      for (let y in this.values[x]) {
        y_coords.push(y);
      }
    }
    this._bounds = {
      x_min: Math.min(...x_coords),
      y_min: Math.min(...y_coords),
      x_max: Math.max(...x_coords),
      y_max: Math.max(...y_coords)
    };
  }

  /**
   * Check that specified coordinates are integer-valued.  Raise a TypeError if
   * the check fails.
   * @param           x - The x coordinate.
   * @param           y - The y coordinate.
   */
  static _check_input_coords(x, y) {
    if (!(_.isNumber(x) && _.isNumber(y))) {
      throw new TypeError("specified grid coordinates are not numbers");
    }
    if (!(Math.floor(x) == x && Math.floor(y) == y)) {
      throw new TypeError("specified grid coordinates are not integers");
    }
  }
}

module.exports = GridArray;
