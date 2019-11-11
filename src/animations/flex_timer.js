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

  add_rate_function(rate_function) {
    if (rate_function.get_start() < this._global_time) {
      this._set_ambient_rate(
        this._get_ambient_rate() * rate_function.get_end_value()
      );
    } else {
      this._rate_fns.push(rate_function);
    }
  }

  get_rate_functions() {
    return Array.from(this._rate_fns);
  }

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
   * @return {[type]} - The rate.
   */
  get_current_rate() {
    return this.get_rate(this._global_time);
  }

  get_rate(t) {
    let rate = this._ambient_rate;
    for (let i = 0; i < this._rate_fns.length; i++) {
      rate *= this._rate_fns[i].rate(t);
    }
    return rate;
  }

  peek(global_time) {
    if (global_time < this._global_time) {
      throw new Error("specified time is before current time");
    }
    return this._compute_local_time(global_time);
  }

  _steps(global_time) {
    return Math.ceil((global_time - this._global_time) / this._step_size);
  }

  _compute_local_time(global_time) {
    let g_time = this._global_time,
      l_time = this._local_time;
    if (this._rate_fns.length == 0) {
      return l_time + this.get_ambient_rate() * (global_time - g_time);
    } else {
      let steps = this._steps(global_time),
        delta = (global_time - this._global_time) / steps;
      for (let i = 0; i < steps; i++) {
        let rate = this.get_rate(g_time);
        l_time += delta * rate;
        g_time += delta;
      }
      return l_time;
    }
  }

  get(global_time) {
    let l_time = this.peek(global_time);
    this._set_global_time(global_time);
    this._set_local_time(l_time);
    this._prune_rate_fns(global_time);
    return l_time;
  }

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

class RateFunction {
  constructor(start = 0, end = 1000, end_value = 1) {
    this._start = start;
    this._end = end;
    this._duration = end - start;
    this._end_value = end_value;
  }

  _delta(t) {
    return (t - this._start) / this._duration;
  }

  get_start() {
    return this._start;
  }

  get_end() {
    return this._end;
  }

  has(t) {
    return t >= this._start && t < this._end;
  }

  get_end_value() {
    return this._end_value;
  }

  rate_fn(t) {
    return 1;
  }

  rate(t) {
    if (t >= this._end) {
      return this._end_value;
    } else if (t < this._start) {
      return 1;
    } else {
      return this.rate_fn(t);
    }
  }
}

class PointRateFunction extends RateFunction {
  constructor(time, rate) {
    super(time, time, rate);
    this._point_rate = rate;
  }

  rate_fn(t) {
    return this._point_rate;
  }
}
RateFunction.PointRateFunction = PointRateFunction;

class LinearRateFunction extends RateFunction {
  constructor(start, end, start_rate, end_rate) {
    super(start, end, end_rate);
    this._start_rate = start_rate;
    this._end_rate = end_rate;
  }

  rate_fn(t) {
    let delta = this._delta(t);
    return (1 - delta) * this._start_rate + delta * this._end_rate;
  }
}
RateFunction.LinearRateFunction = LinearRateFunction;

class CompressionRateFunction extends RateFunction {
  constructor(start, end, target_duration, ramp = 1 / 3) {
    super(start, end, 1);
    this._ramp = ramp; // in [0, 1/2)
    this._cmp_factor = ((end - start) / target_duration - 1) / (1 - ramp);
  }

  rate_fn(t) {
    let delta = this._delta(t);
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

  static _smoothstep(x) {
    return x * x * (3 - 2 * x);
  }
}
RateFunction.CompressionRateFunction = CompressionRateFunction;

module.exports = {
  FlexTimer: FlexTimer,
  RateFunction: RateFunction
};
