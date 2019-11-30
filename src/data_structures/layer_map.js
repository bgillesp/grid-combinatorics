/**
 * A LayerMap object represents a type of map which assigns values to sequences
 * of keys. Interface and behavior are designed to be similar to the standard
 * ES6 Map object.  In particular, this allows for straightforward organization
 * and manipulation of data that is arranged in a hierarchical fashion.  Keys
 * and values may be any datatypes compatible with Map objects.
 */
class LayerMap {
  /**
   * Construct a new empty LayerMap object.
   */
  constructor() {
    this._parent = null;
    this._parent_key = null;
    this._value = undefined;
    this._has_value_flag = false;
    this._map = new Map();
    this._size = 0;
  }

  /**
   * Set the parent map of this LayerMap object and the key in which this map is
   * stored in the parent object.
   * @param {LayerMap} map - The new parent map.
   * @param            key - The key.
   */
  _set_parent(map, key) {
    this._parent = map;
    this._parent_key = key;
  }

  /**
   * Get a descendent map indexed by a given sequence of keys.  If no map is
   * indexed by the given sequence, either create the necessary maps if create
   * is `true`, or otherwise return `undefined`.
   * @param  {Array}    keys           - The sequence of keys.
   * @param  {Boolean}  [create=false] - Whether to create missing maps.
   * @return {LayerMap}                - The map indexed by keys, or undefined.
   */
  _get_descendent_map(keys, create = false) {
    let map = this;
    for (let key of keys) {
      if (map._map.has(key)) {
        map = map._map.get(key);
      } else if (create) {
        // otherwise make descendent and pass to it
        let desc = new LayerMap();
        desc._set_parent(map, key);
        map._map.set(key, desc);
        map = desc;
      } else {
        return undefined;
      }
    }
    return map;
  }

  /**
   * Delete the oldest ancestor map of this LayerMap object with size zero from
   * its parent map.  If the oldest such ancestor map is the root map, delete
   * the second to oldest from the root map.
   */
  _prune_empty_ancestors() {
    if (this.size() > 0 || !this._parent_map) return;
    let map = this,
      key = null;
    while (map.size() == 0) {
      if (!map._parent_map) break;
      key = map._parent_key;
      map = map._parent_map;
    }
    map._map.delete(key);
  }

  /**
   * Copy this LayerMap and all submaps to the specified target object.  The
   * target object is identical to this object in every field but its parent
   * map, which is retained.  (This behavior is useful for copying one LayerMap
   * to another in a separate LayerMap hierarchy.)  This method has no side
   * effects on ancestors of the target object.
   * @param  {LayerMap} target - The object to copy this LayerMap to.
   */
  _copy_to(target) {
    target._value = this._value;
    target._has_value_flag = this._has_value_flag;
    target._map = new Map();
    this._map.forEach((submap, key) => {
      if (submap._size > 0) {
        let submap_copy = new LayerMap();
        target._map.set(key, submap_copy);
        submap_copy._set_parent(target, key);
        submap._copy_to(submap_copy);
      }
    });
    target._size = this._size;
    // target parent is preserved
  }

  /**
   * Return a copy of this LayerMap containing only the values prefixed by the
   * given sequence of keys.  If `truncate` is specified, then remove the
   * prefix of keys from every entry of the copy.
   * @param  {Array}    keys     - The prefix of keys.
   * @param  {Boolean}  truncate - Whether to truncate the prefix from the copy.
   * @return {LayerMap}          - The copied LayerMap.
   */
  _copy(keys = null, truncate = false) {
    if (!keys) keys = new Array();
    let copy = new LayerMap(),
      source = this._get_descendent_map(keys),
      target = truncate ? copy : copy._get_descendent_map(keys, true);
    if (source && source._size > 0) {
      // elements with the specified prefix exist
      source._copy_to(target);
    }
    return copy;
  }

  /**
   * Return a copy of this LayerMap containing only the values prefixed by the
   * given sequence of keys.
   * @param  {Array}    keys     - The prefix of keys.
   * @return {LayerMap}          - The copied LayerMap.
   */
  copy(keys = null) {
    return this._copy(keys);
  }

  /**
   * Modify the size parameter of this LayerMap and all its ancestors by adding
   * the given value (may be negative).
   * @param  {Number} delta - The amount to adjust all sizes by; should be an
   *                          integer.
   */
  _update_size(delta) {
    let map = this;
    while (map) {
      map._size += delta;
      map = map._parent;
    }
  }

  /**
   * Return the number of values stored for keys prefixed by the given sequence
   * of keys.  If keys is unspecified, return the number stored in the entire
   * LayerMap object.
   * @param  {Array} [keys=null] - The sequence of keys.
   * @return {Number}            - The number of stored values.
   */
  size(keys = null) {
    if (!keys || keys.length == 0) return this._size;
    let map = this._get_descendent_map(keys);
    return map ? map._size : 0;
  }

