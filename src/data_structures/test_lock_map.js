const assert = require("chai").assert;

const LockMap = require("./lock_map.js");

const Util = require("./util.js");
const stringify_key = Util.layer_map.stringify_key;
const flatten = Util.layer_map.flatten;

describe("LockMap", () => {
  var map;

  const data = [
      [[1], "value 1"],
      [[2, 1], "value 2 1"],
      [[2, 2], "value 2 2"],
      [[3, 1, "a"], "value 3 1 a"]
    ],
    available_locks = [[[2, 3], "available"], [[4], "available"]],
    unavailable_locks = [
      [[1, 1], "locked suffix"],
      [[1], "locked value"],
      [[2], "locked prefix"]
    ];

  beforeEach(() => {
    map = new LockMap();
    data.forEach(d => {
      map.lock(d[0], d[1]);
    });
  });

  describe("constructor", () => {
    it("should produce an instance of LockMap", () => {
      map = new LockMap();
      assert.isTrue(map instanceof LockMap);
    });
  });

  describe("lock", () => {
    it("locks available prefixes", () => {
      available_locks.forEach(([prefix, value]) => {
        assert.isFalse(map.has_locks(prefix));
        assert.isTrue(map.lock(prefix, value));
        assert.isTrue(map.has_locks(prefix));
      });
    });

    it("does not lock unavailable prefixes", () => {
      unavailable_locks.forEach(([prefix, value]) => {
        assert.isTrue(map.has_locks(prefix));
        assert.isFalse(map.lock(prefix, value));
        assert.isTrue(map.has_locks(prefix));
      });
    });
  });

  describe("unlock", () => {
    it("should unlock an ", () => {});
  });
});
