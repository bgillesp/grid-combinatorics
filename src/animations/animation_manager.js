const FlexTimer = require("./flex_timer.js").FlexTimer;
const RateFunction = require("./flex_timer.js").RateFunction;

/**
 * AnimationManager is a class to handle the sequencing of animations on grid
 * boxes and other components
 */
class AnimationManager {
  /**
   * Construct an AnimationManager object.
   */
  constructor() {
    this.timer = new FlexTimer(0, 1000 / 60);
    this.execute = false;
  }

  start() {
    this.execute = true;
    this.dispatch();
  }

  dispatch() {}
}
