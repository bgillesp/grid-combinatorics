const _ = require("underscore");
const Tween = require("@tweenjs/tween.js");

/**
 * SimpleAnimationManager is a class to handle the sequencing of animations on
 * grid boxes and other components in a simple fashion.  Animations are executed
 * in series in the order they are added to the manager.  This class is not
 * well-optimized, but for small quantities of animations this should not be an
 * issue for application performance.
 */
class SimpleAnimationManager {
  constructor() {
    this._queue = new Array();
    this._running = true;
    this._current = null;
    this._tween_group = new Tween.Group();
  }

  get_tween_group() {
    return this._tween_group;
  }

  /**
   * Stop any running tween and clear the queue.
   */
  clear() {
    if (this._current) {
      this._current.stop();
      this._current = null;
    }
    this._queue.length = 0;
  }

  pause() {
    this._running = false;
    if (this._current) {
      this._current.pause();
    }
  }

  resume() {
    this._running = true;
    let current = this._current;
    if (current.isPlaying()) {
      if (current.isPaused()) current.resume();
    } else {
      current.start();
    }
  }

  add(tween) {
    tween.group(this._tween_group);
    tween.onComplete(() => {
      this._tween_finished_callback();
    });
    this._queue.push(tween);
    this._step();
  }

  _tween_finished_callback() {
    this._current = null;
    this._step();
  }

  _step() {
    // if no current tween, set the next one
    if (this._current == null && this._queue.length > 0) {
      this._current = this._queue[0];
      this._queue.shift();
      if (this._running) {
        this._current.start();
      }
    }
  }
}

module.exports = SimpleAnimationManager;
