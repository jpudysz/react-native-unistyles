declare const __dirname: string

const { readdirSync, readFileSync } = jest.requireActual('fs') as {
    readdirSync(path: string): Array<string>
    readFileSync(path: string, encoding: 'utf8'): string
}
const { join, resolve, sep } = jest.requireActual('path') as {
    join(...parts: Array<string>): string
    resolve(...parts: Array<string>): string
    sep: string
}

type ExportsTarget = string | { [condition: string]: ExportsTarget }

const PACKAGE_ROOT = join(__dirname, '../..')
const SOURCE_DIR = join(PACKAGE_ROOT, 'src')
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const { exports: packageExports } = readJson(join(PACKAGE_ROOT, 'package.json')) as {
    exports: Record<string, ExportsTarget>
}

// Node and Metro pick the first key of a conditions object that the bundler asserts, the order of the asserted names doesn't matter
const resolveConditions = (target: ExportsTarget, conditions: ReadonlyArray<string>): string | undefined => {
    if (typeof target === 'string') {
        return target
    }

    for (const [condition, value] of Object.entries(target)) {
        const resolved = conditions.includes(condition) ? resolveConditions(value, conditions) : undefined

        if (resolved !== undefined) {
            return resolved
        }
    }

    return undefined
}

// Metro asserts `import` or `require` from the import kind, Expo adds `react-native` (native) or `browser` (web),
// @react-native/metro-config adds `react-native` on every platform, so its web builds assert `browser` and `react-native`
const NATIVE = [
    ['import', ['default', 'import', 'react-native']],
    ['require', ['default', 'require', 'react-native']],
] as const
const WEB = [
    ['import', ['default', 'import', 'browser']],
    ['require', ['default', 'require', 'browser']],
    ['import (React Native Metro config)', ['default', 'import', 'react-native', 'browser']],
    ['require (React Native Metro config)', ['default', 'require', 'react-native', 'browser']],
] as const

const platformEntries = Object.entries(packageExports).filter(
    (entry): entry is [string, Record<string, ExportsTarget>] =>
        typeof entry[1] === 'object' && 'react-native' in entry[1],
)

// Metro falls back to these package.json files when an exports target has no file, eg. `./src/components/native/*`
const stubDirs = [
    ...readdirSync(join(PACKAGE_ROOT, 'components/native')).map((name) => `components/native/${name}`),
    'server',
    'web',
    'reanimated',
    'diagnostics',
]

describe('package exports', () => {
    it('should have entries with platform conditions', () => {
        expect(platformEntries.map(([subpath]) => subpath)).toEqual(
            expect.arrayContaining(['.', './mocks', './components/native/*', './reanimated']),
        )
    })

    // #1306: `import` before `react-native` bundled lib/module for the app and src for the components the Babel plugin inserts,
    // two copies of Unistyles with their own ScopedThemeContext
    describe.each(NATIVE)('native %s', (_, conditions) => {
        it.each(platformEntries)('should resolve %s to src', (_subpath, target) => {
            expect(resolveConditions(target, conditions)).toBe(target['react-native'])
            expect(target['react-native']).toMatch(/^\.\/src\//)
        })
    })

    describe.each(WEB)('web %s', (_, conditions) => {
        it.each(platformEntries)('should resolve %s to lib/module', (_subpath, target) => {
            expect(resolveConditions(target, conditions)).toBe(target.browser)
            expect(target.browser).toMatch(/^\.\/lib\/module\//)
        })
    })

    it.each(stubDirs)('should point the react-native field of %s/package.json to src', (stubDir) => {
        const stub = readJson(join(PACKAGE_ROOT, stubDir, 'package.json')) as { 'react-native': string }

        expect(resolve(PACKAGE_ROOT, stubDir, stub['react-native']).startsWith(`${SOURCE_DIR}${sep}`)).toBe(true)
    })
})

// a module, the helpers above don't clash with the globals of other spec files
export {}
