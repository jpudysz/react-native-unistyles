const { getDefaultConfig } = require('@react-native/metro-config')
const path = require('path')
const escape = require('escape-string-regexp')
const exclusionList = require('metro-config/private/defaults/exclusionList')

const pak = require('../../packages/unistyles/package.json')

const monorepoRoot = path.resolve(__dirname, '../..')
const libraryRoot = path.resolve(__dirname, '../../packages/unistyles')
const modules = Object.keys({ ...pak.peerDependencies })

const defaultConfig = getDefaultConfig(__dirname)

const config = {
    ...defaultConfig,

    projectRoot: __dirname,
    watchFolders: [libraryRoot, monorepoRoot],

    // We need to make sure that only one version is loaded for peerDependencies
    // So we block them at the root, and alias them to the versions in example's node_modules
    resolver: {
        ...defaultConfig.resolver,
        blacklistRE: exclusionList(
            modules.map(
                module => new RegExp(`^${escape(path.join(libraryRoot, 'node_modules', module))}\\/.*$`)
            )
        ),
        extraNodeModules: modules.reduce((acc, name) => ({
            ...acc,
            [name]: path.join(__dirname, 'node_modules', name)
        }), {}),
        nodeModulesPaths: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(monorepoRoot, 'node_modules'),
        ]
    }
}

module.exports = config
