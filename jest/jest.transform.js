// Custom Jest transform implementation that wraps babel-jest and injects our
// babel presets, so we don't have to use .babelrc.

// $FlowFixMe
module.exports = require('babel-jest').createTransformer({
  presets: [
    ['es2015', { modules: false }],
    'flow',
  ],
  plugins: [
    'transform-object-assign',
    'transform-class-properties',
    'transform-object-rest-spread',
    'transform-async-to-generator',
  ],
  env: {
    test: {
      plugins: ['transform-es2015-modules-commonjs'],
    },
  },
});
