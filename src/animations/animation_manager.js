const _ = require("underscore");
const FlexTimer = require("./flex_timer.js").FlexTimer;
const LayerMap = require("../data_structures/layer_map.js");
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
    this._locks = new LockMap();

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

// TODO Split LockQueue and LockMap into a separate file and add tests

/**
 * Class LockQueue maintains a LockMap of assigned locks and a LayerMap of
 * requests for locks.  When adding or removing a lock, new locks are assigned
 * in order of priority, and each operation returns a list of any new locks that
 * were assigned as a result of the operation.
 */
class LockQueue {
  /**
   * Create an empty LockQueue object.
   */
  constructor() {
    this._locks = new LockMap();
    this._queue = new LayerMap();
  }

  /**
   * Enqueue a lock request with given id sequence, data, and priority.  Returns
   * the lock request object which is added to the queue.
   * @param  {Array}  ids      - The sequence of ids.
   * @param           data     - Data associated with the request.
   * @param  {Number} priority - The request priority.
   * @return {Object}          - The enqueued lock request.
   */
  _enqueue(ids, data, priority) {
    let record = this._queue.get(ids);
    if (!record) {
      record = new Array();
      this._queue.set(ids, record);
    }
    let lock_obj = { ids: ids, data: data, priority: priority };
    record.push(lock_obj);
    record.sort((a, b) => a.priority - b.priority);
    return lock_obj;
  }

  /**
   * Peek at the highest priority lock request for the given id sequence.  If no
   * request exists for the id sequence, return undefined.
   * @param  {Array} ids - The sequence of ids.
   * @return             - The highest priority lock request, if any.
   */
  _peek_queue(ids) {
    let record = this._queue.get(ids);
    return record ? record[0] : undefined;
  }

  /**
   * Dequeue the highest priority lock request for the given id sequence.  If no
   * request exists for the id sequence, return undefined.
   * @param  {Array} ids - The sequence of ids.
   * @return             - The highest priority lock request, if any.
   */
  _dequeue(ids) {
    let record = this._queue.get(ids);
    if (record) {
      let lock_obj = record.shift();
      if (record.length == 0) {
        this._queue.delete(ids);
      }
      return lock_obj;
    } else {
      return undefined;
    }
  }

  /**
   * Add a new request for a lock for given id sequence, priority, and data.
   * Return an Array containing the new locks assigned as a result of the
   * request; Array length is 1 if the lock was available, and 0 if the request
   * was put in the queue.
   * @param  {Array}  ids      - The sequence of ids.
   * @param           data     - Data associated with the request.
   * @param  {Number} priority - The request priority.
   * @return {Array}           - The list of newly assigned locks.
   */
  request(ids, data, priority) {
    let new_locks = new Array();
    if (this._locks.lock(ids, priority)) {
      new_locks.push({ ids: ids, data: data, priority: priority });
    } else {
      this._enqueue(ids, data, priority);
    }
    return new_locks;
  }

  /**
   * Free the lock currently held for the given id sequence, if any, and assign
   * new locks which are made available by the operation in order of priority.
   * Return an Array of new locks that were assigned.
   * @param  {Array} ids - The sequence of ids.
   * @return {Array}     - The list of locks newly assigned.
   */
  free(ids) {
    if (!this._locks.unlock(ids)) {
      return;
    }
    let new_locks = new Array();
    // generate all possible new entries
    let nbhd = new Array();
    for ([, record] of this._queue.neighborhood(ids)) {
      let candidate = record[0];
      nbhd.push(candidate);
    }
    nbhd.sort((a, b) => a.priority - b.priority);
    // assign locks to entries in order of priority, if possible
    nbhd.forEach(candidate => {
      if (this._locks.lock(candidate.ids, candidate.priority)) {
        this._dequeue(candidate.ids);
        new_locks.push(candidate);
      }
    });
    return new_locks;
  }
}

/**
 * The LockMap class is a thin wrapper around a LayerMap object which preserves
 * the invariant that stored keys may be comparable (in terms of the relation "A
 * is a prefix of B") if and only if they store the same value, i.e. the lock is
 * owned by the same object.
 */
class LockMap {
  /**
   * Construct an empty LockMap object.
   */
  constructor() {
    this._map = new LayerMap();
  }

  /**
   * Store a value at a given id sequence if and only if it is not comparable
   * with a previously stored sequence.  Return whether the value was stored.
   * @param  {Array}   ids   - The sequence of ids.
   * @param            value - The value to store.
   * @return {Boolean}       - Whether the value was stored.
   */
  lock(ids, value) {
    if (this.is_available(ids, value)) {
      this._map.set(ids, value);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Remove the lock for a given id sequence.  Return whether a lock was
   * removed.
   * @param  {Array}   ids - The sequence of ids.
   * @return {Boolean}     - Whether a lock was removed.
   */
  unlock(ids) {
    return this._map.delete(ids);
    if (this._map.has(ids)) {
      this._map.delete(ids);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Unlock all locks which are comparable with the given sequence of ids.
   * Return whether any locks were removed.
   * @param  {Array}   ids - The sequence of ids.
   * @return {Boolean}     - Whether any locks were removed.
   */
  free_lock(ids) {
    let locks_removed = false;
    if (this._map.has_ancestor(ids)) {
      this._map.delete_ancestors();
      locks_removed = true;
    }
    if (this._map.has_descendent(ids)) {
      this._map.delete_submap(ids);
      locks_removed = true;
    }
    return locks_removed;
  }

  /**
   * Return whether the given id sequence is available to be locked by the given
   * value.
   * @param  {Array}   ids   - The sequence of ids.
   * @param            value - The locking value.
   * @return {Boolean}       - Whether the lock is available.
   */
  is_available(ids, value) {
    for (const [, lock_value] of this.get_locks(ids)) {
      if (lock_value != value) return false;
    }
    return true;
  }

  /**
   * Return whether a given sequence of ids is comparable with a currently
   * stored sequence.
   * @param  {Array}   ids - The sequence of ids.
   * @return {Boolean}     - Whether a comparable sequence is stored.
   */
  has_locks(ids) {
    return this._map.has_ancestor() || this._map.has_descendent(ids);
  }

  /**
   * Generate the collection of locks currently blocking the given sequence of
   * ids.  This includes any stored lock which is an ancestor or a descendent of
   * the id sequence.
   * @param  {Array}     ids - The sequence of ids.
   * @return {Generator}     - The Generator.
   */
  *get_locks(ids) {
    yield* this._map.neighborhood(ids);
  }
}

module.exports = AnimationManager;
