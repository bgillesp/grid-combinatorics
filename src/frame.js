const Two = require("two.js");

function basicFrame() {
  // frame positioned at (0, 0)
  // centered at (0.5, 0.5)
  // copy and translate to make other frames
  let params = {
    strokeWidth: 0.05,
    gap: 0.02,
    cornerRadius: 0.15,
    stroke: "#ff0f",
    fill: "#ff03"
  };
  params.sideLength = 1 - (2 * params.gap + params.strokeWidth);
  // construct frame
  let frame = new Two.RoundedRectangle(
    0.5,
    0.5,
    params.sideLength,
    params.sideLength,
    params.cornerRadius
  );
  frame.linewidth = params.strokeWidth;
  frame.stroke = params.stroke;
  frame.fill = params.fill;
  return frame;
}

class Frame {
  constructor(x, y) {
    // TODO check input coordinates are integers
    this.x = x;
    this.y = y;
    // rendering details
    this.render = {
      loc: new Two.Vector(x, y),
      frame: Frame.makeFrame()
    };
    let grp = new Two.Group();
    grp.add(this.render.frame);
    grp.translation = this.render.loc;
    this.render.main = grp;
  }

  static makeFrame() {
    // location set by separate group translation
    let frame = basicFrame();
    frame.translation = new Two.Vector(0.5, 0.5);
    return frame;
  }
}

module.exports = Frame;
