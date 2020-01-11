const Operation = require("./operation.js");

class CreateBoxOperation extends Operation {
  constructor(x, y, label) {
    super("create_box");
    this.params.x = x;
    this.params.y = y;
    this.params.label = label;
  }

  execute(app) {
    const { x, y, label } = this.params;
    app.grid.add(x, y, label);
  }

  undo(app) {
    const { x, y } = this.params;
    app.grid.remove(x, y);
  }
}

module.exports = CreateBoxOperation;
