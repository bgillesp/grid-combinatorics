const _ = require("underscore");

/** Class representing data arranged in a sparse 2D grid. */
class GridArray {
  /**
   * Create an empty GridArray.
   */
  constructor() {
    this._init_data();
  }

  _init_data() {
    this._values = new Object();
    this._bounds = {
      x_min: Infinity,
      y_min: Infinity,
      x_max: -Infinity,
      y_max: -Infinity
    };
    this._bounds_dirty = false;
  }

  clear() {
    this._init_data();
  }

  /**
   * Set a value at specified coordinates.
   * @param {Number} x - The x coordinate; must be an integer.
   * @param {Number} y - The y coordinate; must be an integer.
   * @param value      - The value to store.
   */
  set(x, y, value) {
    GridArray._check_input_coords(x, y);
    if (!(x in this._values)) {
      this._values[x] = {};
    }
    this._values[x][y] = value;
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
    GridArray._check_input_coords(x, y);
    return this._get(x, y);
  }
  _get(x, y) {
    if (this._has(x, y)) {
      return this._values[x][y];
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
      delete this._values[x][y];
      if (_.isEmpty(this._values[x])) {
        delete this._values[x];
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
    return this._has(x, y);
  }
  _has(x, y) {
    return x in this._values && y in this._values[x];
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

  column_bounds(x) {
    var y_coords = [];
    if (x in this._values) {
      for (let [y] of Object.entries(this._values[x])) {
        y_coords.push(y);
      }
    }
    return [Math.min(...y_coords), Math.max(...y_coords)];
  }

  row_bounds(y) {
    var x_coords = [];
    for (let [x] of Object.entries(this._values)) {
      if (this._has(x, y)) x_coords.push(x);
    }
    return [Math.min(...x_coords), Math.max(...x_coords)];
  }

  next_entry_in_row(y, x_start) {
    const [x_min, x_max] = this.row_bounds(y);
    if (x_min == Infinity) return null;
    if (x_start !== undefined) {
      for (let x = x_start; x <= x_max; ++x) {
        if (this._has(x, y)) return x;
      }
      return null;
    } else {
      return x_min;
    }
  }

  previous_entry_in_row(y, x_start) {
    const [x_min, x_max] = this.row_bounds(y);
    if (x_min == Infinity) return null;
    if (x_start !== undefined) {
      for (let x = x_start; x >= x_min; --x) {
        if (this.has(x, y)) return x;
      }
      return null;
    } else {
      return x_max;
    }
  }

  next_entry_in_column(x, y_start) {
    const [y_min, y_max] = this.column_bounds(y);
    if (y_min == Infinity) return null;
    if (y_start !== undefined) {
      for (let y = y_start; y <= y_max; ++y) {
        if (this._has(x, y)) return y;
      }
    } else {
      return y_min;
    }
  }

  previous_entry_in_column(x, y_start) {
    const [y_min, y_max] = this.column_bounds(y);
    if (y_min == Infinity) return null;
    if (y_start !== undefined) {
      for (let y = y_start; y >= y_min; --y) {
        if (this._has(x, y)) return this._get(x, y);
      }
    } else {
      return y_max;
    }
  }

  // TODO test
  *values() {
    const { x_min, x_max, y_min, y_max } = this._bounds;
    for (let y = y_min; y <= y_max; ++y) {
      for (let x = x_min; x <= x_max; ++x) {
        if (this._has(x, y)) {
          yield this._get(x, y);
        }
      }
    }
  }

  /**
   * Recomputes bounding box of GridArray object from scratch.
   */
  _compute_bounds() {
    var x_coords = [];
    var y_coords = [];
    for (let x in this._values) {
      x_coords.push(x);
      for (let y in this._values[x]) {
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
