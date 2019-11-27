const assert = require("chai").assert;

const _ = require("underscore");
const LayerMap = require("./layer_map.js");

describe("LayerMap", () => {
  var map;

  describe("Initialization", () => {
    describe("constructor", () => {
      it("should produce an instance of LayerMap", () => {
        map = new LayerMap();
        assert.isTrue(map instanceof LayerMap);
      });
    });
  });

  describe("Operations", () => {
    const data = [
        [[], 31],
        [["fah"], "a"],
        [["foo", "bar"], null],
        [["foo", "baz"], undefined]
      ],
      key_seqs = {
        set_keys: [[], ["fah"], ["foo", "bar"], ["foo", "baz"]],
        nontrivial_prefix: [["foo"]],
        nontrivial_suffix: [["foo", "bar", "bah"], ["fah", "bah"]],
        not_comparable: [["bah"], ["foo", "bah"], ["foo", "bah", "dah"]],
        value_undefined: [["foo", "baz"]]
      },
      map_size = 4;

    beforeEach(() => {
      map = new LayerMap();
      data.forEach(d => {
        map.set(d[0], d[1]);
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
  });
});
