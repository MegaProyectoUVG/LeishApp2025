// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: [
      'tflite',
      // …y cualquier otra extensión que ya tuvieras
      ...getDefaultConfig(__dirname).resolver.assetExts,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
