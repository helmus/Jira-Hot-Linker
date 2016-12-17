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
        presets: [
          ['env', {
            'targets': {
              'chrome': 55
            },
            'modules': false
          }]
        ],
        plugins: [
          'transform-object-assign'
        ]
      }
    }]
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', 'jsx']
  }
};