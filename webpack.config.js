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
        loader: "eslint-loader",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ["es2015"]
        }
      }
    ]
  },
  devtool: "inline-source-map"
};