const path = require('path')
const pak = require('../../package.json')

module.exports = api => {
    api.cache(true)

    return {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        // For development, we want to alias the library to the source
                        [pak.name]: path.join(__dirname, '../..', pak.source)
                    }
                }
            ]
        ]
    }
}
