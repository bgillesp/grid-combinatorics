class Operation {
  constructor() {
    // parameters of operation specification
    this.params = {};
    // memory for existing state to undo
    this.memory = {};
  }

  execute() {}

  undo() {}
}

class MoveOperation extends Operation {
  constructor(box, x, y) {
    super();
    this.params.box = box;
    this.params.x = x;
    this.params.y = y;
    this.memory.x = box.x;
    this.memory.y = box.y;
  }

  execute() {
    super.execute();
    var box = this.params.box;
    var x = this.params.x;
    var y = this.params.y;
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
}
