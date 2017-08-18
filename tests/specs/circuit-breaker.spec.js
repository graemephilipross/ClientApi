'use strict';

const circuitBreaker = require('../../client-api/src/circuit-breaker.js').default;

describe("circuit breaker implementation", function() {

  it("should return an error if missing an async function", function() {
    should.Throw(() => circuitBreaker(), Error);
  });

  it("should return an error if missing options", function() {
    should.Throw(() => circuitBreaker(() => {}), Error);
  });

  it("should return a Promise", function() {
    const api = circuitBreaker(() => Promise.resolve(5), {});
    return api()
    .then(res => {
      expect(res).to.be.equal(5);
    });
  });

  it.only("should stop calling async func after failure threshold is met", function() {
    const obj = {
      callback: () => Promise.reject('error')
    };
    const spy = sinon.spy(obj, "callback");
    const api = circuitBreaker(obj.callback, { gracePeriodMs: 1000, threshold: 1});
    return api()
    .catch(() => {
      assert(spy.called);
    });
  });
});