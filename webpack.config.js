/* eslint-env node */
const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: {
    'build/main': './jira-plugin/src/content.jsx',
    'build/background': './jira-plugin/src/background.js',
    'options/build/options': './jira-plugin/options/options.js',
  },
  output: {
    path: path.resolve(__dirname, 'jira-plugin'),
    filename: '[name].js',
    pathinfo: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader'
        ]
      }, {
        test: /\.(css|scss)$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader?sourceMap!sass-loader?sourceMap'
        ]
      },
    ]
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'jira-plugin'),
    ],
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
  }
};