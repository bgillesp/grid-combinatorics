const Operation = require("./operation.js");

class MoveBoxOperation extends Operation {
  constructor(start_x, start_y, end_x, end_y) {
    super("move_box");
    this.params.x = end_x;
    this.params.y = end_y;
    this.memory.x = start_x;
    this.memory.y = start_y;
  }

  execute(app) {
    let { x, y } = this.params;
    let { x: old_x, y: old_y } = this.memory;
    app.grid.move(old_x, old_y, x, y);
  }

  undo(app) {
    let { x, y } = this.params;
    let { x: old_x, y: old_y } = this.memory;
    app.grid.move(x, y, old_x, old_y);
  }
}

module.exports = MoveBoxOperation;
