const Operation = require("./operation.js");

class MoveBoxOperation extends Operation {
  constructor(box, x, y) {
    super("move_box");
    this.params.box = box;
    this.params.x = x;
    this.params.y = y;
    this.memory.x = box.x;
    this.memory.y = box.y;
  }

  execute(app) {
    let box = this.params.box;
    let x = this.params.x;
    let y = this.params.y;
    box.x = x;
    box.y = y;
    // TODO handle speed / timing
    let anim = new Tween.Tween(box.render.group.translation)
      .to({ x: x, y: y }, 1000)
      .easing(Tween.Easing.Quadratic.Out);
    if (box.render.anim.length > 0) {
      box.render.anim[box.render.anim.length - 1];
    }
  }

  undo(app) {
    // ...
  }
}

module.exports = MoveBoxOperation;
