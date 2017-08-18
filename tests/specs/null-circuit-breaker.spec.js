'use strict';

const nullCircuitBreaker = require('../../client-api/src/null-circuit-breaker.js').default;

describe("null circuit breaker implementation", function() {

  it("should return an error if missing an async function", function() {
    should.Throw(() => nullCircuitBreaker(), Error);
  });

  it("should return an error if missing options", function() {
    should.Throw(() => nullCircuitBreaker(() => {}), Error);
  });

  it("should return a Promise", function() {
    const api = nullCircuitBreaker(() => Promise.resolve(), {});
    return api()
    .then(() => {
      assert(true);
    });
  });

  it("should return a Promise and function executed", function() {
    const callback = () => Promise.resolve(5);
    const api = nullCircuitBreaker(callback, {});
    return api()
    .then(res => {
      expect(res).to.be.equal(5);
    });
  });
});