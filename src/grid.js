// const _ = require("underscore");
const Two = require("two.js");
const Vector = Two.Vector;
const GridArray = require("./data_structures/grid_array.js");
const Box = require("./box.js").Box;
const Tween = require("@tweenjs/tween.js");
const SimpleAnimationManager = require("./placeholder/simple_animation_manager.js");
const Viewport = require("./viewport.js");

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
      autostart: true,
      type: Two.Types.canvas
    });
    this.two.add(this.make_axes());
    this.two.appendTo(domParent);
    this.viewport_params = {
      scale: 1.0,
      translation: new Two.Vector(0, 0)
    };
    this.data = new GridData();
    this.animation_manager = new SimpleAnimationManager();
  }

  make_axes() {
    let grp = new Two.Group(),
      x_axis = new Two.Line(-100, -0.075, 100, -0.075),
      y_axis = new Two.Line(-0.075, -100, -0.075, 100);
    grp.add(x_axis, y_axis);
    grp.linewidth = 0.05;
    grp.stroke = "#ccc";
    return grp;
  }

  add(x, y, label = "") {
    let box = new Box(x, y, label);
    this.data.add(x, y, box);
    this._animate_create(box);
  }

  remove(x, y) {
    let box = this.data.get(x, y);
    this.data.remove(x, y);
    this._animate_remove(box);
  }

  get(x, y) {
    return this.data.get(x, y);
  }

  move(x_start, y_start, x_end, y_end) {
    let box = this.get(x_start, y_start);
    this.data.move(x_start, y_start, x_end, y_end);
    this._animate_move(box, x_end, y_end);
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

  _animate_move(box, x, y) {
    let anim = new Tween.Tween(box.render.main.translation)
      .to({ x: x, y: y }, 200)
      .easing(Tween.Easing.Quadratic.Out);
    this.animation_manager.add(anim);
  }

  _animate_create(box) {
    const render = box.render.main;
    render.opacity = 0.0;
    render.scale = 0.0;
    const params = {
      scale: 0.0,
      opacity: 0.0,
      translate_x: box.x + 0.5,
      translate_y: box.y + 0.5
    };
    const target_params = {
      scale: 1.0,
      opacity: 1.0,
      translate_x: box.x,
      translate_y: box.y
    };
    this.two.scene.add(render);
    let anim = new Tween.Tween(params).to(target_params, 100).onUpdate(() => {
      render.scale = params.scale;
      render.opacity = params.opacity;
      render.translation.x = params.translate_x;
      render.translation.y = params.translate_y;
    });
    this.animation_manager.add(anim);
  }

  _animate_remove(box) {
    const render = box.render.main;
    const two = this.two;
    const params = {
      scale: 1.0,
      opacity: 1.0,
      translate_x: box.x,
      translate_y: box.y
    };
    const target_params = {
      scale: 0.0,
      opacity: 0.0,
      translate_x: box.x + 0.5,
      translate_y: box.y + 0.5
    };
    let anim = new Tween.Tween(params)
      .to(target_params, 100)
      .onUpdate(() => {
        render.scale = params.scale;
        render.opacity = params.opacity;
        render.translation.x = params.translate_x;
        render.translation.y = params.translate_y;
      })
      .onComplete(() => {
        two.remove(render);
      });
    this.animation_manager.add(anim);
  }
}

var T = {};
T.GridData = GridData;
T.Grid = Grid;

module.exports = T;
