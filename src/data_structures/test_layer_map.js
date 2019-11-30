const assert = require("chai").assert;

const _ = require("underscore");
const LayerMap = require("./layer_map.js");

describe("LayerMap", () => {
  var map, submap;

  const data = [
      [[], 31],
      [["fah"], "a"],
      [["foo", "bar"], null],
      [["foo", "baz"], undefined]
    ],
    vals = [31, "a", null, undefined],
    key_seqs = {
      set_keys: [[], ["fah"], ["foo", "bar"], ["foo", "baz"]],
      nontrivial_prefix: [["foo"]],
      nontrivial_suffix: [["foo", "bar", "bah"], ["fah", "bah"]],
      not_comparable: [["bah"], ["foo", "bah"], ["foo", "bah", "dah"]],
      value_undefined: [["foo", "baz"]],
      nodes: [[], ["fah"], ["foo"], ["foo", "bar"], ["foo", "baz"]]
    },
    map_size = 4,
    flat_copy = {
      "": 31,
      ".fah": "a",
      ".foo.bar": null,
      ".foo.baz": undefined
    },
    submap_prefix = ["foo"],
    submap_size = 2,
    submap_flat_copy = {
      ".foo.bar": null,
      ".foo.baz": undefined
    };

  function stringify_key(keys) {
    return keys.reduce((aggr, str) => {
      return aggr + "." + str;
    }, "");
  }

  function flatten(map) {
    let record = new Object();
    for (const [value, key] of map.entries()) {
      record[stringify_key(key)] = value;
    }
    return record;
  }

  beforeEach(() => {
    map = new LayerMap();
    data.forEach(d => {
      map.set(d[0], d[1]);
    });
    submap = map._get_descendent_map(submap_prefix);
  });

  describe("constructor", () => {
    it("should produce an instance of LayerMap", () => {
      map = new LayerMap();
      assert.isTrue(map instanceof LayerMap);
    });
  });

  describe("_get_descendent_map", () => {
    it("should return a map for keys corresponding to a value", () => {
      key_seqs.set_keys.forEach(seq => {
        let descendent = map._get_descendent_map(seq);
        assert.isDefined(descendent);
        assert(descendent instanceof LayerMap);
      });
    });

    it("should return a map for keys prefixing a value", () => {
      key_seqs.nontrivial_prefix.forEach(seq => {
        let descendent = map._get_descendent_map(seq);
        assert.isDefined(descendent);
        assert(descendent instanceof LayerMap);
      });
    });

    it("should return undefined for keys which are not a prefix of a set value", () => {
      key_seqs.nontrivial_suffix.forEach(seq => {
        let descendent = map._get_descendent_map(seq);
        assert.isUndefined(descendent);
      });
      key_seqs.not_comparable.forEach(seq => {
        let descendent = map._get_descendent_map(seq);
        assert.isUndefined(descendent);
      });
    });

    it("should return a map for any keys if create specified to true", () => {
      Object.values(key_seqs).forEach(list => {
        list.forEach(seq => {
          let descendent = map._get_descendent_map(seq, true);
          assert.isDefined(descendent);
          assert(descendent instanceof LayerMap);
        });
      });
    });
  });

  describe("_copy_to", () => {
    it("should copy a map to an existing second map", () => {
      let new_map = new LayerMap();
      map._copy_to(new_map);
      assert.notEqual(map, new_map);
      assert.deepEqual(flatten(map), flatten(new_map));
    });

    it("should preserve parent of target map", () => {
      const target = {
        ".hello": 31,
        ".hello.fah": "a",
        ".hello.foo.bar": null,
        ".hello.foo.baz": undefined
      };
      let new_map = new LayerMap(),
        new_submap = new_map._get_descendent_map(["hello"], true);
      map._copy_to(new_submap);
      assert.equal(new_submap._parent, new_map);
      assert.deepEqual(target, flatten(new_map));
    });
  });

  describe("_copy", () => {
    it("should return a copy of the map", () => {
      let copy = map.copy();
      assert.notEqual(map, copy);
      assert.deepEqual(flatten(map), flatten(copy));
    });

    it("should return a copy of the entries with specified prefix", () => {
      const prefix = ["foo"],
        target = {
          ".foo.bar": null,
          ".foo.baz": undefined
        };
      let copy = map.copy(prefix);
      assert.deepEqual(target, flatten(copy));
    });
  });

  describe("size", () => {
    it("should return the size of the map", () => {
      assert.equal(map.size(), map_size);
    });

    it("should return the size of a submap", () => {
      assert.equal(submap.size(), submap_size);
    });
  });

  describe("_set_value", () => {
    it("should set an existing value of a map", () => {
      const prefix = ["foo", "bar"],
        value = "new_value";
      let submap = map._get_descendent_map(prefix, true);
      assert.isTrue(submap._has_value());
      assert.notEqual(submap._get_value(), value);
      assert.equal(map.size(), map_size);
      submap._set_value(value);
      assert.equal(submap._get_value(), value);
      assert.equal(map.size(), map_size);
    });

    it("should set a new value of a map and increment sizes", () => {
      const prefix = ["foo", "bar", "new_key"],
        value = "new_value";
      let submap = map._get_descendent_map(prefix, true);
      assert.isFalse(submap._has_value());
      assert.equal(map.size(), map_size);
      submap._set_value(value);
      assert.isTrue(submap._has_value());
      assert.equal(submap._get_value(), value);
      assert.equal(map.size(), map_size + 1);
    });
  });

  describe("_delete_value", () => {
    it("should delete an existing value of a map and decrement sizes", () => {
      const prefix = ["foo", "bar"];
      let submap = map._get_descendent_map(prefix, true);
      assert.isTrue(submap._has_value());
      assert.equal(map.size(), map_size);
      submap._delete_value();
      assert.isFalse(submap._has_value());
      assert.equal(map.size(), map_size - 1);
    });

    it("should do nothing to a map without a value", () => {
      const prefix = ["foo", "bar", "new_key"];
      let submap = map._get_descendent_map(prefix, true);
      assert.isFalse(submap._has_value());
      assert.equal(map.size(), map_size);
      submap._delete_value();
      assert.isFalse(submap._has_value());
      assert.equal(map.size(), map_size);
    });
  });

  describe("has", () => {
    it("should detect a value set for the empty key sequence", () => {
      assert.isTrue(map.has([]));
    });

    it("should detect a value set to undefined", () => {
      key_seqs.value_undefined.forEach(seq => {
        assert.isTrue(map.has(seq));
      });
    });

    it("should detect values with an exact key sequence", () => {
      data.forEach(d => {
        assert.isTrue(map.has(d[0]));
      });
    });

    it("should not detect values with only a prefix key sequence", () => {
      key_seqs.nontrivial_prefix.forEach(seq => {
        assert.isFalse(map.has(seq));
      });
    });

    it("should not detect values with a suffix key sequence", () => {
      key_seqs.nontrivial_suffix.forEach(seq => {
        assert.isFalse(map.has(seq));
      });
    });

    it("should not detect values with an unrelated key sequence", () => {
      key_seqs.not_comparable.forEach(seq => {
        assert.isFalse(map.has(seq));
      });
    });
  });

  describe("set", () => {
    it("should set a new value and increment size", () => {
      let expected_size = map_size;
      key_seqs.not_comparable.forEach(seq => {
        assert.isFalse(map.has(seq));
        map.set(seq, true);
        assert.isTrue(map.has(seq));
        expected_size += 1;
        assert.equal(map.size(), expected_size);
      });
    });

    it("should overwrite an existing value and fix size", () => {
      key_seqs.set_keys.forEach(seq => {
        map.set(seq, 913);
        assert.equal(map.get(seq), 913);
        assert.equal(map.size(), map_size);
      });
    });
  });

  describe("get", () => {
    it("should get a value for an exact key sequence", () => {
      data.forEach(d => {
        assert.equal(map.get(d[0]), d[1]);
      });
    });

    it("should return undefined for not set key sequences", () => {
      key_seqs.not_comparable.forEach(seq => {
        assert.isUndefined(map.get(seq));
      });
    });
  });

  describe("delete", () => {
    it("should delete an element", () => {
      for (const [key, value] of data) {
        assert.isTrue(map.has(key));
        map.delete(key);
        assert.isFalse(map.has(key));
      }
    });

    it("should reduce the size of the map", () => {
      let target_size = map_size;
      assert.equal(map.size(), map_size);
      for (const [key, value] of data) {
        map.delete(key);
        target_size -= 1;
        assert.equal(map.size(), target_size);
      }
    });
  });

  describe("clear", () => {
    it("should clear the map", () => {
      assert.equal(map.size(), map_size);
      map.clear();
      assert.equal(map.size(), 0);
    });

    it("should clear a submap and update sizes accordingly", () => {
      assert.equal(submap.size(), submap_size);
      submap.clear();
      assert.equal(submap.size(), 0);
      assert.equal(map.size(), map_size - submap_size);
    });
  });

  describe("has_prefix", () => {
    it("should return true for a proper prefix", () => {
      key_seqs.nontrivial_prefix.forEach(seq => {
        assert.isTrue(map.has_prefix(seq));
      });
    });

    it("should return true for an exact key match", () => {
      key_seqs.set_keys.forEach(seq => {
        assert.isTrue(map.has_prefix(seq));
      });
    });

    it("should return false for a suffix", () => {
      key_seqs.nontrivial_suffix.forEach(seq => {
        assert.isFalse(map.has_prefix(seq));
      });
    });

    it("should return false for unrelated key sequences", () => {
      key_seqs.not_comparable.forEach(seq => {
        assert.isFalse(map.has_prefix(seq));
      });
    });
  });

  describe("set_prefix", () => {
    const replace_prefix = ["foo"];

    it("should set the root of the map to the value of another map", () => {
      const other_map_data = [[["test", 1], 999], [["test", 2], 1000]],
        target = {
          "": 31,
          ".fah": "a",
          ".foo.test.1": 999,
          ".foo.test.2": 1000
        };
      let other_map = new LayerMap();
      for (const [key, value] of other_map_data) {
        other_map.set(key, value);
      }
      map.set_prefix(replace_prefix, other_map);
      assert.deepEqual(flatten(map), target);
    });

    it("should delete a prefix if the specified map is empty", () => {
      const target = {
        "": 31,
        ".fah": "a"
      };
      map.set_prefix(replace_prefix, new LayerMap());
      assert.deepEqual(flatten(map), target);
    });
  });

  describe("get_prefix", () => {
    it("should return an unprefixed copy of the specified entries", () => {
      const prefix = ["foo"],
        target = {
          ".bar": null,
          ".baz": undefined
        };
      let prefix_map = map.get_prefix(prefix);
      assert.deepEqual(flatten(prefix_map), target);
    });
  });

  describe("delete_prefix", () => {
    const delete_prefix = ["foo"],
      target = {
        "": 31,
        ".fah": "a"
      },
      num_nodes = 2;

    beforeEach(() => {
      map.delete_prefix(delete_prefix);
    });

    it("should delete a prefix", () => {
      assert.deepEqual(flatten(map), target);
    });

    it("should delete trailing nodes", () => {
      let node_set = new Set(map._nodes());
      assert.equal(node_set.size, num_nodes);
    });
  });

  describe("_nodes", () => {
    it("should visit all nodes", () => {
      let nodes_set = new Set(key_seqs.nodes),
        computed_set = new Set();
      for (const node of map._nodes()) {
        computed_set.add(node._get_key_sequence());
      }
      assert.deepEqual(nodes_set, computed_set);
    });
  });

  describe("_get_key_sequence", () => {
    it("should construct the key sequence associated to a submap", () => {
      key_seqs.set_keys.forEach(seq => {
        let submap = map._get_descendent_map(seq),
          constructed_key_sequence = submap._get_key_sequence();
        assert.deepEqual(constructed_key_sequence, seq);
      });
    });
  });

  describe("entries", () => {
    it("should generate each entry of the map", () => {
      let record = {};
      for (const [value, key] of map.entries()) {
        record[stringify_key(key)] = value;
      }
      assert.deepEqual(record, flat_copy);
    });

    it("should generate the entries with a given prefix", () => {
      let record = {};
      for (const [value, key] of map.entries(submap_prefix)) {
        record[stringify_key(key)] = value;
      }
      assert.deepEqual(record, submap_flat_copy);
    });
  });

  describe("iterator", () => {
    it("should generate each entry of the map", () => {
      let record = {};
      for (const [value, key] of map) {
        record[stringify_key(key)] = value;
      }
      assert.deepEqual(record, flat_copy);
    });
  });

  describe("forEach", () => {
    it("should visit each entry of the map", () => {
      let record = {};
      map.forEach((value, key) => {
        record[stringify_key(key)] = value;
      });
      assert.deepEqual(record, flat_copy);
    });

    it("should visit the entries with a given prefix", () => {
      let record = {};
      map.forEach((value, key) => {
        record[stringify_key(key)] = value;
      }, submap_prefix);
      assert.deepEqual(record, submap_flat_copy);
    });

    it("should pass the calling map as the third argument", () => {
      map.forEach((value, key, map_param) => {
        assert.equal(map_param, map);
      });
    });

    it("should allow setting the scope for non-arrow functions", () => {
      let scope = {};
      function fn() {
        assert.equal(this, scope);
      }
      map.forEach(fn, null, scope);
    });
  });

  describe("keys", () => {
    it("should generate all the keys", () => {
      let record = {};
      for (const key of map.keys()) {
        record[stringify_key(key)] = true;
      }
      assert.hasAllKeys(record, flat_copy);
    });

    it("should generate all the keys with a given prefix", () => {
      let record = {};
      for (const key of map.keys(submap_prefix)) {
        record[stringify_key(key)] = true;
      }
      assert.hasAllKeys(record, submap_flat_copy);
    });
  });

  describe("values", () => {
    it("should generate all the values", () => {
      let record = new Set();
      for (const value of map.values()) {
        record.add(value);
      }
      assert.deepEqual(record, new Set(Object.values(flat_copy)));
    });

    it("should generate all the values with a given key prefix", () => {
      let record = new Set();
      for (const value of map.values(submap_prefix)) {
        record.add(value);
      }
      assert.deepEqual(record, new Set(Object.values(submap_flat_copy)));
    });
  });
});
