const { withExpo } = require('@expo/next-adapter')
const path = require('path')

const root = path.resolve(__dirname, '../..')

/** @type {import('next').NextConfig} */
const nextConfig = withExpo({
    reactStrictMode: true,
    swcMinify: true,
    transpilePackages: [
        'react-native',
        'expo',
        'react-native-unistyles'
        // Add more React Native / Expo packages here...
    ],
    experimental: {
        forceSwcTransforms: true
    },
    webpack: config => {
        // For development, we want to alias the library to the source
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-native-unistyles': path.resolve(root, 'src')
        }

        return config
    }
})

module.exports = nextConfig
