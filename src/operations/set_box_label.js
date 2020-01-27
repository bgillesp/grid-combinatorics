const Operation = require("./operation.js");

class SetBoxLabelOperation extends Operation {
  constructor(x, y, label) {
    super("set_box_label");
    this.params.x = x;
    this.params.y = y;
    this.params.label = label;
    this.memory.label = null;
  }

  execute(app) {
    const { x, y, label } = this.params;
    this.memory.label = app.grid.get(x, y).label;
    app.grid.set_label(x, y, label);
  }

  undo(app) {
    const { x, y } = this.params;
    const { label: old_label } = this.memory;
    app.grid.set_label(x, y, old_label);
  }
}

module.exports = SetBoxLabelOperation;
