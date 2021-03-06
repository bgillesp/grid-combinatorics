const assert = require("chai").assert;

const _ = require("underscore");
const GridArray = require("./grid_array.js");

describe("GridArray", () => {
  var ga;

  describe("Initialization", () => {
    beforeEach(() => {
      ga = new GridArray();
    });

    describe("constructor()", () => {
      it("should produce an object", () => {
        assert.typeOf(ga, "object");
      });

      it("should initialize to empty values", () => {
        assert.isEmpty(ga._values);
      });

      it("should have correct empty bounds", () => {
        let bounds = ga.bounds();
        assert.equal(bounds.x_min, Infinity);
        assert.equal(bounds.y_min, Infinity);
        assert.equal(bounds.x_max, -Infinity);
        assert.equal(bounds.y_max, -Infinity);
      });
    });

    describe("set(x, y, value)", () => {
      const x = 2,
        y = 3,
        val = "a";

      beforeEach(() => {
        ga.set(x, y, val);
      });

      it("should create values coordinate object", () => {
        assert.isObject(ga._values[x]);
      });

      it("should set a value", () => {
        assert.equal(ga._values[x][y], val);
      });

      it("should set correct bounds", () => {
        ga.set(x + 1, y - 1, val);
        let bounds = ga.bounds();
        assert.equal(bounds.x_min, x);
        assert.equal(bounds.x_max, x + 1);
        assert.equal(bounds.y_min, y - 1);
        assert.equal(bounds.y_max, y);
      });

      it("should raise an error for non-integer coordinates", () => {
        assert.throws(() => {
          ga.set("foo", y, val);
        });
        assert.throws(() => {
          ga.set(x, 1.5, val);
        });
      });
    });
  });

  describe("Operations", () => {
    const x = 2,
      y = 3,
      val = "a";

    beforeEach(() => {
      ga = new GridArray();
      ga.set(x, y, val);
    });

    describe("get(x, y)", () => {
      it("should return stored values", () => {
        assert.equal(ga.get(x, y), val);
      });

      it("should return undefined for empty coordinates", () => {
        assert.isUndefined(ga.get(x + 1, y));
      });

      it("should raise an error for non-integer coordinates", () => {
        assert.throws(() => {
          ga.get("foo", y);
        });
        assert.throws(() => {
          ga.get(x, 1.5);
        });
      });
    });

    describe("remove(x, y)", () => {
      it("should remove a stored value and return true", () => {
        assert.isTrue(ga.has(x, y));
        assert.isTrue(ga.remove(x, y));
        assert.isFalse(ga.has(x, y));
      });

      it("should return false if asked to remove nonexistent value", () => {
        assert.isFalse(ga.remove(x + 1, y));
      });

      it("should raise an error for non-integer coordinates", () => {
        assert.throws(() => {
          ga.remove("foo", y);
        });
        assert.throws(() => {
          ga.remove(x, 1.5);
        });
      });
    });

    describe("has(x, y)", () => {
      it("should check whether a value is specified for integer coordinates", () => {
        assert.isTrue(ga.has(x, y));
        assert.isFalse(ga.has(x + 1, y));
      });

      it("should raise an error for non-integer coordinates", () => {
        assert.throws(() => {
          ga.has("foo", y);
        });
        assert.throws(() => {
          ga.has(x, 1.5);
        });
      });
    });

    describe("bounds()", () => {
      it("should return an object representing a bounding box", () => {
        let bounds = ga.bounds();
        assert.isNumber(bounds.x_min);
        assert.isNumber(bounds.x_max);
        assert.isNumber(bounds.y_min);
        assert.isNumber(bounds.y_max);
      });

      it("should recompute bounding box after removal", () => {
        ga.remove(x, y);
        // ga is now empty, after previously having had an element at (x, y)
        let bounds = ga.bounds();
        assert.equal(bounds.x_min, Infinity);
        assert.equal(bounds.x_max, -Infinity);
        assert.equal(bounds.y_min, Infinity);
        assert.equal(bounds.y_max, -Infinity);
      });
    });
  });

  describe("Static", () => {
    describe("_check_input_coords(x, y)", () => {
      it("should check for inputs which are not numbers", () => {
        const non_numeric = "a";
        assert.throws(() => {
          GridArray._check_input_coords(non_numeric, 0);
        });
        assert.throws(() => {
          GridArray._check_input_coords(0, non_numeric);
        });
      });

      it("should check for numerical inputs which are not integers", () => {
        const non_integer = 1.5;
        assert.throws(() => {
          GridArray._check_input_coords(non_integer, 0);
        });
        assert.throws(() => {
          GridArray._check_input_coords(0, non_integer);
        });
      });
    });
  });
});
