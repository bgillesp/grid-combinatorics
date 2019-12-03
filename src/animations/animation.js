const Tween = require("@tweenjs/tween.js");

var next_id = 0;

class Animation {
  constructor() {
    this._id = next_id;
    next_id += 1;
    this._duration = 0;
    this._prelock = true;
    this._postlock = true;
    this._locks_requested = new Array();
    this._locks_obtained = new Array();
    this._id = 0;
    this._tween = null;
  }

  /**
   * Return a DAG (directed acyclic graph) representing the ordering
   * dependencies of the individual animations of this object.
   * @return {DAG} - The animation dependencies.
   */
  dependencies() {
    return new DAG();
  }

  /**
   * Return an array whose i-th entry represents the i-th animation of this
   * object.  Entries may either be Tween objects or null.
   * @return {Array} - The array of Tween objects.
   */
  animations() {
    return new Array();
  }

  /**
   * Return an array whose i-th entry represents the locks required for the i-th
   * animation.
   * @return {Array} - The array of locks required by the individual animations.
   */
  locks() {
    return new Array();
  }

  // /**
  //  * Return a compiled version of this animation.  The data is formatted as an
  //  * Object with the following fields.  `animation_ids` gives a
  //  * @return {[type]} [description]
  //  */
  // static compile() {
  //   return {
  //     animation_ids: new Object(),
  //     lock_ids: new LayerMap(),
  //     dependency_dag: new DAG()
  //   };
  // }
}

class BoxPositionAnimation extends Animation {
  constructor(box, target_position, duration) {
    super();
    this._locks_requested.push([box, "render", "translation"]);
    this._duration = duration;
    let { x, y } = target_position;
    let tween = new Tween.Tween(box.render.main.translation)
      .to({ x: x, y: y }, duration)
      .easing(Tween.Easing.Quadratic.Out);
    this._tween = tween;
  }

  compile() {}
}

module.exports = Animation;
