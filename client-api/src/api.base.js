'use strict';

import Hoek from 'hoek';
import circuitBreaker from './circuit-breaker';
import nullCircuitBreaker from './null-circuit-breaker';

const restMethods = {
  query: ['get', 'delete'],
  payload: ['post', 'put', 'patch']
};

module.exports = class ApiBase {
  constructor(options) {
    this._internals = {
      circuitBreaker: {
        gracePeriodMs: 5000,
        threshold: 5,
      },
      clientApi: {
        baseURL: '',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      }
    };

    if (options.circuitBreaker) {
      Hoek.merge(this._internals.circuitBreaker, options.circuitBreaker);
      delete options.circuitBreaker;
      this._breaker = circuitBreaker(fetch, this._internals.circuitBreaker);
      return;
    }

    Hoek.merge(this._internals.clientApi, options);
    this._breaker = nullCircuitBreaker(fetch, this._internals.circuitBreaker);
  }

  _createPayload(method, data) {
    return restMethods.payload.includes(method.toLowerCase()) && data === Object(data)
    ? data
    : {};
  }
    
  _buildQueryString(object) {
    const pairs = Object.keys(object).reduce((acc, key) => {
      acc.push(`${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`);
      return acc;
    }, []);
    return pairs.join('&');
  }

  _buildUrl(resource, method, data) {
    if (restMethods.payload.includes(method.toLowerCase()) && Hoek.deepEqual(data, Object)) {
      resource += `?${this._buildQueryString(data)}`;
    }
    return resource;
  }

  _sendReq(url, req) {
    return this._breaker(url, req)
    .catch(error => {
      // err callback in req
      if (
        error.response.status in req &&
        error.response.status instanceof Function
      ) {
        req[error.response.status]();
      }
      return Promise.reject(error);
    });
  }

  fetch(resource, method, data = {}){
    const url = `${this._internals.clientApi.baseURL}/${this._buildUrl(resource, method, data)}`;
    const req = {
      ...this._internals.clientApi,
      method,
      body: JSON.stringify(this._createPayload(method, data))
    };
    return this._sendReq(url, req);
  }
};
