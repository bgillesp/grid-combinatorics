const _ = require("underscore");
const FlexTimer = require("./flex_timer.js").FlexTimer;
const LayerMap = require("../data_structures/layer_map.js");
const LockQueue = require("../data_structures/lock_queue.js");
const RateFunction = require("./flex_timer.js").RateFunction;
const Tween = require("@tweenjs/tween.js");

/**
 * AnimationManager is a class to handle the sequencing of animations on grid
 * boxes and other components
 */
class AnimationManager {
  /**
   * Construct an AnimationManager object.
   */
  constructor() {
    this._next_animation_id = 0;
    this._timer = new FlexTimer(0, 1000 / 60);
    this._started = false;
    this._locks = new LockQueue();

    // List of active animations
    this._animations = {};
    this._tween_group = new Tween.Group();
  }

  start() {
    this._started = true;
    this.step();
  }

  pause() {
    this._started = false;
  }

  add(animation) {
    let dependencies = animation.dependencies(),
      animations = animation.animations(),
      locks = animation.locks();
    let id = this._next_animation_id++;
    this._next_animation_id += 1;
    let animation_ids = new Object(),
      lock_ids = new Object(),
      unlock_ids = new Object();
    // construct complete dependencies DAG
    animations.forEach((value, index) => {
      animation_ids[index] = value;
    });
    // make a map which records the ids of animations requesting each lock
    let lock_record = new LayerMap();
    locks.forEach((locks_array, animation_index) => {
      locks_array.forEach(lock => {
        if (lock_record.has(lock)) {
          lock_record.get(lock).push(animation_index);
        } else {
          let record = new Array();
          record.push(animation_index);
          lock_record.set(lock, record);
        }
      });
    });
    // TODO Do we need an object to map locks to their corresponding vertex ids?
    lock_record.forEach((key, record) => {
      // add new vertices to the dependency graph corresponding to lock requests
      // and lock returns
      let lock_id = dependencies.add_vertex(),
        unlock_id = dependencies.add_vertex();
      // add edges from lock request nodes and to lock return nodes
      record.forEach(animation_id => {
        dependencies.add_edge(lock_id, animation_id);
        dependencies.add_edge(animation_id, unlock_id);
      });
      // record the ids of nodes corresponding to lock requests and lock returns
      lock_ids[lock_id] = key;
      unlock_ids[unlock_id] = key;
    });
    // Construct id objects for animations, locks and unlocks
    this._animations[id] = {
      animations: animation_ids,
      locks: lock_ids,
      unlocks: unlock_ids,
      dependencies: dependencies.traversal(),
      in_progress: new Set()
    };
    // Step the new animation
    this.step(id);
  }

  // add_lock_request(ids, value) {
  //
  // }
  //
  // /**
  //  * Return
  //  * @param  {[type]} ids [description]
  //  * @return {[type]}     [description]
  //  */
  // pull_lock_requests(ids) {
  //
  // }

  active_ids() {
    return Array.from(this._animations.keys()).sort();
  }

  /**
   * Called when the manager needs to process the state of an animation.
   * 1. Check if the id is an active animation.
   * 2. For each non-dependent operation of the animation:
   * 2.1 If a lock operation, check if the lock is available, and if so, assign
   *     it to the animation and visit the node.
   * 2.2 If an unlock operation, return the lock and visit the node.
   * 2.3 If an animation, start the animation.
   * 2.4 If null, do nothing and visit the node.
   * 3. If any nodes were visited in step 2, repeat.
   * 4. If any locks were released, determine if other animations get them.
   * @param  {[type]} [id=null] [description]
   * @return {[type]}           [description]
   */
  step(id) {
    let locks_returned = false;
    if (!(id in this._animations)) return;
    let {
      animations,
      locks,
      unlocks,
      dependencies,
      in_progress
    } = this._animations[id];
    // for each independent entry of this animation
    // } else {
    //   // step for each active animation
    //   this.active_ids().forEach(id => {
    //     this.step(id);
    //   });
    // }
  }
  _step(id) {}

  /**
   * Step all animations starting from a given id, and continue until no new
   * locks are released.
   * @return {[type]} [description]
   */
  _step_from_id(id = null) {
    let active_ids = this.active_ids();
    let start_index = 0;
    if (id) {
      // start_index =
    }
    let continue_from_id = 0;
    this.active_ids().forEach(id => {
      this._step(id);
    });
  }

  tween_callback(anim_id, tween_id) {
    let anim = this._animations[anim_id];
    anim.dependencies.visit(tween_id);
    anim.in_progress.delete(tween_id);
    this.step(anim_id);
  }

  dispatch() {}

  schedule(animation) {
    // this.queue.push(animation);
    // animation._tween.group(this._tween_group);
    // animation._tween.onComplete(null);
  }

  tween_group() {
    return this._tween_group;
  }

  update() {}
}

module.exports = AnimationManager;
