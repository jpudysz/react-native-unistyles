const path = require('path')
const pak = require('../../packages/unistyles/package.json')

/** @type {import('../../packages/unistyles/plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
    debug: true,
    isLocal: true,
    localPath: path.join(__dirname, '../../packages/unistyles'),
    root: 'src',
    autoProcessImports: ['@lib/theme', './st'],
}

// react-native-unistyles/metro (metro.config.js) runs Unistyles, UNISTYLES_BUNDLER=babel runs the Babel plugin instead
const useBabelPlugin = process.env.UNISTYLES_BUNDLER === 'babel'

module.exports = api => {
    api.cache.using(() => useBabelPlugin)

    return {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            useBabelPlugin && [
                path.join(__dirname, '../../packages/unistyles/plugin'),
                unistylesPluginOptions
            ],
            [
                'module-resolver',
                {
                    alias: {
                        // For development, we want to alias the library to the source
                        [pak.name]: path.join(__dirname, '../../packages/unistyles/', pak.source)
                    }
                }
            ],
            'react-native-worklets/plugin'
        ].filter(Boolean)
    }
}
