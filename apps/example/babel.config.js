const path = require('path')
const pak = require('../../packages/unistyles/package.json')

/** @type {import('../../packages/unistyles/plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
    debug: true,
    isLocal: true,
    root: 'src',
    autoProcessImports: ['@lib/theme', './st'],
}

module.exports = api => {
    api.cache(true)

    return {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            [
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
        ]
    }
}
