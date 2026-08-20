'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const appRoot = path.resolve(__dirname, '..')
const packageRoot = path.resolve(__dirname, '../../../packages/unistyles')

const HELPER_SPECIFIER = 'react-native-unistyles/internal/server-unistyles-style'
const RESOURCES_SPECIFIER = 'react-native-unistyles/internal/server-style-resources'

const resolveWithNode = ({ conditions = [], esm = false, specifier }) => {
    const source = esm
        ? `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`
        : `console.log(require.resolve(${JSON.stringify(specifier)}))`
    const args = [
        ...conditions.flatMap(condition => ['--conditions', condition]),
        ...(esm ? ['--input-type=module'] : []),
        '-e',
        source,
    ]

    return execFileSync(process.execPath, args, {
        cwd: appRoot,
        encoding: 'utf8',
    }).trim()
}

const resolveFromCommonJsBuild = ({ conditions = [], specifier }) => {
    const origin = path.join(packageRoot, 'lib/commonjs/web/css/state.js')
    const source = `const { createRequire } = require('node:module'); console.log(createRequire(${JSON.stringify(origin)}).resolve(${JSON.stringify(specifier)}))`
    const args = [
        ...conditions.flatMap(condition => ['--conditions', condition]),
        '-e',
        source,
    ]

    return execFileSync(process.execPath, args, {
        cwd: appRoot,
        encoding: 'utf8',
    }).trim()
}

const expectTarget = ({ conditions, esm, expected, specifier }) => {
    const resolved = resolveWithNode({ conditions, esm, specifier })

    assert.ok(
        resolved.endsWith(expected),
        `${specifier} resolved to ${resolved}, expected a target ending in ${expected}`,
    )
}

const resolutionCases = [
    {
        expected: '/lib/commonjs/core/ServerUnistylesStyle.noop.js',
        specifier: HELPER_SPECIFIER,
    },
    {
        conditions: ['react-server'],
        expected: '/lib/commonjs/core/ServerUnistylesStyle.js',
        specifier: HELPER_SPECIFIER,
    },
    {
        esm: true,
        expected: '/lib/module/core/ServerUnistylesStyle.noop.js',
        specifier: HELPER_SPECIFIER,
    },
    {
        conditions: ['react-server'],
        esm: true,
        expected: '/lib/module/core/ServerUnistylesStyle.js',
        specifier: HELPER_SPECIFIER,
    },
    {
        conditions: ['react-native'],
        expected: '/src/core/ServerUnistylesStyle.noop.ts',
        specifier: HELPER_SPECIFIER,
    },
    {
        conditions: ['react-server', 'react-native'],
        expected: '/src/core/ServerUnistylesStyle.noop.ts',
        specifier: HELPER_SPECIFIER,
    },
    {
        expected: '/lib/commonjs/web/css/serverStyleResources.noop.js',
        specifier: RESOURCES_SPECIFIER,
    },
    {
        conditions: ['react-server'],
        expected: '/lib/commonjs/web/css/serverStyleResources.js',
        specifier: RESOURCES_SPECIFIER,
    },
    {
        esm: true,
        expected: '/lib/module/web/css/serverStyleResources.noop.js',
        specifier: RESOURCES_SPECIFIER,
    },
    {
        conditions: ['react-server'],
        esm: true,
        expected: '/lib/module/web/css/serverStyleResources.js',
        specifier: RESOURCES_SPECIFIER,
    },
    {
        conditions: ['react-native'],
        expected: '/src/web/css/serverStyleResources.noop.ts',
        specifier: RESOURCES_SPECIFIER,
    },
    {
        conditions: ['react-server', 'react-native'],
        expected: '/src/web/css/serverStyleResources.noop.ts',
        specifier: RESOURCES_SPECIFIER,
    },
]

resolutionCases.forEach(expectTarget)

assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles' }).endsWith('/lib/commonjs/index.js'),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles/mocks' }).endsWith('/lib/commonjs/mocks.js'),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles/components/native/View' }).endsWith(
        '/lib/commonjs/components/native/View.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles/server' }).endsWith(
        '/lib/commonjs/server/index.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles/web' }).endsWith('/lib/commonjs/web-only/index.js'),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: 'react-native-unistyles/reanimated' }).endsWith(
        '/lib/commonjs/reanimated/index.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: HELPER_SPECIFIER }).endsWith(
        '/lib/commonjs/core/ServerUnistylesStyle.noop.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({ conditions: ['react-server'], specifier: HELPER_SPECIFIER }).endsWith(
        '/lib/commonjs/core/ServerUnistylesStyle.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({
        conditions: ['react-server', 'react-native'],
        specifier: HELPER_SPECIFIER,
    }).endsWith('/lib/commonjs/core/ServerUnistylesStyle.noop.js'),
)
assert.ok(
    resolveFromCommonJsBuild({ specifier: RESOURCES_SPECIFIER }).endsWith(
        '/lib/commonjs/web/css/serverStyleResources.noop.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({ conditions: ['react-server'], specifier: RESOURCES_SPECIFIER }).endsWith(
        '/lib/commonjs/web/css/serverStyleResources.js',
    ),
)
assert.ok(
    resolveFromCommonJsBuild({
        conditions: ['react-server', 'react-native'],
        specifier: RESOURCES_SPECIFIER,
    }).endsWith('/lib/commonjs/web/css/serverStyleResources.noop.js'),
)

assert.equal(require(HELPER_SPECIFIER).getServerUnistylesStyle([]), null)
assert.equal(require(RESOURCES_SPECIFIER).createServerStyleResources(), undefined)

const legacyHelperPath = require.resolve(path.join(packageRoot, 'internal/server-unistyles-style'))
const legacyResourcesPath = require.resolve(path.join(packageRoot, 'internal/server-style-resources'))

assert.ok(legacyHelperPath.endsWith('/lib/commonjs/core/ServerUnistylesStyle.noop.js'))
assert.ok(legacyResourcesPath.endsWith('/lib/commonjs/web/css/serverStyleResources.noop.js'))
assert.equal(require(legacyHelperPath).getServerUnistylesStyle([]), null)
assert.equal(require(legacyResourcesPath).createServerStyleResources(), undefined)
