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
    const box = app.grid.get(x, y);
    this.memory.label = box.label;
    box.set_label(label);
  }

  undo(app) {
    const { x, y } = this.params;
    const { label: old_label } = this.memory;
    const box = app.grid.get(x, y);
    box.set_label(old_label);
  }
}

module.exports = SetBoxLabelOperation;
