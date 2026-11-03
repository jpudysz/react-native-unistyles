// a fake React Native + Unistyles workspace the specs build with Rspack, see build.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const NEXT_ID = 'const nextId = () => (globalThis.fixtureLastId = (globalThis.fixtureLastId || 0) + 1)'

// what every package, the app and Unistyles itself report about the react-native they got
const PROBE = `
const RN = require('react-native')

module.exports = {
    View: RN.View,
    Text: RN.Text,
    Platform: RN.Platform,
    DeepView: require('react-native/Libraries/Components/View/View').default,
    PixelRatio: require('react-native/Libraries/Utilities/PixelRatio'),
}
`

const packageJson = (name: string, fields: Record<string, unknown> = {}) =>
    JSON.stringify({ name, version: '1.0.0', main: 'index.js', ...fields })

const reactNative = (): Record<string, string> => ({
    'node_modules/react/package.json': packageJson('react', { version: '19.0.0' }),
    'node_modules/react/index.js': `module.exports = { version: '19.0.0' }`,
    'node_modules/react-native/package.json': packageJson('react-native', { version: '0.88.0' }),
    // like the real one: the components are lazy, Platform is an object
    'node_modules/react-native/index.js': `
globalThis.fixtureRnLoads = (globalThis.fixtureRnLoads || 0) + 1
require('react')

module.exports = {
    get View() { return require('./Libraries/Components/View/View').default },
    get Text() { return require('./Libraries/Text/Text').default },
    Platform: { OS: 'ios' },
}
`,
    ...Object.fromEntries(
        [
            ['Components/View/View', 'View'],
            ['Text/Text', 'Text'],
        ].map(([file, name]) => [
            `node_modules/react-native/Libraries/${file}.js`,
            `
${NEXT_ID}
function RN${name}() {}
RN${name}.kind = 'rn'
RN${name}.id = nextId()
module.exports = { __esModule: true, default: RN${name} }
`,
        ]),
    ),
    'node_modules/react-native/Libraries/Utilities/PixelRatio.js': `module.exports = { kind: 'rn-pixelratio' }`,
    // a module of react-native that imports react-native
    'node_modules/react-native/Libraries/Probe.js': PROBE,
})

// libraries and tooling that import react-native
const packages = (): Record<string, string> => ({
    'node_modules/some-library/package.json': packageJson('some-library'),
    'node_modules/some-library/index.js': PROBE,
    'node_modules/@react-native/virtualized-lists/package.json': packageJson('@react-native/virtualized-lists'),
    'node_modules/@react-native/virtualized-lists/index.js': PROBE,
    'node_modules/@callstack/repack/package.json': packageJson('@callstack/repack'),
    'node_modules/@callstack/repack/index.js': PROBE,
    'node_modules/@module-federation/runtime-tools/package.json': packageJson('@module-federation/runtime-tools'),
    'node_modules/@module-federation/runtime-tools/index.js': PROBE,
})

