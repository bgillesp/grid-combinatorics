const LayerMap = require("../data_structures/layer_map.js");

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
    return this._map.has_ancestor(ids) || this._map.has_descendent(ids);
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

module.exports = LockMap;
