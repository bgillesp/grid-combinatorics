const LayerMap = require("./layer_map.js");

let Util = {
  /**
   * Shallow equality check for Array objects
   * @param  {Array} a1 - An Array.
   * @param  {Array} a2 - An Array.
   * @return {Boolean}  - Whether the Arrays satisfy shallow equality.
   */
  array_equal: function(a1, a2) {
    if (a1.length != a2.length) return false;
    for (let i = 0; i < a1.length; i++) if (a1[i] != a2[i]) return false;
    return true;
  },

  /**
   * Shallow equality check for ES6 Set objects
   * @param  {Set} s1  - A set.
   * @param  {Set} s2  - A set.
   * @return {Boolean} - Whether the Sets satisfy shallow equality.
   */
  set_equal: function(s1, s2) {
    if (s1.size != s2.size) return false;
    for (let a of s1) if (!s1.has(a)) return false;
    return true;
  },

  layer_map: {
    stringify_key: function(keys) {
      return keys.reduce((aggr, str) => {
        return aggr + "." + str;
      }, "");
    },

    flatten: function(gen) {
      let record = new Object();
      const stringify_key = Util.layer_map.stringify_key;
      for (const val of gen) {
        let key, value;
        if (val instanceof LayerMap) {
          [key, value] = [val._get_key_sequence(), val._get_value()];
        } else {
          [key, value] = val;
        }
        record[stringify_key(key)] = value;
      }
      return record;
    }
  }
};

module.exports = Util;
