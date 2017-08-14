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
    this._circuitBreaker = {
      gracePeriodMs: 5000,
      threshold: 5,
    };

    this._clientApi = {
      baseURL: '',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    };

    const { circuitBreaker: circuitBreakerConf, ...fetchConf } = options;

    if (circuitBreakerConf) {
      Hoek.merge(this._circuitBreaker, circuitBreakerConf);
      this._breaker = circuitBreaker(fetch, this._circuitBreaker);
      return;
    }

    Hoek.merge(this._clientApi, fetchConf);
    this._breaker = nullCircuitBreaker(fetch, {});
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
    const url = `${this._clientApi.baseURL}/${this._buildUrl(resource, method, data)}`;
    const req = {
      ...this._clientApi,
      method,
      body: JSON.stringify(this._createPayload(method, data))
    };
    return this._sendReq(url, req);
  }
};
