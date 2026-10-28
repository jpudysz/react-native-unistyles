const webpack = require('webpack')

/** @type {import('next').NextConfig} */
module.exports = {
    transpilePackages: ['react-native-web', 'react-native-unistyles'],
    webpack: (config, { dev }) => {
        config.resolve.alias = { ...config.resolve.alias, 'react-native$': 'react-native-web' }
        config.resolve.extensions = ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', ...config.resolve.extensions]
        config.plugins.push(new webpack.DefinePlugin({ __DEV__: JSON.stringify(dev) }))

        return config
    },
}
