const Pixi = require('pixi.js');
const _ = require('underscore');
const $ = require('jquery');
const jQuery = $;
const Backbone = require('backbone');
const BbLoc = require('backbone.localstorage');

// import {Collection, Model} from 'backbone';
// import {LocalStorage} from 'backbone.localstorage';

var app = {};

app.Box = Backbone.Model.extend({
  defaults: {
    loc:   null,
    label: null,
    color: null
  }
});

app.Grid = Backbone.Collection.extend({
  model: app.Box,
  localStorage: new BbLoc.LocalStorage("backbone-tableaux")
});

app.Operation = Backbone.Model.extend({
  defaults: {
    exec: null,
    undo: null
  }
});

app.gridDisplay = new Pixi.Application({width: 256, height: 512});
$( '#grid-display' ).append(app.gridDisplay.view);
// Pixi.utils.sayHello("canvas")
app.gridDisplay.renderer.backgroundColor = 0x061639;

module.exports = app;
