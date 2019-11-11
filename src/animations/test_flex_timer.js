const assert = require("chai").assert;

const FlexTimer = require("./flex_timer.js").FlexTimer;
const RateFunction = require("./flex_timer.js").RateFunction;

const epsilon = 0.000001;

describe("RateFunction", () => {
  var rf;

  describe("Base", () => {
    const start = 0;
    const end = 1000;
    const end_value = 2;

    beforeEach(() => {
      rf = new RateFunction(start, end, end_value);
    });

    describe("constructor", () => {
      it("should produce an object", () => {
        assert.typeOf(rf, "object");
      });
    });

    describe("get_start", () => {
      it("should return the start time", () => {
        assert.equal(rf.get_start(), start);
      });
    });

    describe("get_end", () => {
      it("should return the end time", () => {
        assert.equal(rf.get_end(), end);
      });
    });

    describe("has", () => {
      it("should return true exactly for times in interval [start, end)", () => {
        assert(!rf.has(start - 1));
        assert(rf.has(start));
        assert(rf.has((start + end) / 2));
        assert(!rf.has(end));
        assert(!rf.has(end + 1));
      });
    });

    describe("rate_end_value", () => {
      it("should return specified end value", () => {
        assert.equal(rf.get_end_value(), end_value);
      });
    });

    describe("rate_fn", () => {
      it("should return 1 by default", () => {
        assert.equal(rf.rate_fn(0.5), 1);
      });
    });

    describe("rate", () => {
      it("should return 1 before start", () => {
        assert.equal(rf.rate(start - 1), 1);
      });

      it("should return rate_fn value during interval", () => {
        assert.equal(rf.rate(start), 1);
        assert.equal(rf.rate((start + end) / 2), 1);
      });

      it("should return end value after end", () => {
        assert.equal(rf.rate(end), end_value);
        assert.equal(rf.rate(end + 1), end_value);
      });
    });
  });

  describe("PointRateFunction", () => {
    const time = 500,
      rate = 2;

    beforeEach(() => {
      rf = new RateFunction.PointRateFunction(time, rate);
    });

    describe("rate", () => {
      it("should return 1 prior to time", () => {
        assert.equal(rf.rate(time - 1), 1);
      });

      it("should return end rate at time", () => {
        assert.equal(rf.rate(time), rate);
      });

      it("should return end rate after time", () => {
        assert.equal(rf.rate(time), rate);
        assert.equal(rf.rate(time + 1), rate);
      });
    });
  });

  describe("LinearRateFunction", () => {
    const start = 0,
      end = 1000,
      start_rate = 2,
      end_rate = 3;

    beforeEach(() => {
      rf = new RateFunction.LinearRateFunction(
        start,
        end,
        start_rate,
        end_rate
      );
    });

    describe("rate_fn", () => {
      it("should return linear interpolation between endpoint values", () => {
        assert.equal(rf.rate_fn(start), start_rate);
        assert.equal(rf.rate_fn(end), end_rate);
        assert.approximately(
          rf.rate_fn((start + end) / 2),
          (start_rate + end_rate) / 2,
          epsilon
        );
      });
    });
  });

  describe("CompressionRateFunction", () => {
    const start = 100,
      end = 1100,
      target_duration = 2000;

    beforeEach(() => {
      rf = new RateFunction.CompressionRateFunction(
        start,
        end,
        target_duration
      );
    });

    describe("rate_fn", () => {
      it("should return correct values between endpoints", () => {
        let times = [0, 1 / 6, 1 / 3, 1 / 2, 2 / 3, 5 / 6, 1];
        let values = [1, 1.75, 2.5, 2.5, 2.5, 1.75, 1];
        for (let i = 0; i < times.length; i++) {
          assert.approximately(
            rf.rate_fn(start + times[i] * (end - start)),
            values[i],
            epsilon
          );
        }
      });
    });
  });
});

describe("FlexTimer", () => {
  var ft;
  const step_size = 0.5;

  beforeEach(() => {
    ft = new FlexTimer(0, step_size);
  });

  describe("Initialization", () => {
    describe("constructor", () => {
      it("should produce an object with expected starting parameters", () => {
        assert.isObject(ft);
        assert.equal(ft.get_global_time(), 0);
        assert.equal(ft.get_local_time(), 0);
        assert.equal(ft.get_ambient_rate(), 1);
        assert.isEmpty(ft.get_rate_functions());
      });
    });

    describe("add_rate_function", () => {
      it("should add a rate function", () => {
        ft.add_rate_function(new RateFunction(0, 1, 1));
        assert.lengthOf(ft.get_rate_functions(), 1);
        assert.equal(ft.get_ambient_rate(), 1);
      });

      it("should incorporate expired rate function into ambient rate", () => {
        ft.add_rate_function(new RateFunction(-2, -1, 2));
        assert.lengthOf(ft.get_rate_functions(), 0);
        assert.equal(ft.get_ambient_rate(), 2);
      });
    });
  });

  describe("Evaluation", () => {
    const rf_1 = new RateFunction.LinearRateFunction(0, 4, 1, 2),
      rf_2 = new RateFunction.LinearRateFunction(1, 2, 1, 2),
      rf_3 = new RateFunction.PointRateFunction(1, 2);
    const times = [0, 1, 2, 3, 4, 5],
      values = [0, 1.125, 5.28125, 11.78125, 19.28125, 27.28125],
      ambient_rate = [1, 2, 4, 4, 8, 8],
      remaining_fns = [3, 2, 1, 1, 0, 0];

    beforeEach(() => {
      ft.add_rate_function(rf_1);
      ft.add_rate_function(rf_2);
      ft.add_rate_function(rf_3);
    });

    describe("peek", () => {
      it("should return new time without updating timer state", () => {
        for (let i = 0; i < times.length; ++i) {
          assert.approximately(ft.peek(times[i]), values[i], epsilon);
          assert.equal(ft.get_global_time(), 0);
          assert.equal(ft.get_local_time(), 0);
          assert.equal(ft.get_rate_functions().length, 3);
          assert.equal(ft.get_ambient_rate(), 1);
        }
      });

      it("should throw if specifying a time before current global time", () => {
        assert.throws(() => {
          ft.peek(-1);
        });
      });
    });

    describe("get", () => {
      it("should return new time and update timer state", () => {
        for (let i = 0; i < times.length; ++i) {
          assert.approximately(ft.get(times[i]), values[i], epsilon);
          assert.equal(ft.get_global_time(), times[i]);
          assert.equal(ft.get_local_time(), values[i]);
          assert.equal(ft.get_rate_functions().length, remaining_fns[i]);
          assert.equal(ft.get_ambient_rate(), ambient_rate[i]);
        }
      });

      it("should throw if specifying a time before current global time", () => {
        assert.throws(() => {
          ft.get(-1);
        });
      });
    });
  });
});

describe("FlexTimer Interval Compression", () => {
  var ft;
  const interval_length = 1000,
    local_duration = 5000,
    step_size = 50,
    ramp = 1 / 3;

  it("should adjust the interval to approximately the desired duration", () => {
    ft = new FlexTimer(0, step_size);
    ft.add_rate_function(
      new RateFunction.CompressionRateFunction(
        0,
        interval_length,
        local_duration,
        ramp
      )
    );
    assert.approximately(ft.get(interval_length), local_duration, 1);
  });
});
