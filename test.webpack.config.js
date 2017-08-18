var devConfig = require("./webpack.config.js");

var testConfig = devConfig;

testConfig.module = {
  loaders: [ 
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    },
    {
      test: /\.js$/,
      exclude: /node_modules|tests/,
      loader: 'istanbul-instrumenter-loader',
      enforce: 'post'
    }
  ],
};

module.exports = testConfig;
