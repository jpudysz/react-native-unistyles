import { fileURLToPath } from 'node:url'

const unistylesWebEntry = fileURLToPath(
    new URL('../../packages/unistyles/lib/module/web/index.js', import.meta.url),
)
const reactNativeWebRscEntry = fileURLToPath(new URL('./react-native-web-rsc.mjs', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['react-native', 'react-native-unistyles', 'react-native-web'],
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-native$': reactNativeWebRscEntry,
            'react-native-unistyles$': unistylesWebEntry,
        }
        config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', ...config.resolve.extensions]

        return config
    },
}

export default nextConfig
