/**
 * Class FlexTimer keeps track of a local time l corresponding to a collection
 * of rate functions.  Acts as a simple initial value problem solver for l' =
 * r(t), where r(t) is a rate function given by the product of specified rate
 * functions with an ambient rate.
 *
 * The class progresses forward in time only: each rate function has an end time
 * after which its value does not change.  After reaching this end time, the
 * rate function is removed from the data structure, and its end value is
 * multiplied into an ambient rate parameter representing the rate contributions
 * of all finished rate functions from the past.  A peek function is provided to
 * allow checking of l without otherwise updating the data structure.
 */
class FlexTimer {
  /**
   * Construct a FlexTimer object starting at a specified global and local time,
   * and using given step size for the IVP solver.
   * @param {Number} [current_time=0] - The starting time.
   * @param {Number} [step_size=1]    - The step size for the IVP solver.
   */
  constructor(current_time = 0, step_size = 1) {
    this._global_time = current_time;
    this._local_time = current_time;
    this._ambient_rate = 1;
    this._rate_fns = [];
    this._rate_fns_buffer = [];
    this._step_size = step_size;
  }

  /**
   * Set the current global time.  For internal use only.
   * @param {Number} global_time - The new global time.
   */
  _set_global_time(global_time) {
    this._global_time = global_time;
  }

  /**
   * Get the current global time.
   * @return {Number} - The global time.
   */
  get_global_time() {
    return this._global_time;
  }

  /**
   * Set the current local time.  For internal use only.
   * @param {Number} local_time - The new local time.
   */
  _set_local_time(local_time) {
    this._local_time = local_time;
  }

  /**
   * Get the current local time.
   * @return {Number} - The local time.
   */
  get_local_time() {
    return this._local_time;
  }

  /**
   * Add a rate function to the current list.  If the end time is earlier than
   * the current global time, then instead multiply the end_value into the
   * ambient rate.
   * @param {RateFunction} rate_function - [description]
   */
  add_rate_function(rate_function) {
    if (rate_function.get_end() <= this._global_time) {
      this._set_ambient_rate(
        this.get_ambient_rate() * rate_function.get_end_value()
      );
    } else {
      this._rate_fns.push(rate_function);
    }
  }

  /**
   * Return the Array of currently active rate functions.
   * @return {Array} - The currently active rate functions.
   */
  get_rate_functions() {
    return Array.from(this._rate_fns);
  }

  /**
   * Set the ambient rate.  For internal use only.
   * @param {Number} rate - The new ambient rate.
   */
  _set_ambient_rate(rate) {
    this._ambient_rate = rate;
  }

  /**
   * Get the current ambient rate.
   * @return {Number} - The ambient rate.
   */
  get_ambient_rate() {
    return this._ambient_rate;
  }

  /**
   * The current rate of local time with respect to global time, given by the
   * product of the current ambient rate with the currently applicable rate
   * functions.
   * @return {Number} - The rate.
   */
  get_current_rate() {
    return this.get_rate(this._global_time);
  }

  /**
   * Get the rate at a given global time.  This is calculated as the product of
   * the current ambient rate with the rates given by the currently active rate
   * functions.  If the specified global time is before the current global time,
   * the resulting rate may be inaccurate.
   * @param  {Number} global_time - The global time to compute the rate for.
   * @return {Number}             - The rate at the specified global time.
   */
  get_rate(global_time) {
    let rate = this._ambient_rate;
    for (let i = 0; i < this._rate_fns.length; i++) {
      rate *= this._rate_fns[i].rate(global_time);
    }
    return rate;
  }

  /**
   * Get the target step size for the IVP solver.
   * @return {Number} - The step size.
   */
  get_step_size() {
    return this._step_size;
  }

  /**
   * Set the target step size for the IVP solver.
   * @param {Number} size - The target step size; must be a positive number.
   */
  set_step_size(size) {
    if (size <= 0) {
      throw new Error("specified step size is nonpositive");
    }
    this._step_size = size;
  }

  /**
   * Peek the local time for a given global time later than the current global
   * time.  This does not have side-effects on the FlexTimer object.  Throws an
   * Error if the specified global time is before the current global time.
   * @param  {Number} global_time - The global time.
   * @return {Number}             - The corresponding local time.
   */
  peek(global_time) {
    if (global_time < this._global_time) {
      throw new Error("specified time is before current time");
    }
    return this._compute_local_time(global_time);
  }

