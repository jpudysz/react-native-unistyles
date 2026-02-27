const path = require('path')
const pak = require('../../packages/unistyles/package.json')

module.exports = function (api) {
    api.cache(true)

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            "react-native-worklets/plugin",
            [path.join(__dirname, '../../packages/unistyles/plugin'), {
                debug: true,
                isLocal: true,
                root: 'app'
            }],
            [
                'module-resolver',
                {
                    alias: {
                        // For development, we want to alias the library to the source
                        "react-native-unistyles/reanimated": path.join(__dirname, '../../packages/unistyles/src/reanimated'),
                        [pak.name]: path.join(__dirname, '../../packages/unistyles/', pak.source)
                    }
                }
            ]
        ]
    }
}
