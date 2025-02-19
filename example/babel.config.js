const path = require('path')
const pak = require('../package.json')

/** @type {import('../plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
    debug: true,
    isLocal: true,
    autoProcessImports: ['@lib/theme', './st'],
}

module.exports = api => {
    api.cache(true)

    return {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            [
                path.join(__dirname, '../plugin'),
                unistylesPluginOptions
            ],
            [
                'module-resolver',
                {
                    alias: {
                        // For development, we want to alias the library to the source
                        [pak.name]: path.join(__dirname, '../', pak.source)
                    }
                }
            ],
            // 'react-native-reanimated/plugin'
        ]
    }
}
