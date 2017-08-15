'use strict';

const ClientApi = require('inject-loader!../../client-api/src/api.base.js');

describe("Client API base service", function() {

  let mockClientApi = null;

  const breakerMocks = {
    circuitBreaker: sinon.stub(),
    nullCircuitBreaker: sinon.stub()
  };

  before('mock circuit breakers', function() {
    mockClientApi = ClientApi({
      './circuit-breaker': breakerMocks.circuitBreaker,
      './null-circuit-breaker': breakerMocks.nullCircuitBreaker
    }).default;
  });

  describe("test constructing and configuring the service", function() {

    it("should be constructed with the default values", function() {
      const api = new mockClientApi({});
      expect(api._clientApi).to.have.property('baseURL').equal('');
      expect(api._clientApi).to.have.property('headers');
      expect(api._circuitBreaker).to.have.property('gracePeriodMs').equal(5000);
      expect(api._circuitBreaker).to.have.property('threshold').equal(5);
    });

    it("should be constructed with circuit breaker options", function() {
      const api = new mockClientApi({
        circuitBreaker: {
          gracePeriodMs: 6000,
          threshold: 6
        }
      });
      expect(api._circuitBreaker).to.have.property('gracePeriodMs').equal(6000);
      expect(api._circuitBreaker).to.have.property('threshold').equal(6);
    });

    it("should be constructed with fetch api options", function() {
      const api = new mockClientApi({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.NotEmpty.com',
        credentials: 'same-origin',
        nested: {
          x: 'y'
        }
      });
      expect(api._clientApi).to.have.property('baseURL').equal('www.NotEmpty.com');
      expect(api._clientApi).to.have.property('headers');
      expect(api._clientApi.headers.get('Content-Type')).to.equal('application/json');
      expect(api._clientApi).to.have.property('credentials').equal('same-origin');
      expect(api._clientApi.nested).to.have.property('x').equal('y');
    });
  });

  describe("test creating the payload", function() {

    let api = null;

    before('set up a mock client', function() {
      api = new mockClientApi({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
    });

    it("should create a payload obj", function() {
      const payload = api._createPayload('post', { test: 'testVal'});
      expect(payload).to.have.property('test').equal('testVal');
    });

    it("should not create a payload obj", function() {
      const payload = api._createPayload('get', { test: 'testVal'});
      expect(payload).to.not.have.any.keys('test');
    });

  });
});
