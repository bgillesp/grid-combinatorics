const LayerMap = require("../data_structures/layer_map.js");
const LockMap = require("../data_structures/lock_map.js");

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

module.exports = LockQueue;
