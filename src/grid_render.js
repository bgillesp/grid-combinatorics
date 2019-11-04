const Two = require("two.js");
const Vector = Two.Vector;
const GridArray = require("./data_structures/grid_array.js");
const Box = require("./box.js").Box;
const App = require("./app/app.js");
const GridData = require("./grid.js").GridData;

class GridRender {
  constructor(domParent) {
    this.parent = domParent;
    this.two = new Two({
      width: App.config.grid_size.width,
      height: App.config.grid_size.height,
      autostart: true
    });
    this.two.appendTo(domParent);
    // copy input Array of boxes
    this.boxes = [];
    this.data = new GridData();
  }

  add(x, y, label) {
    let box = new Box(x, y, label);
    this.boxes.push(box);
    // console.log(box.render.main._renderer.elem);
    this.two.add(box.render.main);
    // Update the renderer in order to generate the actual elements.
    this.two.update();
    console.log(box.render.main._renderer.elem);
    // console.log(box.render.main._renderer);
  }

  // _click_log(

  get(i) {
    return this.boxes[i];
  }

  move(x_start, y_start, x_end, y_end) {}

  remove(x, y) {}
}
