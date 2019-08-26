// Custom Jest transform implementation that wraps babel-jest and injects our
// babel presets, so we don't have to use .babelrc.

module.exports = {
  presets: [['@babel/env', { modules: 'umd' }], '@babel/flow'],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-async-to-generator',
  ],
};
