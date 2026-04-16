module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Apply decorator plugins only to app source files, NOT node_modules.
    // This prevents the decorator plugin (which runs before presets) from
    // encountering TypeScript 'declare' fields in node_modules before
    // @babel/plugin-transform-typescript (inside babel-preset-expo) runs.
    overrides: [
      {
        exclude: /node_modules/,
        plugins: [
          // Required for WatermelonDB decorators
          // legacy decorators must come BEFORE class-properties
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          // loose: true is required to be compatible with legacy decorators
          ['@babel/plugin-transform-class-properties', { loose: true }],
        ],
      },
    ],
    env: {
      production: {
        plugins: [
          'react-native-paper/babel',
        ],
      },
    },
  };
};