const Operation = require("./operation.js");

class ClearGridOperation extends Operation {
  constructor() {
    super("clear_grid");
  }

  execute(app) {
    let boxes = [];
    console.log(app.grid.data);
    for (const box of app.grid.data.values()) {
      boxes.push({
        x: box.x,
        y: box.y,
        label: box.label
      });
    }
    app.grid.bulk_remove(boxes);
    this.memory.boxes = boxes;
  }

  undo(app) {
    app.grid.bulk_add(this.memory.boxes);
  }
}

module.exports = ClearGridOperation;
