class LayerMap {
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
    target._map = new LayerMap();
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
  copy(keys = null, truncate = false) {
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
  has_prefix(keys) {
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
  set_prefix(keys, map) {
    if (map.size() == 0) {
      this.delete_prefix(keys);
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
   * The prefix sequence is removed from the key sequences of all elements.
   * @param  {Array} keys - The sequence of keys.
   * @return {LayerMap}   - The copied prefix map.
   */
  get_prefix(keys) {
    return this.copy(keys, true);
  }

  /**
   * Delete all values of this LayerMap prefixed by the given sequence of keys.
   * @param  {[type]} keys - The sequence of keys.
   * @return {[type]}      [description]
   */
  delete_prefix(keys) {
    let map = this._get_descendent_map(keys);
    return map ? map.clear() : false;
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
   * Return the sequence of keys leading from the root map to this map.
   * @return {Array} - The sequence of keys.
   */
  _get_key_sequence() {
    let map = this;
    let keys = new Array();
    while (map) {
      keys.push(map._parent_key);
      map = map._parent;
    }
    return keys.reverse();
  }

  /**
   * Call the specified callback function for each key, value pair.  The format
   * of the callback function is callback(value, keys, map), where map is the
   * LayerMap object being traversed.
   * @param  {Function} callback [description]
   */
  forEach(callback, thisArg = null) {
    if (thisArg) callback = callback.bind(thisArg);
    let pending = new Array();
    pending.push(this);
    for (let i = 0; i < pending.length; ++i) {
      let map = pending[i];
      if (map._has_value()) {
        callback(map._get_value(), map._get_key_sequence(), this);
      }
      this._map.forEach(submap => {
        if (submap.size() > 0) {
          pending.push(submap);
        }
      });
    }
  }

  // *entries(keys = null) {
  //   let map = keys ? this._get_descendent_map(keys) : this;
  //   if (!map) return;
  // }
}

class LayerMapIterator {}

///////////////////////////////////////////////////////////////////
//
//   /**
//    * Remove any empty lock maps prefixed by the given lookup.
//    * @param  {Object} lookup - Lookup object returned by LockManager._lookup.
//    */
//   static _normalize_value(lookup) {
//     const value = lookup.value;
//     if (LockManager.is_lock_map(value)) {
//       value._normalize_rec();
//     }
//   }
//
//   /**
//    * Normalize the lock maps on the lookup path of a lookup, removing any maps
//    * which prefix no primitive locks.
//    * @param  {Object} lookup - Lookup object returned by LockManager._lookup.
//    */
//   static _normalize_path(lookup) {
//     if (lookup.is_primitive_lock()) {
//       return;
//     }
//     if (lookup.is_undefined()) {
//       if (lookup.length == 0) {
//         return;
//       } else {
//         lookup = lookup.pop();
//       }
//     }
//     let path = lookup.path;
//     for (let i = lookup.length - 1; i >= 0; --i) {
//       let map = path[i][0],
//         id = path[i][1],
//         val = map.get(id);
//       if (LockManager.is_lock_map(val) && val.size == 0) {
//         map.delete(id);
//       } else {
//         break;
//       }
//     }
//   }
//
//   /**
//    * Recursively remove any empty lock maps referenced by this lock map.
//    */
//   _normalize() {
//     self.forEach((val, key, map) => {
//       if (LockManager.is_lock_map(val)) {
//         val._normalize();
//         if (val.size == 0) {
//           map.delete(key);
//         }
//       }
//     });
//   }
//
//   // TODO
//   /**
//    * Add a primitive lock with given ids, associated with a given value
//    * @param  {Array} ids - The Array of ids.
//    * @param  value       - The value; may be any value except undefined
//    * @return {Boolean}   - Whether the lock was obtained.
//    */
//   lock(ids, value = null) {
//     if (value === undefined) {
//       throw new Error("Unable to lock with value undefined");
//     }
//     let lookup = this._lookup(ids);
//     if (!lookup.is_undefined()) {
//       return false;
//     } else {
//       lookup = lookup.pop();
//       let root_map = lookup.value;
//       for (let i = lookup.length; i < ids.length; ++i) {}
//     }
//     val = lookup.value;
//     if (val === undefined || LockManager._is_lock_map(val)) {
//     }
//   }
//
//   // TODO
//   /**
//    * Removes any primitive locks blocking a given sequence of ids
//    * @param  {Array}  ids - The sequence of ids.
//    * @return {Boolean}    - Whether any locks were removed.
//    */
//   unlock(ids = null) {
//     let lookup = self._lookup(ids);
//     if (!LockManager._is_locked(lookup)) {
//       return false;
//     } else if (length == 0) {
//       lookup.value.clear();
//     }
//     if (lookup.is_primitive()) {
//       let p = lookup.path[lookup.path.length - 1];
//       p[0].delete(p[1]);
//       lookup = lookup.pop();
//     } else {
//       lookup.value.clear();
//     }
//     LockManager._normalize_path(lookup);
//     return true;
//   }
//
//   /**
//    * Returns whether there exists a primitive lock prefixed by specified ids.
//    * @param  {[type]}  ids - The lookup Array of ids.
//    * @return {Boolean}     - Whether a prefixed primitive lock exists.
//    */
//   is_locked(ids) {
//     let lookup = this._lookup(ids);
//     return LockManager._is_locked(lookup);
//   }
//   static _is_locked(lookup) {
//     return (
//       lookup.is_primitive() ||
//       (LockManager._is_lock_map(lookup.value) && lookup.value._is_locked_rec())
//     );
//   }
//   _is_locked_rec() {
//     var locked = false;
//     for (value of self.values()) {
//       if (LockManager._is_lock_map(value)) {
//         locked = value._is_locked_rec();
//       } else {
//         locked = true;
//       }
//       if (locked) break;
//     }
//     return false;
//   }
//
//   // TODO
//   get_locks(ids) {
//     var locks = [];
//     let lookup = LockManager._lookup(this._locks, ids);
//     if (!self._is_locked(lookup)) {
//     }
//     var cur_map = this._locks;
//     // for (let i = 0; i < ids.length; ++i) {
//     //
//     // }
//   }
//
//   _get_locks() {}
//
//   register(id) {}
// }

// class Query {
//   /**
//    * Construct a query for a LayerMap object.
//    * @param {[type]} root - The root LayerMap object.
//    * @param {[type]} keys - The sequence of keys for the query.
//    */
//   constructor(root, keys) {
//     this.root = root;
//     this.keys = Array.from(keys);
//     this._path = null;
//     this._result = undefined;
//     this._initialize();
//   }
//
//   _initialize() {
//     if (this._search === null) {
//       const keys = this.keys;
//       let current = this.root,
//         path = new Array();
//       for (let i = 0; i < keys.length; ++i) {
//         if (current instanceof LayerMap) {
//           let key = keys[i];
//           if (current.has(id)) {
//             path.push([current, id]);
//             current = current.get(id);
//           } else {
//             current = undefined;
//             break;
//           }
//         } else {
//           break;
//         }
//       }
//       self.value = current;
//       self.path = path;
//       self.length = path.length;
//     }
//   }
//
//   get_path() {}
// }
//
// class Lookup {
//   /**
//    * Lookup from the current state of a lock map, following a specified sequence
//    * of lookup ids, which can be any valid index for a Map object. Value may be
//    * one of three types:
//    *  - A value not `undefined` and not a lock map, representing a primitive
//    *    lock indexed by some prefix of the lookup Array.
//    *  - A lock map, representing the sub-map of all primitive locks prefixed by
//    *    the entire lookup Array.
//    *  - The value `undefined`, representing the case that no primitive lock is
//    *    present within some prefix of the lookup Array.
//    * The path parameter of the Lookup object gives an Array of tuples [map, id]
//    * representing the path of lock map references leading to the value.
//    * @param  {LockMap}   map - LockMap object to search from.
//    * @param  {Array}     ids - The lookup Array of ids.
//    */
//   constructor(map, ids = null) {
//     if (arguments.length == 0) {
//       // null constructor
//       self.value = null;
//       self.path = new Array();
//       self.length = 0;
//     } else if (arguments.length == 1) {
//       // copy constructor, map is a Lookup object
//       self.value = map.value;
//       let path = new Array();
//       map.path.forEach(p => {
//         path.push(Array.from(p));
//       });
//       self.path = path;
//       self.length = map.length;
//     } else {
//       // LockMap constructor
//       if (!ids) ids = new Array();
//       var current = map,
//         path = [];
//       for (let i = 0; i < ids.length; i++) {
//         if (LockManager.is_lock_map(current)) {
//           let id = ids[i];
//           if (current.has(id)) {
//             path.push([current, id]);
//             current = current.get(id);
//           } else {
//             current = undefined;
//             break;
//           }
//         } else {
//           break;
//         }
//       }
//       self.value = current;
//       self.path = path;
//       self.length = path.length;
//     }
//   }
//
//   is_primitive() {
//     return self.value !== undefined && !LockManager.is_lock_map(self.value);
//   }
//   is_map() {
//     return LockManager.is_lock_map(self.value);
//   }
//   is_undefined() {
//     return self.value === undefined;
//   }
//
//   // parent_map() {
//   //   if (path.length > 0) {
//   //     return self.path[path.length - 1][0];
//   //   } else {
//   //     return null;
//   //   }
//   // }
//
//   /**
//    * Return a copy of this Lookup object with its last reference removed.  If
//    * length of lookup is zero, returns a length zero lookup with value
//    * `undefined`.
//    * @return {Lookup} - The copy with its last reference removed.
//    */
//   pop() {
//     var lookup = new Lookup(self);
//     if (lookup.length > 0) {
//       lookup.value = lookup.path[lookup.length - 1][0];
//       lookup.path.pop();
//       lookup.length -= 1;
//     } else {
//       lookup.value = undefined;
//     }
//     return lookup;
//   }
// }

module.exports = LayerMap;
