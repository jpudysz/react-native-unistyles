const path = require('path')
const escape = require('escape-string-regexp')
const { getDefaultConfig } = require('@expo/metro-config')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const pak = require('../../package.json')

const root = path.resolve(__dirname, '../..')
const modules = Object.keys({ ...pak.peerDependencies })

const defaultConfig = getDefaultConfig(__dirname)

const config = {
    ...defaultConfig,

    projectRoot: __dirname,
    watchFolders: [root],

    // We need to make sure that only one version is loaded for peerDependencies
    // So we block them at the root, and alias them to the versions in example's node_modules
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
        }), {})
    }
}

module.exports = config