  /**
   * Compute the number of steps needed to reach the given global time with the
   * specified step size.  Rounds up for a fractional number of steps.
   * @param  {Number} global_time - The global time to reach.
   * @return {Number}             - The number of steps needed.
   */
  _steps(global_time) {
    return Math.ceil((global_time - this._global_time) / this._step_size);
  }

  /**
   * Compute the local time corresponding to the given future global time.  If
   * no rate functions are currently active, then the local time elapsed is
   * proportional to the global time elapsed, at the current ambient rate.  If
   * at least one rate function is currently active, the function uses the
   * midpoint method for solving an initial value problem with the current non-
   * constant rate function.
   * @param  {Number} global_time - The global time to reach.
   * @return {Number}             - The local time at the specified global time.
   */
  _compute_local_time(global_time) {
    let g_time = this._global_time,
      l_time = this._local_time;
    if (this._rate_fns.length == 0) {
      return l_time + this.get_ambient_rate() * (global_time - g_time);
    } else {
      let steps = this._steps(global_time),
        delta = (global_time - this._global_time) / steps,
        d2 = delta / 2;
      for (let i = 0; i < steps; i++) {
        let rate = this.get_rate(g_time + d2);
        l_time += delta * rate;
        g_time += delta;
      }
      return l_time;
    }
  }

  /**
   * Get the local time for a given global time later than the current global
   * time.  Update the current global and local times, and prune rate functions
   * which end prior to the new current global time.  Throws an Error if the
   * specified global time is before the current global time.
   * @param  {Number} global_time - The specified global time.
   * @return {Number}             - The corresponding local time.
   */
  get(global_time) {
    let l_time = this.peek(global_time);
    this._set_global_time(global_time);
    this._set_local_time(l_time);
    this._prune_rate_fns(global_time);
    return l_time;
  }

  /**
   * Remove the active rate functions which end prior to a given global time,
   * and multiply the current ambient rate by their end values.
   * @param  {Number} global_time - The specified global time.
   */
  _prune_rate_fns(global_time) {
    let amb_rate = this.get_ambient_rate();
    for (let i = this._rate_fns.length - 1; i >= 0; --i) {
      let rf = this._rate_fns[i];
      if (rf.get_end() > global_time) {
        this._rate_fns_buffer.push(rf);
      } else {
        amb_rate *= rf.get_end_value();
      }
    }
    this._set_ambient_rate(amb_rate);
    // swap rates and rates_buffer, clear buffer
    let tmp = this._rate_fns;
    this._rate_fns = this._rate_fns_buffer;
    this._rate_fns_buffer = tmp;
    this._rate_fns_buffer.length = 0;
  }
}

/**
 * Base class to represent a function used as a rate function for a FlexTimer
 * object.
 */
class RateFunction {
  /**
   * Construct a rate function with specified start and end times, and a
   * specified end value.
   * @param {Number} [start=0]     - The start time.
   * @param {Number} [end=1000]    - The end time.
   * @param {Number} [end_value=1] - The end value.
   */
  constructor(start = 0, end = 1000, end_value = 1) {
    this._start = start;
    this._end = end;
    this._duration = end - start;
    this._end_value = end_value;
  }

  /**
   * Translate a global time into a proportion of the interval duration.  A
   * value of 0 corresponds with the function's start time, and a value of 1
   * corresponds with the function's end time.  Should not be called if the
   * rate function is a point mass, i.e. has duration 0.
   * @param  {Number} global_time - The global time.
   * @return {Number}             - The corresponding proportion.
   */
  _delta(global_time) {
    return (global_time - this._start) / this._duration;
  }

  /**
   * Return the start time of this rate function.
   * @return {Number} - The start time.
   */
  get_start() {
    return this._start;
  }

  /**
   * Return the end time of this rate function.
   * @return {Number} - The end time.
   */
  get_end() {
    return this._end;
  }

  /**
   * Return whether the specified global time lies in the active interval of
   * this rate function, inclusive for the start and exclusive for the end.
   * @param  {Number}  global_time - The global time.
   * @return {Boolean}             - Whether the specified global time is in the
   *                                 active interval.
   */
  has(global_time) {
    return global_time >= this._start && global_time < this._end;
  }

  /**
   * Return the end value of this rate function.
   * @return {Number} - The end value.
   */
  get_end_value() {
    return this._end_value;
  }

  /**
   * Return the rate associated with a given global time inside the active
   * interval of the rate function.
   * @param  {Number} global_time - The global time inside the active interval.
   * @return {Number}             - The corresponding rate.
   */
  rate_fn(global_time) {
    return 1;
  }

