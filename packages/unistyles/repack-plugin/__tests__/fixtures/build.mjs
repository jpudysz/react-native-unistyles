// Builds a fixture of workspace.ts with Rspack and UnistylesPlugin from repack-plugin/index.js, runs the bundles in Node
// and prints what they got as JSON: node build.mjs <fixture root> <app | federation> [--without-plugin]
//
// A child process, because @rspack/core is ESM only and Jest runs CommonJS
import { rspack } from '@rspack/core'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const { UnistylesPlugin } = require(path.join(packageRoot, 'repack-plugin', 'index.js'))

const [root, scenario, ...flags] = process.argv.slice(2)
const withPlugin = !flags.includes('--without-plugin')
const unistylesRoot = path.join(root, 'node_modules', 'react-native-unistyles')

// what Re.Pack's ModuleFederationPluginV2 shares by default and what an app with Unistyles adds
const shared = Object.fromEntries(
    [
        'react',
        'react-native',
        'react-native/',
        '@react-native/',
        'react-native-unistyles',
        'react-native-unistyles/',
    ].map((name) => [name, { singleton: true, eager: true, requiredVersion: '*' }]),
)

const createConfig = (name, config) => ({
    name,
    context: root,
    mode: 'development',
    devtool: false,
    // the bundles run in Node
    target: 'async-node',
    optimization: { minimize: false },
    infrastructureLogging: { level: 'error' },
    // like Re.Pack's, for a platform without package.json#exports
    resolve: {
        mainFields: ['react-native', 'browser', 'main'],
        exportsFields: [],
        extensions: [
            '.ios.ts',
            '.native.ts',
            '.ts',
            '.ios.tsx',
            '.native.tsx',
            '.tsx',
            '.ios.js',
            '.native.js',
            '.js',
            '.json',
        ],
    },
    // plain CommonJS in .ts files
    module: { rules: [{ test: /\.ts$/, type: 'javascript/auto' }] },
    plugins: [...(withPlugin ? [new UnistylesPlugin(unistylesRoot)] : []), ...config.plugins],
    entry: config.entry,
    output: { path: path.join(root, 'dist', name), clean: true, ...config.output },
})

const build = async (config) => {
    const compiler = rspack(config)
    const stats = await new Promise((resolve, reject) =>
        compiler.run((error, result) => (error ? reject(error) : resolve(result))),
    )
    const {
        modules = [],
        errors = [],
        warnings = [],
    } = stats.toJson({ all: false, modules: true, errors: true, warnings: true })

    await new Promise((resolve) => compiler.close(resolve))

    return {
        // files of the bundle, relative to the fixture
        modules: modules
            .map((module) => module.nameForCondition)
            .filter(Boolean)
            .map((file) => path.relative(root, file.split('?')[0]).split(path.sep).join('/'))
            .sort(),
        errors: errors.map((error) => error.message),
        warnings: warnings.map((warning) => warning.message),
    }
}

// functions are components: their markers are enough, a function can't be printed
const serialize = (value) =>
    typeof value === 'function' || (value && typeof value === 'object')
        ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serialize(entry)]))
        : value

const globals = () => ({
    reactNativeLoads: globalThis.fixtureRnLoads ?? 0,
    registries: globalThis.fixtureRegistries ?? [],
})

const result = {}

if (scenario === 'app') {
    result.app = await build(
        createConfig('app', {
            entry: { main: './app/index.js' },
            output: { library: { type: 'commonjs2' } },
            plugins: [],
        }),
    )
    result.exports = serialize(require(path.join(root, 'dist', 'app', 'main.js')))
}

if (scenario === 'federation') {
    const { ModuleFederationPluginV1 } = rspack.container
    const remoteEntry = path.join(root, 'dist', 'remote', 'remoteEntry.js')

    result.remote = await build(
        createConfig('remote', {
            entry: { main: './remote/index.js' },
            output: {},
            plugins: [
                new ModuleFederationPluginV1({
                    name: 'remote',
                    filename: 'remoteEntry.js',
                    library: { type: 'commonjs-module' },
                    exposes: { './Screen': './remote/Screen.js' },
                    shared,
                }),
            ],
        }),
    )
    result.host = await build(
        createConfig('host', {
            entry: { main: './host/index.js' },
            output: { library: { type: 'commonjs2' } },
            plugins: [
                new ModuleFederationPluginV1({
                    name: 'host',
                    remoteType: 'commonjs-module',
                    remotes: { remote: remoteEntry },
                    shared,
                }),
            ],
        }),
    )
    result.exports = serialize(await require(path.join(root, 'dist', 'host', 'main.js')))
}

result.globals = globals()

process.stdout.write(JSON.stringify(result))
