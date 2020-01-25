// const _ = require("underscore");
const Two = require("two.js");
const Vector = Two.Vector;
const GridArray = require("./data_structures/grid_array.js");
const Box = require("./box.js");
const Frame = require("./frame.js");
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
    this.config = config;
    const {
      canvas_size: { width: canvas_width, height: canvas_height },
      grid_size: { x_min, x_max, y_min, y_max },
      lower_left = false
    } = config;
    this.parent = domParent;
    this.two = new Two({
      width: canvas_width,
      height: canvas_height,
      autostart: true,
      type: Two.Types.canvas
    });
    this.two.appendTo(domParent);
    // currently can't change grid size
    this.set_viewport(x_min, x_max, y_min, y_max, 0.1, lower_left);
    this.two.add(this.make_axes(lower_left));
    this.data = new GridData();
    this.animation_manager = new SimpleAnimationManager();
    this.highlight_frame = null;
  }

  make_axes(lower_left = false) {
    let grp = new Two.Group();
    const { x_min, x_max, y_min, y_max } = this.viewport_params;
    var x_axis, y_axis, origin_x, origin_y;
    console.log("grid bounds:", x_min, x_max, y_min, y_max);
    if (lower_left) {
      origin_x = x_min - 0.075;
      origin_y = y_max + 0.075;
      x_axis = new Two.Line(-100, y_max + 0.075, 100, y_max + 0.075);
      y_axis = new Two.Line(x_min - 0.075, -100, x_min - 0.075, 100);
    } else {
      origin_x = x_min - 0.075;
      origin_y = y_min - 0.075;
      x_axis = new Two.Line(-100, y_min - 0.075, 100, y_min - 0.075);
      y_axis = new Two.Line(x_min - 0.075, -100, x_min - 0.075, 100);
    }
    x_axis.linewidth = 0.05;
    y_axis.linewidth = 0.05;
    grp.add(x_axis, y_axis);
    var y_tick_min, y_tick_max;
    if (lower_left) {
      y_tick_min = y_min;
      y_tick_max = y_max;
    } else {
      y_tick_min = y_min + 1;
      y_tick_max = y_max + 1;
    }
    var tick;
    for (let x = x_min + 1; x < x_max + 1; ++x) {
      tick = new Two.Line(x, origin_y - 0.1, x, origin_y + 0.1);
      tick.linewidth = 0.03;
      grp.add(tick);
    }
    for (let y = y_tick_min; y < y_tick_max; ++y) {
      tick = new Two.Line(origin_x - 0.1, y, origin_x + 0.1, y);
      tick.linewidth = 0.03;
      grp.add(tick);
    }
    grp.stroke = "#ccc";
    return grp;
  }

  add(x, y, label = "") {
    let box = new Box(x, y, label);
    this.data.add(x, y, box);
    this._animate_create(box);
  }

  bulk_add(values) {
    let boxes = [];
    values.forEach(val => {
      var { x, y, label } = val;
      var box = new Box(x, y, label);
      boxes.push(box);
      this.data.add(x, y, box);
    });
    this._animate_bulk_create(boxes);
  }

  remove(x, y) {
    let box = this.data.get(x, y);
    this.data.remove(x, y);
    this._animate_remove(box);
  }

  bulk_remove(values) {
    let boxes = [];
    values.forEach(val => {
      var { x, y } = val;
      var box = this.data.get(x, y);
      this.data.remove(x, y);
      if (box) {
        boxes.push(box);
      }
    });
    this._animate_bulk_remove(boxes);
  }

  get(x, y) {
    return this.data.get(x, y);
  }

  move(x_start, y_start, x_end, y_end) {
    let box = this.get(x_start, y_start);
    this.data.move(x_start, y_start, x_end, y_end);
    this._animate_move(box.render.main, x_end, y_end);
    box.x = x_end;
    box.y = y_end;
  }

  add_frame(x, y) {
    this.remove_frame();
    let frame = new Frame(x, y);
    this._animate_add_frame(frame);
    this.highlight_frame = frame;
  }

  remove_frame() {
    if (this.highlight_frame) {
      this._animate_remove_frame();
      this.highlight_frame = null;
    }
  }

  get_frame() {
    return this.highlight_frame;
  }

  move_frame(end_x, end_y) {
    if (this.highlight_frame) {
      let frame = this.highlight_frame;
      this._animate_move(frame.render.main, end_x, end_y);
      frame.x = end_x;
      frame.y = end_y;
    }
  }

  get_highlighted_box() {
    let frame = this.get_frame();
    if (frame) {
      return this.data.get(frame.x, frame.y);
    } else {
      return null;
    }
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

  grid_coords_visible(x, y) {
    const { x_min, x_max, y_min, y_max } = this.viewport_params;
    return x >= x_min && x < x_max && y >= y_min && y < y_max;
    // if (this.config.lower_left) {
    //
    // } else {
    //
    // }
    //
    // // console.log(x_min, x_max, y_min, y_max, x, y);
    // return x >= x_min && x < x_max && y >= y_min && y < y_max;
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
    console.log(this.viewport_params);
    return this.viewport_params;
  }

  get_animation_manager() {
    return this.animation_manager;
  }

  _animate_move(render, x, y, params = {}) {
    const { duration = 200, easing = Tween.Easing.Quadratic.Out } = params;
    let anim = new Tween.Tween(render.translation)
      .to({ x: x, y: y }, duration)
      .easing(easing);
    this.animation_manager.add(anim);
  }

  _animate_create(box) {
    this._animate_bulk_create([box]);
  }

  _animate_bulk_create(boxes) {
    boxes.forEach(b => {
      b.render.main.opacity = 0.0;
      b.render.main.scale = 0.0;
      this.two.scene.add(b.render.main);
    });
    const params = {
      scale: 0.0,
      opacity: 0.0,
      translate_x: 0.5,
      translate_y: 0.5
    };
    const target_params = {
      scale: 1.0,
      opacity: 1.0,
      translate_x: 0.0,
      translate_y: 0.0
    };
    let anim = new Tween.Tween(params).to(target_params, 100).onUpdate(() => {
      boxes.forEach(b => {
        var render = b.render.main;
        render.scale = params.scale;
        render.opacity = params.opacity;
        render.translation.x = b.x + params.translate_x;
        render.translation.y = b.y + params.translate_y;
      });
    });
    this.animation_manager.add(anim);
  }

  _animate_remove(box) {
    this._animate_bulk_remove([box]);
  }

  _animate_bulk_remove(boxes) {
    const params = {
      scale: 1.0,
      opacity: 1.0,
      translate_x: 0.0,
      translate_y: 0.0
    };
    const target_params = {
      scale: 0.0,
      opacity: 0.0,
      translate_x: 0.5,
      translate_y: 0.5
    };
    let anim = new Tween.Tween(params)
      .to(target_params, 100)
      .onUpdate(() => {
        boxes.forEach(b => {
          var render = b.render.main;
          render.scale = params.scale;
          render.opacity = params.opacity;
          render.translation.x = b.x + params.translate_x;
          render.translation.y = b.y + params.translate_y;
        });
      })
      .onComplete(() => {
        boxes.forEach(b => {
          this.two.remove(b.render.main);
        });
      });
    this.animation_manager.add(anim);
  }

  _animate_add_frame(frame) {
    const render = frame.render.main;
    this.two.scene.add(render);
  }

  _animate_remove_frame() {
    const render = this.highlight_frame.render.main;
    this.two.remove(render);
  }
}

var T = {};
T.GridData = GridData;
T.Grid = Grid;

module.exports = T;
