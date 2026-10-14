const path = require('path')
const pak = require('../../packages/unistyles/package.json')

// react-native-unistyles/metro (metro.config.js) runs Unistyles, UNISTYLES_BUNDLER=babel runs the Babel plugin instead
const useBabelPlugin = process.env.UNISTYLES_BUNDLER === 'babel'

module.exports = function (api) {
    api.cache.using(() => useBabelPlugin)

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            "react-native-worklets/plugin",
            useBabelPlugin && [path.join(__dirname, '../../packages/unistyles/plugin'), {
                debug: true,
                isLocal: true,
                localPath: path.join(__dirname, '../../packages/unistyles'),
                root: 'app',
                // components/ and e2e/ live outside app/
                autoProcessImports: ['react-native-unistyles']
            }],
            [
                'module-resolver',
                {
                    alias: {
                        // For development, we want to alias the library to the source
                        "react-native-unistyles/reanimated": path.join(__dirname, '../../packages/unistyles/src/reanimated'),
                        "react-native-unistyles/diagnostics": path.join(__dirname, '../../packages/unistyles/src/diagnostics'),
                        [pak.name]: path.join(__dirname, '../../packages/unistyles/', pak.source)
                    }
                }
            ]
        ].filter(Boolean)
    }
}
