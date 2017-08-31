var devConfig = require("./webpack.config.js");

var prodConfig = devConfig;

prodConfig.output = {
  path: __dirname + '/dist',
  filename: "index.js",
  libraryTarget: "umd"
};
delete prodConfig.devtool;

module.exports = prodConfig;
