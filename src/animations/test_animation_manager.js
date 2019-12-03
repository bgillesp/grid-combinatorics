const assert = require("chai").assert;

const AnimationManager = require("./animation_manager.js");
const Animation = require("./animation.js");

let am = new AnimationManager();
let animation = new Animation();

am.schedule(animation);
