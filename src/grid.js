// const _ = require("underscore");
const Two = require("two.js");
const Vector = Two.Vector;
const GridArray = require("./data_structures/grid_array.js");
const Box = require("./box.js").Box;
const Tween = require("@tweenjs/tween.js");
const SimpleAnimationManager = require("./placeholder/simple_animation_manager.js");
const Viewport = require("./viewport.js");
// const App = require("./app/app.js");

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
  constructor(domParent, config) {
    this.parent = domParent;
    this.two = new Two({
      width: config.grid_size.width,
      height: config.grid_size.height,
      autostart: true
    });
    this.two.appendTo(domParent);
    this.viewport_params = {
      scale: 1.0,
      translation: new Two.Vector(0, 0)
    };
    this.data = new GridData();
    this.animation_manager = new SimpleAnimationManager();
  }

  add(x, y, label) {
    let box = new Box(x, y, label);
    this.data.add(x, y, box);
    this.two.add(box.render.main);
  }

  remove(x, y) {
    let box = this.data.get(x, y);
    this.data.remove(x, y);
    this.two.remove(box.render.main);
  }

  get(x, y) {
    return this.data.get(x, y);
  }

  move(x_start, y_start, x_end, y_end) {
    let box = this.get(x_start, y_start);
    this._animate_motion(box, x_end, y_end);
    this.data.move(x_start, y_start, x_end, y_end);
    box.x = x_end;
    box.y = y_end;
  }

  get_render_context() {
    return this.two;
  }

  get_local_coordinates(x, y) {
    let coord = new Two.Vector(x, y);
    coord.subtractSelf(this.viewport_params.translation);
    coord.multiplyScalar(1 / this.viewport_params.scale);
    return coord;
  }

  set_viewport(x_min, x_max, y_min, y_max, border = 0.1) {
    this.viewport_params = Viewport.set_viewport(
      this.two,
      x_min,
      x_max,
      y_min,
      y_max,
      border
    );
    return this.viewport_params;
  }

  get_animation_manager() {
    return this.animation_manager;
  }

  _animate_motion(box, x, y) {
    let anim = new Tween.Tween(box.render.main.translation)
      .to({ x: x, y: y }, 200)
      .easing(Tween.Easing.Quadratic.Out);
    this.animation_manager.add(anim);
  }
}

var T = {};
T.GridData = GridData;
T.Grid = Grid;

module.exports = T;
