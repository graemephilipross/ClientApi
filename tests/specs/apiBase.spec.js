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

    it("should import its dependancies", function() {
      const api = new ClientApi();
      expect(api).to.exist;
    });

    it("should be constructed", function() {
      const api = new mockClientApi();
      expect(api).to.exist;
    });

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
      const payloadGet = api._createPayload('get', { test: 'testVal'});
      expect(payloadGet).to.equal(null);
      const payloadDel = api._createPayload('delete', { test: 'testVal'});
      expect(payloadDel).to.equal(null);
    });

    it("should create a payload obj", function() {
      const payloadPost = api._createPayload('post', { test: 'testVal'});
      expect(payloadPost).to.have.property('test');
      const payloadPut = api._createPayload('put', { test: 'testVal'});
      expect(payloadPut).to.have.property('test');
      const payloadPatch = api._createPayload('put', { test: 'testVal'});
      expect(payloadPatch).to.have.property('test');
    });
  });

  describe("test building up a query string", function() {
    
    let api = null;

    before('set up a mock client', function() {
      api = new mockClientApi({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
    });

    it("should build up a query string", function() {
      const queryOne = api._buildQueryString({test: 'testVal'});
      expect(queryOne).to.equal('test=testVal');
      const queryTwo = api._buildQueryString({test: 'testVal', test1: 'testVal1'});
      expect(queryTwo).to.equal('test=testVal&test1=testVal1');
    });
  });

  describe("test building a url", function() {
    
    let api = null;

    before('set up a mock client', function() {
      api = new mockClientApi({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
    });

    it("should build up a url without query string", function() {
      const urlOne = api._buildUrl('api/test', 'post', {});
      expect(urlOne).to.equal('api/test');
      const urlTwo = api._buildUrl('api/test', 'get', {});
      expect(urlTwo).to.equal('api/test');
      const urlThree = api._buildUrl('api/test', 'post', {test: 'testVal'});
      expect(urlThree).to.equal('api/test');
    });

    it("should build up a url with a query string", function() {
      const urlOne = api._buildUrl('api/test', 'post', {test: 'testVal'});
      expect(urlOne).to.equal('api/test');
      const urlTwo = api._buildUrl('api/test', 'get', {test: 'testVal'});
      expect(urlTwo).to.equal('api/test?test=testVal');
    });
  });

  describe("test sending a request", function() {
    
    let api = null;

    it("should send a request and return resolved promise", function() {

      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        })),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        }))
      }).default;

      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
      return api._sendReq('api/test', {})
      .catch(() => {
        assert(false);
      });
    });

    it("should send a request and return rejected promise", function() {
      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 401, 
          json: () => Promise.resolve({body: 'test'})
        })),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 401, 
          json: () => Promise.resolve({body: 'test'})
        }))
      }).default;

      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
      return api._sendReq('api/test', {})
      .catch(() => {
        assert(true);
      });
    });

    it("should send a request and return rejected promise and execute callback", function() {
      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 404, 
          json: () => Promise.resolve({body: 'test'})
        })),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 404, 
          json: () => Promise.resolve({body: 'test'})
        }))
      }).default;
      const callback = sinon.spy();
      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        baseURL: 'www.mockClientApi.com',
        '404': callback
      });
      return api._sendReq('api/test', {})
      .catch(() => {
        assert(callback.called);
      });
    });
  });

  describe("test calling public fetch", function() {
    
    let api = null;

    it("should send a fetch request and be resolved without passing any data", function() {
      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        })),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        }))
      }).default;

      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
      return api.fetch('api/test', 'post')
      .then(() => {
        assert(true);
      });
    });

    it("should send a fetch request and be resolved", function() {
      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        })),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.resolve({
          status: 200, 
          json: () => Promise.resolve({body: 'test'})
        }))
      }).default;

      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
      return api.fetch('api/test', 'post', {})
      .then(() => {
        assert(true);
      });
    });

    it("should send a fetch request and be rejected", function() {
      let mockClientApiResolve = ClientApi({
        './circuit-breaker': sinon.stub().returns(() => Promise.reject()),
        './null-circuit-breaker': sinon.stub().returns(() => Promise.reject())
      }).default;

      api = new mockClientApiResolve({
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        baseURL: 'www.mockClientApi.com',
      });
      return api.fetch('api/test', 'post', {})
      .catch(() => {
        assert(true);
      });
    });
  });
});
