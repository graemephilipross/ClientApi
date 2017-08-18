'use strict';

export default (asyncFn, options) => {
  if (!asyncFn || !options) {
    throw new Error('An async function and options must be provided');
  }
  
  return function () {
    return Promise.resolve()
    .then(() => {
      return asyncFn.apply(asyncFn.this, arguments);
    });
  };
};
