var devConfig = require("./webpack.config.js");

var prodConfig = devConfig;

prodConfig.output = {
  path: __dirname + '/dist',
  filename: "index.js"
};
delete prodConfig.devtool;

module.exports = prodConfig;
