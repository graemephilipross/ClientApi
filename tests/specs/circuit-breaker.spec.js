'use strict';

const circuitBreaker = require('../../client-api/src/circuit-breaker.js').default;

describe("circuit breaker implementation", function() {

  it("should return an error if missing an async function", function() {
    should.Throw(() => circuitBreaker(), Error);
  });

  it("should return an error if missing options", function() {
    should.Throw(() => circuitBreaker(() => {}), Error);
  });

  it("calls asyncFn normally with no failures", function() {
    const api = circuitBreaker(() => Promise.resolve(5), {});
    return api()
    .then(api)
    .then(res => {
      expect(res).to.be.equal(5);
    });
  });

  it("should stop calling async func after failure threshold is met", function() {
    const obj = {
      callback: () => Promise.reject('error')
    };
    const spy = sinon.spy(obj, "callback");
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 1000, threshold: 2});
    return api()
    .then(() => {}, api)
    .then(() => {}, api)
    .then(() => {}, () => {
      assert(spy.calledTwice);
    });
  });

  it("should retry calling the async function after the grace period is met", function() {
    const obj = {
      callback: () => Promise.reject('error')
    };
    const spy = sinon.spy(obj, "callback");
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 50, threshold: 1});
    return api()
    .then(() => {}, api)
    .then(() => {}, () => {
      return new Promise((res) => {
        setTimeout(res, 100);
      });
    })
    .then(() => {}, api)
    .then(() => {}, () => {
      assert(spy.calledTwice);
    });
  });

  it("should go back to an open state when failed at half open", function() {
    const obj = {
      callback: () => Promise.reject('error')
    };
    const spy = sinon.spy(obj, "callback");
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 50, threshold: 2});
    return api()
    .then(() => {}, api)
    .then(() => {}, () => {
      return new Promise((res) => {
        setTimeout(res, 100);
      });
    })
    .then(api)
    .then(() => {}, api)
    .then(() => {}, () => {
      assert(spy.calledThrice);
    });
  });

  it("should reset threshold when succeeded in half open state", function() {
    let fail = true;
    const stopFailing = () => fail = false;
    const startFailing = () => fail = true;
    const obj = {
      callback: () => {
        return fail ? Promise.reject('error') : Promise.resolve('success');
      }
    };
    const spy = sinon.spy(obj, "callback");
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 50, threshold: 2});

    return api()
    .then(() => {}, api)
    .then(() => {}, () => {
      return new Promise((res) => {
        setTimeout(res, 100);
      });
    })
    .then(stopFailing)
    .then(api)
    .then(startFailing)
    .then(api)
    .then(() => {}, api)
    .then(() => {}, () => {
      assert(spy.callCount === 5);
    });
  });

  it("should throw an error with custom configured message", function() {
    const obj = {
      callback: () => Promise.reject('error')
    };
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 50, threshold: 1, message: 'oh no'});
    return api()
    .then(() => {}, api)
    .then(api)
    .then(() => {}, err => {
      expect(err.message).to.be.equal('oh no');
    });
  });
});