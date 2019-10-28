const assert = require("chai").assert;

const _ = require("underscore");
const grid = require("../grid.js");

describe("GridData", () => {
  var gd;
  const x1 = 2,
    y1 = 3,
    val1 = "a",
    x2 = 1,
    y2 = 3,
    val2 = "b",
    x3 = 0,
    y3 = 2;

  beforeEach(() => {
    gd = new grid.GridData();
    gd.add(x1, y1, val1);
    gd.add(x2, y2, val2);
  });

  describe("move(x_start, y_start, x_end, y_end)", () => {
    it("should move data from one location to another", () => {
      assert.equal(gd.get(x1, y1), val1);
      assert.notExists(gd.get(x3, y3));
      gd.move(x1, y1, x3, y3);
      assert.notExists(gd.get(x1, y1));
      assert.equal(gd.get(x3, y3), val1);
    });

    it("should raise an error if target location is occupied", () => {
      assert.equal(gd.get(x1, y1), val1);
      assert.equal(gd.get(x2, y2), val2);
      let fn = gd.move.bind(x1, y1, x2, y2);
      assert.throws(fn);
    });
  });
});
