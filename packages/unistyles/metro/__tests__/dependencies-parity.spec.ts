// react-native-unistyles/metro runs no Babel transform, Unistyles records the dependencies of StyleSheets while they run.
// The Babel plugin's own test cases are the reference: every StyleSheet of every case runs through both,
// and the runtime has to find every dependency the Babel plugin attaches to a style
import { transformSync, type TransformOptions } from '@babel/core'
import fs from 'node:fs'
import path from 'node:path'

import plugin from '../../plugin/src/index'
import { UnistyleDependency } from '../../src/specs/NativePlatform/NativePlatform.nitro'
import { createTrackedMiniRuntime, MINI_RUNTIME_DEPENDENCIES, trackDependencies } from '../../src/web/dependencyTracker'

type PluginTesterCase = {
    title: string
    code: string
    pluginOptions?: object
    babelOptions?: TransformOptions
}

type PluginTesterConfig = {
    pluginOptions: object
    babelOptions: TransformOptions
    tests: Array<PluginTesterCase>
}

type Case = PluginTesterCase & { spec: string; config: PluginTesterConfig }

const mockCases: Array<Case> = []
let mockSpec = ''

jest.mock('babel-plugin-tester', () => ({
    pluginTester: (config: PluginTesterConfig) => {
        config.tests.forEach((test) => mockCases.push({ ...test, spec: mockSpec, config }))
    },
}))

const SPECS = [
    'conditionalDependencies',
    'dependencies',
    'hostComponents',
    'imports',
    'stylesheet',
    'userImports',
    'variants',
]

// only the plugin tester cases, the specs' own tests run in their files
const { describe: jestDescribe, it: jestIt } = globalThis

Object.assign(globalThis, { describe: () => {}, it: () => {} })
SPECS.forEach((spec) => {
    mockSpec = spec
    require(`../../plugin/__tests__/${spec}.spec`)
})
Object.assign(globalThis, { describe: jestDescribe, it: jestIt })

const UNISTYLES_ROOT = path.join(__dirname, '../..')
// inside the Babel plugin's `root` (its paths are relative to Babel's root, the working directory)
const APP_FILE = path.join(UNISTYLES_ROOT, 'src', 'fixture.tsx')
const RN_PRESET = require.resolve('@react-native/babel-preset')

// any value: callable, readable at any depth, a number in comparisons and templates
const anything = (): any =>
    new Proxy(() => {}, {
        get: (_, property) => {
            if (property === Symbol.toPrimitive) {
                return () => 1
            }

            // not a thenable and not an ES module, so interop helpers keep it as is
            if (property === 'then' || property === '__esModule') {
                return undefined
            }

            return anything()
        },
        apply: () => anything(),
    })

// two mini runtimes with opposite values, so both branches of a condition run
const createMiniRuntime = (flipped: boolean) => ({
    themeName: flipped ? 'dark' : 'light',
    breakpoint: flipped ? 'xl' : 'xs',
    hasAdaptiveThemes: flipped,
    colorScheme: flipped ? 'dark' : 'light',
    screen: { width: flipped ? 1200 : 320, height: 800 },
    contentSizeCategory: flipped ? 'Large' : 'Medium',
    insets: { top: flipped ? 0 : 47, bottom: flipped ? 0 : 34, left: 0, right: 0, ime: flipped ? 0 : 300 },
    pixelRatio: flipped ? 3 : 1,
    fontScale: flipped ? 2 : 1,
    rtl: flipped,
    statusBar: { width: 0, height: flipped ? 0 : 47 },
    navigationBar: { width: 0, height: flipped ? 0 : 24 },
    isPortrait: !flipped,
    isLandscape: flipped,
})

