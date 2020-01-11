const Operation = require("./operation.js");

class DeleteBoxOperation extends Operation {
  constructor(x, y) {
    super("delete_box");
    this.params.x = x;
    this.params.y = y;
    this.memory.label = null;
  }

  execute(app) {
    const { x, y } = this.params;
    this.memory.label = app.grid.get(x, y).label;
    app.grid.remove(x, y);
  }

  undo(app) {
    const { x, y } = this.params;
    const { label } = this.memory;
    app.grid.add(x, y, label);
  }
}

module.exports = DeleteBoxOperation;
