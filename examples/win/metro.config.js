const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const fs = require('fs')
const path = require('path')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const pak = require('../../package.json')

const root = path.resolve(__dirname, '../..')
const modules = Object.keys({ ...pak.peerDependencies })

const rnwPath = fs.realpathSync(
  path.resolve(require.resolve('react-native-windows/package.json'), '..'),
);

const defaultConfig = getDefaultConfig(__dirname)

const config = {
  projectRoot: __dirname,
  watchFolders: [root],
  resolver: {
    ...defaultConfig.resolver,
    blockList: exclusionList([
            // This stops "react-native run-windows" from causing the metro server to crash if its already running
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`,
      ),
      // This prevents "react-native run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip or other files produced by msbuild
      new RegExp(`${rnwPath}/build/.*`),
      new RegExp(`${rnwPath}/target/.*`),
      /.*\.ProjectImports\.zip/,
    ]),
    extraNodeModules: modules.reduce((acc, name) => ({
        ...acc,
        [name]: path.join(__dirname, 'node_modules', name)
    }), {})
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // This fixes the 'missing-asset-registry-path` error (see https://github.com/microsoft/react-native-windows/issues/11437)
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
