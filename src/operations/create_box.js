const Operation = require("./operation.js");

class CreateBoxOperation extends Operation {
  constructor(x, y, label) {
    super("create_box");
    this.params.x = x;
    this.params.y = y;
    this.params.label = label;
  }

  execute(app) {
    let p = this.params;
    app.grid.add(p.x, p.y, p.label);
  }

  undo(app) {
    let p = this.params;
    app.grid.remove(p.x, p.y);
  }
}

module.exports = CreateBoxOperation;
