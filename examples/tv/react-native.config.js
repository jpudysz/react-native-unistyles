const path = require('path')

module.exports = {
    dependencies: {
        'react-native-unistyles': {
            root: path.resolve(__dirname, '../..')
        },
        expo: {
            platforms: {
                android: null,
                ios: null,
                macos: null
            }
        }
    }
}