// arguments for dynamic functions: truthy, falsy and every literal the case compares with (eg. `size === 10`),
// at runtime a branch records its reads when the app calls the function with its value
const getArguments = (code: string) => [
    [anything(), anything()],
    [false, 0],
    ...Array.from(code.matchAll(/===?\s*(-?\d+(?:\.\d+)?|'[^']*'|"[^"]*")/g)).map(([, literal]) => [
        JSON.parse(literal!.replace(/'/g, '"')),
    ]),
]

type StyleSheetDependencies = Map<string, Set<UnistyleDependency>>

const add = (dependencies: StyleSheetDependencies, key: string, values: Iterable<UnistyleDependency>) => {
    const set = dependencies.get(key) ?? new Set()

    Array.from(values).forEach((value) => set.add(value))
    dependencies.set(key, set)
}

// runs the module, every `X.create(...)` call is handed to `create`
const run = (code: string, babelOptions: TransformOptions, create: (stylesheet: unknown) => void) => {
    const result = transformSync(code, {
        babelrc: false,
        configFile: false,
        filename: APP_FILE,
        parserOpts: babelOptions.parserOpts,
        presets: [RN_PRESET],
    })
    const StyleSheet = new Proxy(
        {},
        {
            get: (_, property) =>
                property === 'create'
                    ? (stylesheet: unknown) => {
                          create(stylesheet)

                          return anything()
                      }
                    : anything(),
        },
    )
    // a StyleSheet may come from any module, eg. re-exported by the app
    const anyModule = new Proxy({}, { get: (_, property) => (property === 'StyleSheet' ? StyleSheet : anything()) })
    const module = { exports: {} }

    // Babel's helpers are real, every other module is the app's or a library's
    const requireModule = (name: string) => (name.startsWith('@babel/runtime/') ? require(name) : anyModule)

    new Function('require', 'module', 'exports', result?.code ?? '')(requireModule, module, module.exports)
}

const forEachStyle = (
    stylesheet: unknown,
    callStylesheet: (fn: Function, flipped: boolean) => Record<string, unknown>,
    visit: (key: string, value: unknown, call: <T>(fn: () => T) => T) => void,
) => {
    ;[false, true].forEach((flipped) => {
        const styles = typeof stylesheet === 'function' ? callStylesheet(stylesheet, flipped) : stylesheet

        Object.entries(styles as Record<string, unknown>).forEach(([key, value]) => visit(key, value, (fn) => fn()))
    })
}

const getStyleResults = (value: unknown, call: (fn: () => unknown) => unknown, code: string) =>
    typeof value === 'function'
        ? getArguments(code).map((args) => {
              try {
                  return call(() => value(...args))
              } catch {
                  return undefined
              }
          })
        : [value]

// what the Babel plugin attaches, read from the transformed code
const getBabelDependencies = (testCase: Case) => {
    const babelOptions = { ...testCase.config.babelOptions, ...testCase.babelOptions }
    const transformed =
        transformSync(testCase.code, {
            babelrc: false,
            configFile: false,
            filename: APP_FILE,
            ...babelOptions,
            plugins: [
                ...(babelOptions.plugins ?? []),
                [plugin, { ...testCase.config.pluginOptions, ...testCase.pluginOptions }],
            ],
        })?.code ?? ''
    const stylesheets: Array<StyleSheetDependencies> = []

    run(transformed, babelOptions, (stylesheet) => {
        const dependencies: StyleSheetDependencies = new Map()

        forEachStyle(
            stylesheet,
            (fn, flipped) => fn(anything(), createMiniRuntime(flipped)),
            (key, value) => {
                getStyleResults(value, (fn) => fn(), testCase.code).forEach((result) => {
                    const babelDependencies = (result as { uni__dependencies?: Array<UnistyleDependency> } | undefined)
                        ?.uni__dependencies

                    add(dependencies, key, babelDependencies ?? [])
                })
            },
        )
        stylesheets.push(dependencies)
    })

    return stylesheets
}

// what Unistyles records without the Babel plugin, the same rules as the native parser
const getRuntimeDependencies = (testCase: Case) => {
    const babelOptions = { ...testCase.config.babelOptions, ...testCase.babelOptions }
    const stylesheets: Array<StyleSheetDependencies> = []

    run(testCase.code, babelOptions, (stylesheet) => {
        const dependencies: StyleSheetDependencies = new Map()
        const stylesheetDependencies = new Set<UnistyleDependency>()

        forEachStyle(
            stylesheet,
            (fn, flipped) => {
                const { result, dependencies: read } = trackDependencies(() =>
                    fn(anything(), createTrackedMiniRuntime(createMiniRuntime(flipped) as never)),
                )

                // every StyleSheet function receives the theme
                read.concat(UnistyleDependency.Theme).forEach((dependency) => stylesheetDependencies.add(dependency))

                return result
            },
            (key, value) => {
                add(dependencies, key, [])
                getStyleResults(
                    value,
                    (fn) => {
                        const { result, dependencies: read } = trackDependencies(fn)

                        add(dependencies, key, read)

                        return result
                    },
                    testCase.code,
                ).forEach((result) => {
                    // a style with variants depends on them
                    if (result && typeof result === 'object' && 'variants' in result) {
                        add(dependencies, key, [UnistyleDependency.Variants])
                    }
                })
            },
        )
        dependencies.forEach((_, key) => add(dependencies, key, stylesheetDependencies))
        stylesheets.push(dependencies)
    })

    return stylesheets
}

const toNames = (dependencies: Iterable<UnistyleDependency>) =>
    Array.from(dependencies)
        .map((dependency) => UnistyleDependency[dependency])
        .sort()

describe('react-native-unistyles/metro finds the dependencies of the Babel plugin', () => {
    it('should run every test case of the Babel plugin', () => {
        expect(new Set(mockCases.map((testCase) => testCase.spec))).toEqual(new Set(SPECS))
        expect(mockCases.length).toBeGreaterThanOrEqual(50)
    })

    it('should find dependencies in most of the cases', () => {
        const withDependencies = mockCases.filter((testCase) =>
            getBabelDependencies(testCase).some((stylesheet) =>
                Array.from(stylesheet.values()).some((dependencies) => dependencies.size > 0),
            ),
        )

        expect(withDependencies.length).toBeGreaterThanOrEqual(25)
    })

    describe.each(mockCases.map((testCase) => [`${testCase.spec}: ${testCase.title}`, testCase] as const))(
        '%s',
        (_, testCase) => {
            it('should record every dependency the Babel plugin attaches', () => {
                const babel = getBabelDependencies(testCase)
                const runtime = getRuntimeDependencies(testCase)

                expect(runtime.length).toBe(babel.length)

                babel.forEach((stylesheet, index) => {
                    stylesheet.forEach((dependencies, key) => {
                        const recorded = toNames(runtime[index]?.get(key) ?? [])

                        expect({
                            key,
                            missing: toNames(dependencies).filter((name) => !recorded.includes(name)),
                        }).toEqual({ key, missing: [] })
                    })
                })
            })
        },
    )
})

describe('native and web mini runtimes', () => {
    // C++ can't run here, its table is read from the source
    const source = fs.readFileSync(path.join(UNISTYLES_ROOT, 'cxx', 'core', 'DependencyTracker.h'), 'utf8')
    const nativeTable = Object.fromEntries(
        Array.from(source.matchAll(/\{"(\w+)", UnistyleDependency::(\w+)\}/g)).map(([, property, dependency]) => [
            property,
            dependency,
        ]),
    )

    it('should map the same properties to the same dependencies', () => {
        const { ime, ...native } = nativeTable
        const web = Object.fromEntries(
            Object.entries(MINI_RUNTIME_DEPENDENCIES).map(([property, dependency]) => [
                property,
                UnistyleDependency[dependency!]!.toUpperCase(),
            ]),
        )

        expect(native).toEqual(web)
        expect(ime).toBe('IME')
        // the other insets fall back to Insets on both
        expect(source).toContain('insetsDependencies, UnistyleDependency::INSETS')
    })

    it('should cover every property of the mini runtime', () => {
        const properties = Object.keys(createMiniRuntime(false)).filter((property) => property !== 'insets')

        expect(Object.keys(MINI_RUNTIME_DEPENDENCIES).sort()).toEqual(properties.sort())
    })
})
