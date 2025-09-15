const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
  mode: "development",

  entry: {
    home: "./scripts/home.js",
  },

  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name].bundle.js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
    ],
  },

  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      filename: "home.html",
      template: "./html/home.html",
      chunks: ["home"],
    }),
  ],

  devtool: "source-map",

  devServer: {
    static: "./public",
    port: 3005,
    open: "home.html",
    hot: true,
    historyApiFallback: true,
    watchFiles: [
      "html/**/*.*",
      "styles/**/*.*",
      "scripts/**/*.*",
      "assets/**/*.*",
    ],
  },
};
