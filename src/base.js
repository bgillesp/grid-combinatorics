const Pixi = require("pixi.js");
const _ = require("underscore");
const $ = require("jquery");
const jQuery = $;
const Backbone = require("backbone");
const BbLoc = require("backbone.localstorage");

var app_size = { width: 960, height: 540 };
// import {Collection, Model} from 'backbone'
// import {LocalStorage} from 'backbone.localstorage'

var T = {};
T.bb = {};
T.bb.models = {};
T.bb.collections = {};
T.classes = {};

class Box {
  constructor(x, y) {
    // TODO check input coordinates are integers
    this.x = x;
    this.y = y;
    // rendering details
    this.render = {
      rx: this.x, // render x-coordinate (rel to origin)
      ry: this.y, // render y-coordinate (rel to origin)
      bg_col: "white", // background color
      fg_col: "black" // label and border color
    };
  }

  get stage() {
    return this.stage;
  }

  set stage(stage) {
    // input Pixi.Graphics primitive
    this.stage = stage;
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

var boxes = [new Box(0, 0), new Box(0, 1), new Box(1, 0)];
var grid = new Grid(boxes);

// T.bb.models.Box = Backbone.Model.extend({
//   defaults: {
//     loc:   null,
//     label: null,
//     color: null
//   }
// })
//
// T.collections.Grid = Backbone.Collection.extend({
//   model: T.Box,
//   localStorage: new BbLoc.LocalStorage('backbone-tableaux')
// })

T.bb.models.Operation = Backbone.Model.extend({
  defaults: {
    exec: null,
    undo: null
  }
});

// // testing model
// T.counter_local_storage = new BbLoc.LocalStorage('test-counter')
// T.models.Counter = Backbone.Model.extend({
//   defaults: {
//     count: 0
//   },
//   localStorage: T.counter_local_storage
// })
//
// T.collections.CounterCollection = Backbone.Collection.extend({
//   model: T.Counter,
//   localStorage: T.counter_local_storage
// })
//
// c = new T.models.Counter({'id': 'myCounter'})
// c.fetch()
// count = c.get('count')
// c.set('count', ++count)
// c.save()
// console.log(`count: ${count}`)
// console.log('c:')
// console.log(c)
// console.log(T.counter_local_storage)

var R = {}; // variables related to rendering
R.app = new Pixi.Application({
  width: app_size.width,
  height: app_size.height,
  antialias: true,
  transparent: false,
  resolution: 1
});
R.stage = R.app.stage;
R.app.renderer.backgroundColor = 0xf7f7f7;
// R.stage.scale = 100
$("#grid-display").append(R.app.view);
T.render = R;

function set_viewport(x_min, x_max, y_min, y_max, border = 0.1) {
  // set Pixi transform to view specified coordinate range
  // rescales to maintain 1:1 aspect ratio and include all of
  //   requested domain; border added on each side, specified
  //   as a proportion of the smaller dimension of the stage
  var w = R.app.renderer.screen.width;
  var h = R.app.renderer.screen.height;
  var border_px = Math.min(w, h) * border;
  var w_grid = w - 2 * border_px;
  var h_grid = h - 2 * border_px;
  var dx = x_max - x_min;
  var dy = y_max - y_min;
  if (w_grid / dx < h_grid / dy) {
    // scale = w/(dx * (1 + 2*border))
    // origin_x = scale*(x_min - border*dx)
    // origin_y = scale*(y_min - border*dx)
    var scale = w_grid / dx;
    var origin_x = scale * x_min - border_px;
    var origin_y = scale * y_min - border_px;
  } else {
    var scale = h_grid / dy;
    var origin_x = scale * x_min - border_px;
    var origin_y = scale * y_min - border_px;
  }
  R.stage.setTransform(-origin_x, -origin_y, scale, scale);
}

function makeBlock(x, y, gap = 0.05) {
  // Make a scaled rectangle
  let rect = new Pixi.Graphics();
  rect.lineStyle(0.05, 0x111111, 1);
  rect.beginFill(0xffffff);
  rect.drawRoundedRect(x + gap, y + gap, 1 - 2 * gap, 1 - 2 * gap, 0.1);
  rect.endFill();
  R.stage.addChild(rect);
}

// R.stage.setTransform(60, 60, 120, 120);
// R.stage.scale = new Pixi.Point(120, 120);
// R.stage.position = new Pixi.Point(60, 60);

makeBlock(0, 0);
makeBlock(1, 0);
makeBlock(0, 1);
makeBlock(1, 1);
makeBlock(2, 0);
makeBlock(3, 0);
makeBlock(4, 0);
makeBlock(0, 2);
makeBlock(0, 3);
makeBlock(0, 4);
set_viewport(0, 4, 0, 5);
console.log(R.app.renderer.screen);

function setup() {
  R.app.ticker.add(delta => gridRender(delta));
}

function gridRender(delta) {
  return null;
}

module.exports = T;
