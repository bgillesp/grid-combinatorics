const Two = require("two.js");

function basicBox() {
  // box positioned at (0, 0)
  // centered at (0.5, 0.5)
  // copy and translate to make other boxes
  let params = {
    strokeWidth: 0.075,
    gap: 0.04,
    cornerRadius: 0.15,
    stroke: "#777",
    fillGradientTilt: 0.2,
    fillGradientStops: [
      new Two.Stop(0.0, "#c9c6c6"),
      new Two.Stop(0.26, "#c9c6c6"),
      new Two.Stop(1.0, "#f1f2f6")
    ]
  };
  params.sideLength = 1 - (2 * params.gap + params.strokeWidth);
  params.fill = new Two.LinearGradient(
    params.sideLength * -0.5,
    params.sideLength * params.fillGradientTilt,
    params.sideLength * 0.5,
    params.sideLength * -params.fillGradientTilt,
    params.fillGradientStops
  );
  // construct box
  let box = new Two.RoundedRectangle(
    0.5,
    0.5,
    params.sideLength,
    params.sideLength,
    params.cornerRadius
  );
  box.linewidth = params.strokeWidth;
  box.stroke = params.stroke;
  box.fill = params.fill;
  return box;
}

class Box {
  constructor(x, y, label = "") {
    // TODO check input coordinates are integers
    label = String(label);
    this.x = x;
    this.y = y;
    this.label = label;
    // rendering details
    // TODO add tweening object for current animations
    this.render = {
      loc: new Two.Vector(x, y),
      box: Box.make_box(),
      label: Box.make_label(label)
    };
    let grp = new Two.Group();
    grp.add(this.render.box, this.render.label);
    grp.translation = this.render.loc;
    this.render.main = grp;
  }

  set_label(label) {
    label = String(label);
    this.label = label;
    let old_label = this.render.label,
      new_label = Box.make_label(label);
    this.render.main.remove(old_label);
    this.render.main.add(new_label);
    this.render.label = new_label;
  }

  static make_box() {
    // location set by separate group translation
    let box = basicBox();
    box.translation = new Two.Vector(0.5, 0.5);
    return box;
  }

  static make_label(label) {
    // location set by separate group translation
    var text = new Two.Text(label, 0.5, 0.435, {
      family: "proxima-nova, sans-serif",
      size: 0.52,
      fill: "#444"
    });
    return text;
  }

  // TODO: operation to set label
}

module.exports = Box;
