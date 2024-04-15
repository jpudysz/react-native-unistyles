const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { getPlatformResolver } = require('@callstack/out-of-tree-platforms')
const path = require('path')
const escape = require('escape-string-regexp')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const pak = require('../../package.json')

const root = path.resolve(__dirname, '../..')
const modules = Object.keys({ ...pak.peerDependencies })
const defaultConfig = getDefaultConfig(__dirname)

const config = {
    ...defaultConfig,
    projectRoot: __dirname,
    watchFolders: [root],
    resolver: {
        ...defaultConfig.resolver,
        blacklistRE: exclusionList(
            modules.map(
                module => new RegExp(`^${escape(path.join(root, 'node_modules', module))}\\/.*$`)
            )
        ),
        extraNodeModules: modules.reduce((acc, name) => ({
            ...acc,
            [name]: path.join(__dirname, 'node_modules', name)
        }), {}),
        // resolveRequest: getPlatformResolver({
        //     platformNameMap: { visionos: '@callstack/react-native-visionos' }
        // })
    }
}

module.exports = config
