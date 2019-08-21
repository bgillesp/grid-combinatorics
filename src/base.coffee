Pixi = require('pixi.js')
_ = require('underscore')
$ = require('jquery')
jQuery = $
Backbone = require('backbone')
BbLoc = require('backbone.localstorage')

app_size = { width: 960, height: 540 }
# import {Collection, Model} from 'backbone'
# import {LocalStorage} from 'backbone.localstorage'

T = {}
T.bb = {}
T.bb.models = {}
T.bb.collections = {}
T.classes = {}

class Box
  constructor: (@x, @y) ->
    # TODO check input coordinates are integers
    # rendering details
    @render = {
      rx: @x,           # render x-coordinate (rel to origin)
      ry: @y,           # render y-coordinate (rel to origin)
      bg_col: "white", # background color
      fg_col: "black"  # label and border color
    }

  getStage: () ->
    @stage

  setStage: (@stage) ->
    # input Pixi.Graphics primitive

T.classes.Box = Box

class Grid
  constructor: (boxes) ->
    # copy input Array of boxes
    @boxes = boxes.slice()

T.classes.Grid = Grid

boxes = [new Box(0, 0), new Box(0, 1), new Box(1, 0)]
grid = new Grid(boxes)

# T.bb.models.Box = Backbone.Model.extend({
#   defaults: {
#     loc:   null,
#     label: null,
#     color: null
#   }
# })
#
# T.collections.Grid = Backbone.Collection.extend({
#   model: T.Box,
#   localStorage: new BbLoc.LocalStorage('backbone-tableaux')
# })

T.bb.models.Operation = Backbone.Model.extend({
  defaults: {
    exec: null,
    undo: null
  }
})

# # testing model
# T.counter_local_storage = new BbLoc.LocalStorage('test-counter')
# T.models.Counter = Backbone.Model.extend({
#   defaults: {
#     count: 0
#   },
#   localStorage: T.counter_local_storage
# })
#
# T.collections.CounterCollection = Backbone.Collection.extend({
#   model: T.Counter,
#   localStorage: T.counter_local_storage
# })
#
# c = new T.models.Counter({'id': 'myCounter'})
# c.fetch()
# count = c.get('count')
# c.set('count', ++count)
# c.save()
# console.log(`count: ${count}`)
# console.log('c:')
# console.log(c)
# console.log(T.counter_local_storage)

R = {} # variables related to rendering
R.app = new Pixi.Application({
    width: app_size.width,
    height: app_size.height,
    antialias: true,
    transparent: false,
    resolution: 1
  }
)
R.stage = R.app.stage
R.app.renderer.backgroundColor = 0xf7f7f7
# R.stage.scale = 100
$( '#grid-display' ).append(R.app.view)
T.render = R

set_viewport = (x_min, x_max, y_min, y_max, border=.1) ->
  # set Pixi transform to view specified coordinate range
  # rescales to maintain 1:1 aspect ratio and include all of
  #   requested domain; border added on each side, specified
  #   as a proportion of the smaller dimension of the stage
  w = R.app.renderer.screen.width
  h = R.app.renderer.screen.height
  border_px = Math.min(w, h) * border
  w_grid = w - 2*border_px
  h_grid = h - 2*border_px
  dx = x_max - x_min
  dy = y_max - y_min
  if w_grid/dx < h_grid/dy
    # scale = w/(dx * (1 + 2*border))
    # origin_x = scale*(x_min - border*dx)
    # origin_y = scale*(y_min - border*dx)
    scale = w_grid/dx
    origin_x = scale*x_min - border_px
    origin_y = scale*y_min - border_px
  else
    scale = h_grid/dy
    origin_x = scale*x_min - border_px
    origin_y = scale*y_min - border_px
  R.stage.setTransform(-origin_x, -origin_y, scale, scale)


makeBlock = (x, y, gap=.05) ->
  # Make a scaled rectangle
  rect = new Pixi.Graphics()
  rect.lineStyle(0.05, 0x111111, 1)
  rect.beginFill(0xFFFFFF)
  rect.drawRoundedRect(x+gap, y+gap, 1-2*gap, 1-2*gap, .1)
  rect.endFill()
  R.stage.addChild(rect)

# R.stage.setTransform(60, 60, 120, 120)
# R.stage.scale = new Pixi.Point(120, 120)
# R.stage.position = new Pixi.Point(60, 60)

makeBlock(0, 0)
makeBlock(1, 0)
makeBlock(0, 1)
makeBlock(1, 1)
makeBlock(2, 0)
makeBlock(3, 0)
makeBlock(4, 0)
makeBlock(0, 2)
makeBlock(0, 3)
makeBlock(0, 4)
set_viewport(0, 4, 0, 5)
console.log(R.app.renderer.screen)

setup = () ->
  R.app.ticker.add(delta => gridRender(delta))


gridRender = (delta) -> null


module.exports = T
