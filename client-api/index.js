'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
  .then(function(reg) {
    console.log('Registration succeeded. Scope is ' + reg.scope);
  })
  .catch(function(error) {
    console.log('Registration failed with ' + error);
  });
}

import ApiBase from './src/api.base';
export default ApiBase;