// same files as the real src, plain CommonJS
// the builds import the same modules, but the content tells which one the bundle got
const unistyles = (): Record<string, string> => {
    const root = 'node_modules/react-native-unistyles'
    const files: Record<string, string> = {
        [`${root}/package.json`]: packageJson('react-native-unistyles', {
            main: 'lib/commonjs/index.js',
            browser: 'lib/module/index.js',
        }),
        [`${root}/src/index.ts`]: `
exports.source = 'src'
exports.StyleSheet = require('./core/registry').registry
`,
        // an entry point of Unistyles, like the `browser` condition on the web it leads to lib/module
        [`${root}/reanimated/package.json`]: JSON.stringify({
            main: '../lib/commonjs/reanimated/index.js',
            browser: '../lib/module/reanimated/index.js',
        }),
        [`${root}/src/reanimated/index.ts`]: `
${NEXT_ID}
exports.id = nextId()
exports.source = 'src'
`,
        // Unistyles imports react-native like any other package, but it gets the real one
        [`${root}/src/probe.ts`]: PROBE,
        // StyleSheet is a registry of the whole bundle
        [`${root}/src/core/registry.ts`]: `
${NEXT_ID}
const registry = {
    id: nextId(),
    source: 'src',
    trackDependencies: require('./trackDependencies').TRACK_DEPENDENCIES,
    trackDependenciesFromSpecs: require('../specs/StyleSheet').TRACK_DEPENDENCIES,
}

globalThis.fixtureRegistries = (globalThis.fixtureRegistries || []).concat(registry.id)
exports.registry = registry
`,
        [`${root}/src/specs/StyleSheet/index.ts`]: `exports.TRACK_DEPENDENCIES = require('../../core/trackDependencies').TRACK_DEPENDENCIES`,
        [`${root}/src/core/trackDependencies.ts`]: `exports.TRACK_DEPENDENCIES = false`,
        [`${root}/src/core/trackDependencies.metro.ts`]: `exports.TRACK_DEPENDENCIES = true`,
        [`${root}/src/core/index.ts`]: `
${NEXT_ID}
const { registry } = require('./registry')

exports.createUnistylesElement = (Component) => {
    function Unistyled() {}

    Unistyled.kind = 'unistyles'
    Unistyled.id = nextId()
    Unistyled.inner = Component
    Unistyled.registryId = registry.id

    return Unistyled
}
`,
        // like src/components/native/index.ts: every export of react-native, the components swapped lazily
        [`${root}/src/components/native/index.ts`]: `
const ReactNative = require('react-native')
const UNISTYLES_COMPONENTS = {
    View: () => require('./View').View,
    Text: () => require('./Text').Text,
}

new Set(Object.keys(ReactNative).concat(Object.keys(UNISTYLES_COMPONENTS))).forEach((name) => {
    Object.defineProperty(module.exports, name, {
        enumerable: true,
        get: UNISTYLES_COMPONENTS[name] || (() => ReactNative[name]),
    })
})
`,
    }

    for (const name of ['View', 'Text']) {
        files[`${root}/src/components/native/${name}.ts`] = `
const { ${name}: Native${name} } = require('react-native')
const { createUnistylesElement } = require('../../core')

exports.${name} = createUnistylesElement(Native${name})
`
        files[`${root}/src/components/native/deep/${name}.ts`] = `
exports.${name} = exports.default = require('../${name}').${name}
`
    }

    // a build of the same modules, the plugin swaps it for src
    for (const build of ['module', 'commonjs']) {
        files[`${root}/lib/${build}/index.js`] = `
exports.source = 'lib/${build}'
exports.StyleSheet = require('./core/registry').registry
`
        files[`${root}/lib/${build}/core/registry.js`] = `
exports.registry = { id: 'lib/${build}', source: 'lib/${build}', trackDependencies: false }
`
        files[`${root}/lib/${build}/reanimated/index.js`] = `
exports.id = 'lib/${build}'
exports.source = 'lib/${build}'
`
    }

    return files
}

// what the app imports and re-exports for the specs, it's not a real app: it covers every kind of importer
const app = (): Record<string, string> => ({
    'app/probe.js': PROBE,
    'app/esm.js': `
import { View, Platform } from 'react-native'

export { View, Platform }
`,
    'app/index.js': `
const RN = require('react-native')
const unistyles = require('react-native-unistyles')

module.exports = {
    app: require('./probe'),
    esm: require('./esm'),
    library: require('some-library'),
    reactNative: require('react-native/Libraries/Probe'),
    reactNativePackage: require('@react-native/virtualized-lists'),
    repack: require('@callstack/repack'),
    moduleFederation: require('@module-federation/runtime-tools'),
    unistyles: require('react-native-unistyles/src/probe'),
    unistylesRoot: { source: unistyles.source, StyleSheet: unistyles.StyleSheet },
    unistylesModuleBuild: require('react-native-unistyles/lib/module/core/registry').registry,
    unistylesCommonjsBuild: require('react-native-unistyles/lib/commonjs').StyleSheet,
    unistylesComponents: { View: RN.View, Text: RN.Text, Platform: RN.Platform },
}
`,
})

// a host that loads the remote through Module Federation
const federation = (): Record<string, string> => ({
    'host/index.js': `
const RN = require('react-native')
const { StyleSheet } = require('react-native-unistyles')

module.exports = import('remote/Screen').then((remote) => ({
    host: {
        ...require('../app/probe'),
        View: RN.View,
        StyleSheet,
        reanimated: require('react-native-unistyles/reanimated'),
        library: require('some-library'),
    },
    remote: remote.default || remote,
}))
`,
    'remote/Screen.js': `
const RN = require('react-native')
const { StyleSheet } = require('react-native-unistyles')

module.exports = {
    ...require('../app/probe'),
    View: RN.View,
    StyleSheet,
    reanimated: require('react-native-unistyles/reanimated'),
    library: require('some-library'),
}
`,
    'remote/index.js': `require('./Screen')`,
})

// writes the whole workspace to a temp directory, the caller removes it
export const createFixture = () => {
    // a real path, the plugin and Rspack compare real paths
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'unistyles-repack-')))
    const files = { ...reactNative(), ...packages(), ...unistyles(), ...app(), ...federation() }

    try {
        for (const [file, content] of Object.entries(files)) {
            const filePath = path.join(root, file)

            fs.mkdirSync(path.dirname(filePath), { recursive: true })
            fs.writeFileSync(filePath, content.trimStart())
        }
    } catch (error) {
        fs.rmSync(root, { recursive: true, force: true })

        throw error
    }

    return root
}
