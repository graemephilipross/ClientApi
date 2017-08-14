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
          presets: ["es2017"],
          plugins: ["transform-object-rest-spread"]
        }
      }
    ]
  },
  devtool: "inline-source-map"
};