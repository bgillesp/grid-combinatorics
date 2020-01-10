const Two = require("two.js");

/**
 * Set the transform of a Two.js object to view a specified coordinate range.
 * Sets scaling so the entire specified range, plus a proportional border, is
 * visible with a 1:1 aspect ratio.
 * @param {Two} two             - Two.js renderer instance
 * @param {Number} x_min        - Viewport minimum x-coordinate.
 * @param {Number} x_max        - Viewport maximum x-coordinate.
 * @param {Number} y_min        - Viewport minimum y-coordinate.
 * @param {Number} y_max        - Viewport maximum y-coordinate.
 * @param {Number} [border=0.1] - Extra border size, specified as a proportion
 *                                of the smaller of the x- and y-dimensions
 */
function set_viewport(two, x_min, x_max, y_min, y_max, border = 0.1) {
  // calculate the transform to view specified coordinate range
  // rescales to maintain 1:1 aspect ratio and include all of
  //   requested domain; border added on each side, specified
  //   as a proportion of the smaller dimension of the stage
  var w = two.width;
  var h = two.height;
  var border_px = Math.min(w, h) * border;
  var scale = Math.min(
    (w - 2 * border_px) / (x_max - x_min),
    (h - 2 * border_px) / (y_max - y_min)
  );
  var origin_x = scale * x_min - border_px;
  var origin_y = scale * y_min - border_px;
  var translation = new Two.Vector(-origin_x, -origin_y);
  two.scene.scale = scale;
  two.scene.translation = translation;
  return {
    scale: scale,
    translation: translation
  };
}

module.exports = { set_viewport: set_viewport };
