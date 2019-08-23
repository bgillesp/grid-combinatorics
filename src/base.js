const _ = require("underscore");
const $ = require("jquery");
const jQuery = $;
const Backbone = require("backbone");
const BbLoc = require("backbone.localstorage");
const Two = require("two.js");
const Tween = require("@tweenjs/tween.js");

const Vector = Two.Vector;

var T = {};
T.bb = {};
T.bb.models = {};
T.bb.collections = {};
T.classes = {};
T.config = {};

T.config.grid_size = { width: 960, height: 540 };
T.config.block = null; // defined later

var R = {}; // variables related to rendering

var two = new Two({
  width: T.config.grid_size.width,
  height: T.config.grid_size.height,
  autostart: true
});
two.appendTo($("#grid-display")[0]);
R.two = two;

// var r1 = new Two.RoundedRectangle(1, 1, 1, 1, 0.2);
// r1.linewidth = 4 / 60;
// two.add(r1);
// var r2 = two.makeRectangle(0, 1, 1, 1);
// var r3 = two.makeRectangle(2, 2, 2, 5);
// var text = new Two.Text("1", 2, 2, { size: 0.5 });

function basicBlock() {
  // block positioned at (0, 0)
  // copy and translate to make other blocks
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
  // construct block
  let block = new Two.RoundedRectangle(
    0.5,
    0.5,
    params.sideLength,
    params.sideLength,
    params.cornerRadius
  );
  block.linewidth = params.strokeWidth;
  block.stroke = params.stroke;
  block.fill = params.fill;
  return block;
}
T.config.block = basicBlock();

function makeBlock(v) {
  let block = T.config.block.clone();
  block.translation = new Vector(v.x + 0.5, v.y + 0.5);
  // two.add(block);
  return block;
}

function makeLabel(v, label) {
  var text = new Two.Text(label, v.x + 0.5, v.y + 0.435, {
    family: "proxima-nova, sans-serif",
    size: 0.52,
    fill: "#444"
  });
  // two.add(text);
  return text;
}

function set_viewport(x_min, x_max, y_min, y_max, border = 0.1) {
  // set transform to view specified coordinate range
  // rescales to maintain 1:1 aspect ratio and include all of
  //   requested domain; border added on each side, specified
  //   as a proportion of the smaller dimension of the stage
  var w = R.two.width;
  var h = R.two.height;
  var border_px = Math.min(w, h) * border;
  // var w_grid = w - 2 * border_px;
  // var h_grid = h - 2 * border_px;
  var scale = Math.min(
    (w - 2 * border_px) / (x_max - x_min),
    (h - 2 * border_px) / (y_max - y_min)
  );
  var origin_x = scale * x_min - border_px;
  var origin_y = scale * y_min - border_px;
  two.scene.scale = scale;
  two.scene.translation = new Vector(-origin_x, -origin_y);
}

class Box {
  constructor(v, label = "") {
    // TODO check input coordinates are integers
    this.x = v.x;
    this.y = v.y;
    this.label = label;
    // rendering details
    this.render = {
      loc: v.clone(),
      block: makeBlock(v),
      label: makeLabel(v, label)
    };
    this.render.group = new Two.Group();
    this.render.group.add(this.render.block, this.render.label);
    two.add(this.render.group);
  }
}
T.classes.Box = Box;

class Grid {
  constructor(boxes) {
    // copy input Array of boxes
    this.boxes = boxes.slice();
  }
}
T.classes.Grid = Grid;

let coords = [
  new Vector(0, 0),
  new Vector(1, 0),
  new Vector(0, 1),
  new Vector(1, 1),
  new Vector(2, 0),
  new Vector(3, 0),
  new Vector(4, 0),
  new Vector(0, 2),
  new Vector(0, 3)
];
let labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
let blocks = [];
for (let i = 0; i < coords.length; i++) {
  blocks.push(new Box(coords[i], labels[i]));
}

set_viewport(0, 4, 0, 5);

// function animate(time) {
//   requestAnimationFrame(animate);
//   Tween.update(time);
// }
// requestAnimationFrame(animate);

let anim1 = new Tween.Tween(blocks[3].render.group.translation)
  .to({ x: 1, y: 0 }, 1000)
  .easing(Tween.Easing.Quadratic.Out);

let anim2 = new Tween.Tween(blocks[3].render.group.translation)
  .to({ x: 0, y: 0 }, 1000)
  .easing(Tween.Easing.Quadratic.Out);

anim1.chain(anim2);
anim2.chain(anim1);
anim1.start();

two.bind("update", function(frameCount) {
  // This code is called everytime two.update() is called.
  // Effectively 60 times per second.
  Tween.update();
});
two.play(); // Finally, start the animation loop

module.exports = T;
