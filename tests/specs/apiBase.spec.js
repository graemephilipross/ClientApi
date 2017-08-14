'use strict';

import ClientApi from '../../client-api/src/api.base.js';

describe("Client API base service", function() {

  describe("test constructing and configuring the service", function() {

    before('mock circuit breakers', function() {
      
    });
    
    it("should be constructed with the default values", function() {
      const api = new ClientApi();
      expect(api._clientApi).to.have.property('baseURL').equal('');
      expect(api._clientApi).to.have.property('headers');
      expect(api._circuitBreaker).to.have.property('gracePeriodMs').equal(5000);
      expect(api._circuitBreaker).to.have.property('threshold').equal(5);
    });

    it("should be constructed with circuit breaker options", function() {
      const api = new ClientApi({
        circuitBreaker: {
          gracePeriodMs: 6000,
          threshold: 6
        }
      });
      expect(api._circuitBreaker).to.have.property('gracePeriodMs').equal(6000);
      expect(api._circuitBreaker).to.have.property('threshold').equal(6);
    });
  
  });
});
