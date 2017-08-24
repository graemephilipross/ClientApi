'use strict';

import _ from 'lodash';
import circuitBreaker from './circuit-breaker';
import nullCircuitBreaker from './null-circuit-breaker';

const restMethods = {
  query: ['get', 'delete'],
  payload: ['post', 'put', 'patch']
};

export default class ApiBase {
  constructor(options = {}) {
    this._circuitBreaker = {
      gracePeriodMs: 5000,
      threshold: 5,
    };
    this._clientApi = {
      headers: new Headers({
        'Content-Type': 'text/plain'
      }),
      baseURL: ''
    };

    const { circuitBreaker: circuitBreakerConf, ...fetchConf } = options;

    if (circuitBreakerConf) {
      this._circuitBreaker = Object.assign({}, this._circuitBreaker, circuitBreakerConf);
      this._breaker = circuitBreaker(fetch, this._circuitBreaker);
      return;
    }

    this._clientApi = Object.assign({}, this._clientApi, fetchConf);
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
    if (restMethods.query.includes(method.toLowerCase()) && !_.isEmpty(data)) {
      resource += `?${this._buildQueryString(data)}`;
    }
    return resource;
  }

  // set addiotnal options method

  _sendReq(url, req) {
    // may have to amend as all status codes return true
    return this._breaker(url, req)
    .catch(error => {
      // err callback in config
      if (
        error.response.status in this._clientApi &&
        this._clientApi[error.response.status] instanceof Function
      ) {
        this._clientApi[error.response.status]();
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
}
