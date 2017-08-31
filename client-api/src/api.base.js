'use strict';

import _ from 'lodash';
import EventEmitter from 'wolfy87-eventemitter';
import circuitBreaker from './circuit-breaker';
import nullCircuitBreaker from './null-circuit-breaker';

const restMethods = {
  query: ['get', 'delete'],
  payload: ['post', 'put', 'patch']
};

export default class ApiBase {
  constructor(options = {}) {

    this._ee = new EventEmitter();

    this._circuitBreaker = {
      gracePeriodMs: 5000,
      threshold: 5,
    };
    this._clientApi = {
      headers: new Headers({
        'Content-Type': 'text/plain'
      }),
      baseURL: '',
      cacheThenNetwork: false
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
      : null;
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

  _sendReq(url, req) {
    return this._breaker(url, req)
    .then(res => {
      if (
        res.status in this._clientApi &&
        this._clientApi[res.status] instanceof Function
      ) {
        this._clientApi[res.status]();
      }
      return Promise.all([res.json(), res]);
    }, err => {
      return Promise.reject({body: err, status: 500});
    })
    .then(([body, res]) => {
      if (res.status === 200) {
        return Promise.resolve({body, status: res.status});
      }
      return Promise.reject({body, status: res.status});
    });
  }

  _cacheThenNetworkReq(url, req, event) {

    let networkDataReceived = false;
    let cacheDataReceived = false;

    const networkBody = res => {
      networkDataReceived = true;
      if (cacheDataReceived) {
        this._ee.emitEvent(event, [res]);
      }
    };

    return new Promise((resolve, reject) => {
      this._sendReq(url, req)
      .then(res => {
        networkBody(res);
        resolve(res);
      })
      .catch(res => {
        networkBody(res);
        reject(res);
      });

      caches.match(url)
      .then(res => {
        if (!res) {
          // rely on network req to reject / resolve
          return Promise.resolve([]);
        }
        return Promise.all([res.json(), res.status]);
      })
      .then(([body, status]) => {
        if (body && !networkDataReceived) {
          cacheDataReceived = true;
          if (status === 200) {
            resolve({body, status});
          }
          reject({body, status});
        }
      });
    });
  }

  fetch(resource, method, data = {}, event = null){
    const url = `${this._clientApi.baseURL}/${this._buildUrl(resource, method, data)}`;
    const req = {
      ...this._clientApi,
      method,
      body: this._createPayload(method, data) && JSON.stringify(this._createPayload(method, data))
    };
    // use cache then network strategy
    if (this._clientApi.cacheThenNetwork && 'caches' in window) {
      return this._cacheThenNetworkReq(url, req, event);
    }
    return this._sendReq(url, req);
  }

  on(event, callback) {
    this._ee.addListener(event, callback);
  }
}
