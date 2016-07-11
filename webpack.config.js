module.exports = {
  devtool: 'eval-source-map',
  entry: './jira-plugin/src/content.jsx',
  output: {
    path: './jira-plugin/build',
    filename: 'main.js',
    pathinfo: true
  },
  module: {
    loaders: [{
      test: /\.(js|jsx)$/,
      loader: 'babel',
      exclude: './node_modules',
      query: {
        cacheDirectory: true,
        presets: ['es2015-loose', 'es2015-native-generators', 'react'],
        plugins: [
          'transform-object-assign',
          'transform-proto-to-assign'
        ]
      }
    }]
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', 'jsx']
  }
};