  /**
   * Return the rate associated with a given global time.  This has value 1 if
   * the time is before the start time, value given by `rate_fn`
   * if the time is inside the active interval, and value given by the end value
   * if the time is after the end time.
   * @param  {Number} global_time - The global time.
   * @return {Number}             - The corresponding rate.
   */
  rate(global_time) {
    if (global_time >= this._end) {
      return this._end_value;
    } else if (global_time < this._start) {
      return 1;
    } else {
      return this.rate_fn(global_time);
    }
  }
}

/**
 * A rate function given by an instantaneous jump.
 * @extends RateFunction
 */
class PointRateFunction extends RateFunction {
  /**
   * Construct a point rate function which has a given rate at or after a given
   * time.
   * @param {Number} time - The time of the change.
   * @param {Number} rate - The rate of the change.
   */
  constructor(time, rate) {
    super(time, time, rate);
  }
}
RateFunction.PointRateFunction = PointRateFunction;

/**
 * A rate function given by linear interpolation between two values.
 * @extends RateFunction
 */
class LinearRateFunction extends RateFunction {
  /**
   * Construct a linear rate function which interpolates between two values.
   * @param {Number} start      - The start time.
   * @param {Number} end        - The end time.
   * @param {Number} start_rate - The start value.
   * @param {Number} end_rate   - The end value.
   */
  constructor(start, end, start_rate, end_rate) {
    super(start, end, end_rate);
    this._start_rate = start_rate;
    this._end_rate = end_rate;
  }

  /**
   * Return the interpolation between the start and end values of a given global
   * time.
   * @param  {Number} global_time - The global time.
   * @return {Number}             - The linear interpolation.
   */
  rate_fn(t) {
    let delta = this._delta(t);
    return (1 - delta) * this._start_rate + delta * this._end_rate;
  }
}
RateFunction.LinearRateFunction = LinearRateFunction;

/**
 * A rate function which smoothly varies the rate in order to translate a global
 * time interval into a specified local time duration.
 * @extends RateFunction
 */
class CompressionRateFunction extends RateFunction {
  /**
   * Construct a CompressionRateFunction.
   * @param {Number} start          - The start time.
   * @param {Number} end            - The end time.
   * @param {Number} local_duration - The desired local time duration.
   * @param {Number} [ramp=1/3]     - The proportion of the interval used at the
   *                                  start and the end for a smooth transition;
   *                                  must be in the interval [0, 1/2].
   */
  constructor(start, end, local_duration, ramp = 1 / 3) {
    super(start, end, 1);
    if (ramp < 0 || ramp > 1 / 2) {
      throw new Error(
        "specified ramp proportion is not in the interval [0, 1/2]"
      );
    }
    this._ramp = ramp;
    this._cmp_factor = (local_duration / (end - start) - 1) / (1 - ramp);
  }

  /**
   * Return the rate at the specified global time.  The rate function is
   * piecewise defined in three subintervals based on the specified "ramp"
   * proportion.  In the first subinterval, the function varies from 1 to a
   * precomputed factor via the "smoothstep" function S_1.  In the second
   * subinterval, the function is constant. In the third subinterval, the
   * function varies from the precomputed factor to 1 via the reverse of S_1.
   * @param  {Number} global_time - The global time.
   * @return {Number}             - The corresponding rate.
   */
  rate_fn(global_time) {
    let delta = this._delta(global_time);
    if (delta < this._ramp) {
      // smoothstep S_1 on interval [0, ramp_duration)
      let x = delta / this._ramp;
      return 1 + CompressionRateFunction._smoothstep(x) * this._cmp_factor;
    } else if (delta < 1 - this._ramp) {
      // contant on interval [ramp_duration, 1 - ramp_duration)
      return 1 + this._cmp_factor;
    } else {
      // reverse of smoothstep S_1 on interval [1 - ramp_duration, 1)
      let x = (delta - (1 - this._ramp)) / this._ramp;
      return 1 + CompressionRateFunction._smoothstep(1 - x) * this._cmp_factor;
    }
  }

  /**
   * The smoothstep function S_1
   * @param  {Number} x - The input value.
   * @return {Number}   - The output value.
   */
  static _smoothstep(x) {
    return x * x * (3 - 2 * x);
  }
}
RateFunction.CompressionRateFunction = CompressionRateFunction;

module.exports = {
  FlexTimer: FlexTimer,
  RateFunction: RateFunction
};
