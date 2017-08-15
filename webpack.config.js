module.exports={
  entry: "./client-api/index.js",
  output: {
    filename: "bundle.js"
  },
  module:{
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  devtool: "inline-source-map"
};