  /**
   * Return whether this LayerMap has a value stored at the root level.
   * @return {Boolean} - Whether a value is stored.
   */
  _has_value() {
    return this._has_value_flag;
  }

  /**
   * Set the value stored in this LayerMap, and if a value wasn't previously,
   * stored, increment its size and the sizes of all its ancestors.
   * @param value - The value to set.
   */
  _set_value(value) {
    if (!this._has_value_flag) {
      this._update_size(1);
      this._has_value_flag = true;
    }
    this._value = value;
  }

  /**
   * Get the value stored in this LayerMap, or `undefined` if no value is
   * stored.
   * @return - The stored value, or `undefined`.
   */
  _get_value() {
    return this._has_value() ? this._value : undefined;
  }

  /**
   * Delete the value stored in this LayerMap.  Decrement the size of this map
   * and its ancestors if a value was deleted.
   * @return - Whether a value was deleted.
   */
  _delete_value() {
    if (this._has_value_flag) {
      this._update_size(-1);
      this._has_value_flag = false;
      this._value = undefined;
      this._prune_empty_ancestors();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Return whether this LayerMap has a value stored with the given sequence of
   * keys.
   * @param  {Array}   keys - The sequence of keys.
   * @return {Boolean}      - Whether an element exists for this sequence.
   */
  has(keys) {
    let map = this._get_descendent_map(keys);
    return Boolean(map && map._has_value());
  }

  /**
   * Set a value for the given sequence of keys.
   * @param {Array} keys  - The sequence of keys.
   * @param         value - The value to set.
   */
  set(keys, value) {
    // for each key, pass to the descendent by key if it exists
    let map = this._get_descendent_map(keys, true);
    map._set_value(value);
  }

  /**
   * Get the value stored for the given sequence of keys, or `undefined` if no
   * value exists.
   * @param  {Array} keys - The sequence of keys.
   * @return              - The stored value, or `undefined`.
   */
  get(keys) {
    let map = this._get_descendent_map(keys);
    return map ? map._get_value() : undefined;
  }

  /**
   * Delete the value stored for the given sequence of keys.  Return whether a
   * value was deleted.
   * @param  {Array}   keys - The sequence of keys.
   * @return {Boolean}      - Whether a value was deleted.
   */
  delete(keys) {
    let map = this._get_descendent_map(keys);
    if (map) {
      return map._delete_value();
    } else {
      return false;
    }
  }

  /**
   * Clear the value and all descendents of this LayerMap.  Removes this and any
   * empty ancestors from the root LayerMap structure.
   * @return {Boolean} - Whether any values were removed.
   */
  clear() {
    this._delete_value();
    let old_size = this.size();
    this._map.clear();
    this._update_size(-old_size);
    this._prune_empty_ancestors();
    return old_size > 0;
  }

  /**
   * Return whether any values are stored in this LayerMap with keys prefixed
   * by the specified sequence of keys.
   * @param  {[type]}  keys - The prefix of keys.
   * @return {Boolean}      - Whether any values have keys prefixed by `keys`.
   */
  has_descendent(keys) {
    return this.size(keys) > 0;
  }

  /**
   * Set the values of this LayerMap object rooted at the specified sequence of
   * keys to the valus of another LayerMap object.  This operation overwrites
   * any existing values with keys prefixed by the specified sequence.  If `seq`
   * is a key sequence in the overwriting map, then the corresponding key
   * sequence resulting in this map is the concatenation of `keys` with `seq`.
   * @param {Array}    keys - The key sequence.
   * @param {LayerMap} map  - The LayerMap to use as overwriting values.
   */
  set_submap(keys, map) {
    if (map.size() == 0) {
      this.delete_submap(keys);
    } else {
      let target = this._get_descendent_map(keys, true);
      let old_size = target.size(),
        new_size = map.size();
      target._update_size(new_size - old_size);
      map._copy_to(target);
    }
  }

  /**
   * Return a copy of the LayerMap referenced by the given sequence of keys.
   * The prefix key sequence is removed from the key sequences of all elements.
   * @param  {Array} keys - The sequence of keys.
   * @return {LayerMap}   - The copied submap.
   */
  get_submap(keys) {
    return this._copy(keys, true);
  }

  /**
   * Delete all values of this LayerMap prefixed by the given sequence of keys.
   * @param  {Array}   keys - The sequence of keys.
   * @return {Boolean}      - Whether any values were deleted.
   */
  delete_submap(keys) {
    let map = this._get_descendent_map(keys);
    return map ? map.clear() : false;
  }

  /**
   * Generator to return all nodes currently in this LayerMap which are (strict)
   * ancestors of the specified sequence of keys.
   * @param  {Array}     keys - The sequence of keys.
   * @return {Generator}      - The generator.
   */
  *_ancestor_nodes(keys) {
    let map = this;
    for (const key of keys) {
      yield map;
      if (map._map.has(key)) {
        map = map._map.get(key);
      } else {
        break;
      }
    }
  }

  /**
   * Return whether any values exist in this LayerMap for key sequences which
   * are a strict prefix of the given key sequence.
   * @param  {Array}  keys - The sequence of keys.
   * @return {Boolean}     - Whether an ancestor value exists.
   */
  has_ancestor(keys) {
    for (const node of this._ancestor_nodes(keys)) {
      if (node._has_value()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return an Array of the ancestor entries of a given key sequence.  Entries
   * are represented as [key, value] pairs.
   * @param  {Array} keys - The sequence of keys.
   * @return {Array}      - The entries which are strict ancestors.
   */
  get_ancestors(keys) {
    let ancestors = new Array();
    for (const node of this._ancestor_nodes(keys)) {
      if (node._has_value()) {
        ancestors.push(new Array(node._get_value(), node._get_key_sequence()));
      }
    }
    return ancestors;
  }

  /**
   * Delete all strict ancestors of a given key sequence.  Returns whether any
   * entries were deleted.
   * @param  {Array}   keys - The sequence of keys.
   * @return {Boolean}      - Whether any ancestors were deleted.
   */
  delete_ancestors(keys) {
    if (this._has_ancestor(keys)) {
      for (const node of this._ancestor_nodes(keys)) {
        node._delete_value();
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Generates all of the nodes of this LayerMap prefixed by a given sequence of
   * keys, including nodes which are not assigned a value.  Nodes are
   * represented as their nested LayerMap objects.
   * @param  {Array}     [keys=null] - The sequence of keys.
   * @return {Generator}             - The generator for nodes.
   */
  *_nodes(keys = null) {
    let start_map = keys ? this._get_descendent_map(keys) : this;
    if (!start_map) return;
    let pending = new Array();
    pending.push(start_map);
    for (let i = 0; i < pending.length; ++i) {
      let map = pending[i]; // TODO memory-performance tradeoff
      yield map;
      map._map.forEach(submap => {
        if (submap.size() > 0) {
          pending.push(submap);
        }
      });
    }
  }

  /**
   * Return the sequence of keys leading from the root map to this map.
   * @return {Array} - The sequence of keys.
   */
  _get_key_sequence() {
    let key = this._parent_key,
      map = this._parent;
    let key_seq = new Array();
    while (map) {
      key_seq.push(key);
      key = map._parent_key;
      map = map._parent;
    }
    return key_seq.reverse();
  }

  /**
   * Generate all of the entries of this LayerMap object which are prefixed by
   * the given sequence of keys.  Entries are formatted as pairs [key, value],
   * where key is an Array of keys and value is the corresponding value.
   * @param  {Array}     [prefix=null] - The sequence of keys.
   * @return {Generator}               - The generator for entries.
   */
  *entries(prefix = null) {
    for (const node of this._nodes(prefix)) {
      if (node._has_value()) {
        yield new Array(node._get_value(), node._get_key_sequence());
      }
    }
  }

  /**
   * The default generator for the LayerMap object.  This is an alias for
   * LayerMap.entries().
   */
  [Symbol.iterator]() {
    return this.entries();
  }

  /**
   * Call the specified callback function for each [key, value] pair, optionally
   * only passing those with a given prefix of keys.  The format of the callback
   * function is callback(value, keys, map), where map is the LayerMap object
   * being traversed.
   * @param  {Function} callback     - The callback function.
   * @param  {Array}   [prefix=null] - The sequence of keys.
   * @param  {Object}   thisArg      - The object to use as the scope of the
   *                                   callbacks, used as `this`.
   */
  forEach(callback, prefix = null, thisArg = null) {
    if (thisArg) callback = callback.bind(thisArg);
    for (const [value, key] of this.entries(prefix)) {
      callback(value, key, this);
    }
  }

  /**
   * Generate all of the key sequences of values stored in this LayerMap object,
   * formatted as arrays of keys.
   * @param  {Array}     [prefix=null] - The sequence of keys.
   * @return {Generator}             - The generator.
   */
  *keys(prefix = null) {
    for (const [value, key] of this.entries(prefix)) {
      yield key;
    }
  }

  /**
   * Generate all of the values stored in this LayerMap object.
   * @param  {Array}     [prefix=null] - The sequence of keys.
   * @return {Generator}               - The generator.
   */
  *values(prefix = null) {
    for (const [value, key] of this.entries(prefix)) {
      yield value;
    }
  }
}

module.exports = LayerMap;
