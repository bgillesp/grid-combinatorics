class UndoQueue {
  constructor() {
    this.undo_queue = [];
    this.redo_queue = [];
  }

  push(op) {
    this.undo_queue.push(op);
    this.redo_queue.length = 0;
  }

  pop_undo() {
    if (this.undo_queue.length > 0) {
      var op = this.undo_queue.pop();
      this.redo_queue.push(op);
      return op;
    } else {
      return null;
    }
  }

  pop_redo() {
    if (this.redo_queue.length > 0) {
      var op = this.redo_queue.pop();
      this.undo_queue.push(op);
      return op;
    } else {
      return null;
    }
  }
}

module.exports = UndoQueue;
