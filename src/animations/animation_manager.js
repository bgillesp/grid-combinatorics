const _ = require("underscore");
const FlexTimer = require("./flex_timer.js").FlexTimer;
const RateFunction = require("./flex_timer.js").RateFunction;

/**
 * AnimationManager is a class to handle the sequencing of animations on grid
 * boxes and other components
 */
class AnimationManager {
  /**
   * Construct an AnimationManager object.
   */
  constructor() {
    this.timer = new FlexTimer(0, 1000 / 60);
    this.execute = false;
    this.locks = new LockMap();
  }

  start() {
    this.execute = true;
    this.dispatch();
  }

  dispatch() {}

  schedule(animation) {
    this.queue.push(animation);
  }
}

/**
 * The LockMap class is a thin wrapper around a LayerMap object which preserves
 * the invariant that no two stored keys are comparable in terms of being
 * prefixes.
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
    if (this.is_locked(ids)) {
      return false;
    } else {
      this._map.set(ids, value);
      return true;
    }
  }

  /**
   * Unlock any locks which are comparable with the given sequence of ids.
   * Return whether any locks were removed.
   * @param  {Array}   ids - The sequence of ids.
   * @return {Boolean}     - Whether any locks were removed.
   */
  unlock(ids) {
    if (this._map.has_ancestor(ids)) {
      this._map.delete_ancestors();
      return true;
    } else if (this._map.has_descendent(ids)) {
      this._map.delete_submap(ids);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Return whether a given sequence of ids is comparable with a currently
   * stored sequence.
   * @param  {[type]}  ids - The sequence of ids.
   * @return {Boolean}     - Whether a comparable sequence is stored.
   */
  is_locked(ids) {
    return this._map.has_ancestor() || this._map.has_descendent(ids);
  }

  *get_locks(ids) {
    if (this._map.has_ancestor(ids)) {
      yield* this._map.get_ancestors(ids);
    } else if (this._map.has_descendents(ids)) {
      yield this._map.entries(ids);
    } else {
      return;
    }
  }
}
