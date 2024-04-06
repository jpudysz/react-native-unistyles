const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

import('metro-config').MetroConfig

const defaultConfig = getDefaultConfig(__dirname)

const config = {}

module.exports = mergeConfig(defaultConfig, config)
