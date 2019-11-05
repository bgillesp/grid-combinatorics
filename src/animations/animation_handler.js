/**
 * AnimationManager is a class to handle the sequencing of animations on grid
 * boxes and other components
 */
class AnimationManager {
  /**
   * Construct an AnimationManager object.
   */
  constructor() {
    this.this.execute = false;
  }

  start() {
    this.execute = true;
    this.dispatch();
  }

  dispatch() {}
}
