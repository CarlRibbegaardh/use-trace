module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      require.resolve('../../packages/auto-tracer-plugin-babel/dist/index.js'),
      {
        mode: 'opt-out',
        serverComponents: false,
        labelHooks: ['useState', 'useReducer'],
        importSource: 'auto-tracer'
      }
    ]
  ],
};