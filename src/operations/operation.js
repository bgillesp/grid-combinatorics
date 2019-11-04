class Operation {
  constructor(type) {
    // string representation of operation type
    this.type = type;
    // parameters of operation specification
    this.params = {};
    // memory for existing state to undo
    this.memory = {};
  }

  execute(app) {}

  undo(app) {}
}

// var T = {};
// T.Operation = Operation;
// T.CreateBoxOperation = CreateBoxOperation;
// T.MoveBoxOperation = MoveBoxOperation;
module.exports = Operation;
