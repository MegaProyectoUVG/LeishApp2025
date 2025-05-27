const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Extendemos la lista de extensiones de assets para incluir .tflite
    assetExts: [...defaultConfig.resolver.assetExts, 'tflite'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
