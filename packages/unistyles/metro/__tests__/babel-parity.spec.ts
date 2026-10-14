// react-native-unistyles/metro must behave like the Babel plugin. The Babel plugin's own test cases are the reference:
// every case runs through both, the StyleSheet code has to match and every import the Babel plugin swaps
// has to reach the same Unistyles component through the Metro resolver
import { type PluginItem, transformSync, type TransformOptions } from '@babel/core'
import path from 'node:path'

import plugin from '../../plugin/src/index'
import { createResolveRequest } from '../src/resolver'

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

const SPECS = ['dependencies', 'hostComponents', 'imports', 'stylesheet', 'userImports', 'variants']

SPECS.forEach((spec) => {
    mockSpec = spec
    require(`../../plugin/__tests__/${spec}.spec`)
})

const UNISTYLES_ROOT = path.join(__dirname, '../..')
// inside the Babel plugin's `root` (its paths are relative to Babel's root, the working directory)
const APP_FILE = path.join(UNISTYLES_ROOT, 'src', 'fixture.tsx')
const COMPONENTS_PATH = 'react-native-unistyles/components/native/'

const isSwappedSource = (source: string) =>
    source === 'react-native' || source.startsWith('react-native/Libraries/') || source.startsWith(COMPONENTS_PATH)

const transform = (code: string, babelOptions: TransformOptions, plugins: Array<PluginItem>) =>
    transformSync(code, {
        babelrc: false,
        configFile: false,
        filename: APP_FILE,
        ...babelOptions,
        plugins: [...(babelOptions.plugins ?? []), ...plugins],
    })?.code ?? ''

const transformWithBabel = (testCase: Case) =>
    transform(testCase.code, { ...testCase.config.babelOptions, ...testCase.babelOptions }, [
        [plugin, { ...testCase.config.pluginOptions, ...testCase.pluginOptions }],
    ])

// what react-native-unistyles/metro runs, it has no options to configure
const transformWithMetro = (testCase: Case) =>
    transform(testCase.code, { ...testCase.config.babelOptions, ...testCase.babelOptions }, [
        [plugin, { debug: false, isMetro: true }],
    ])

type ImportBinding = { source: string; imported: string }

// local name -> where it's imported from
const getImports = (code: string, babelOptions: TransformOptions) => {
    const imports = new Map<string, ImportBinding>()

    transform(code, babelOptions, [
        () => ({
            visitor: {
                ImportDeclaration(declaration: any) {
                    if (declaration.node.importKind === 'type') {
                        return
                    }

                    declaration.node.specifiers.forEach((specifier: any) => {
                        if (specifier.importKind === 'type') {
                            return
                        }

                        imports.set(specifier.local.name, {
                            source: declaration.node.source.value,
                            imported:
                                specifier.type === 'ImportSpecifier'
                                    ? (specifier.imported.name ?? specifier.imported.value)
                                    : 'default',
                        })
                    })
                },
            },
        }),
    ])

    return imports
}

// the swapped imports are the only difference, the rest has to be the same code
const withoutSwappedImports = (code: string, babelOptions: TransformOptions) =>
    transform(code, { parserOpts: babelOptions.parserOpts, plugins: babelOptions.plugins }, [
        () => ({
            visitor: {
                ImportDeclaration(declaration: any) {
                    if (isSwappedSource(declaration.node.source.value)) {
                        declaration.remove()
                    }
                },
            },
        }),
    ])

describe('react-native-unistyles/metro matches the Babel plugin', () => {
    it('should run every test case of the Babel plugin', () => {
        expect(mockCases.length).toBeGreaterThanOrEqual(41)
        expect(new Set(mockCases.map((testCase) => testCase.spec))).toEqual(new Set(SPECS))
    })

    describe.each(mockCases.map((testCase) => [`${testCase.spec}: ${testCase.title}`, testCase] as const))(
        '%s',
        (_, testCase) => {
            const babelOptions = { ...testCase.config.babelOptions, ...testCase.babelOptions }

            it('should produce the same code, without the swapped imports', () => {
                const babel = withoutSwappedImports(transformWithBabel(testCase), babelOptions)
                const metro = withoutSwappedImports(transformWithMetro(testCase), babelOptions)

                expect(metro).toEqual(babel)
            })

            it('should leave the imports to the Metro resolver', () => {
                const imports = getImports(testCase.code, babelOptions)
                const metroImports = getImports(transformWithMetro(testCase), babelOptions)

                expect(metroImports).toEqual(imports)
            })

            it('should resolve every import the Babel plugin swaps to the same Unistyles component', () => {
                const imports = getImports(testCase.code, babelOptions)
                const babelImports = getImports(transformWithBabel(testCase), babelOptions)

                babelImports.forEach((babelImport, localName) => {
                    if (!babelImport.source.startsWith(COMPONENTS_PATH)) {
                        return
                    }

                    const original = imports.get(localName)

                    expect(original).toBeDefined()
                    expect(resolveWithMetro(original!)).toBe(
                        unistylesComponent(babelImport.source.replace(COMPONENTS_PATH, ''), babelImport.imported),
                    )
                })
            })
        },
    )
})

// every Unistyles component is mocked with a marker, so the test reads which one an import resolves to
const COMPONENTS_DIR = path.join(UNISTYLES_ROOT, 'src', 'components', 'native')
const COMPONENT_MODULES = [
    'ActivityIndicator',
    'Animated',
    'FlatList',
    'Image',
    'ImageBackground',
    'KeyboardAvoidingView',
    'NativeText',
    'NativeView',
    'Pressable',
    'RefreshControl',
    'SafeAreaView',
    'ScrollView',
    'SectionList',
    'Switch',
    'Text',
    'TextInput',
    'TouchableHighlight',
    'TouchableOpacity',
    'View',
    'VirtualizedList',
]

const unistylesComponent = (module: string, name: string) => `unistyles:${module}.${name === 'default' ? module : name}`

COMPONENT_MODULES.forEach((module) => {
    jest.doMock(path.join(COMPONENTS_DIR, module), () => ({
        [module]: unistylesComponent(module, module),
        default: unistylesComponent(module, module),
    }))
})

// the real modules, as Metro resolves them for a file of the app
const APP_ORIGIN = '/project/src/App.tsx'
const REACT_NATIVE = '/project/node_modules/react-native'
const upstream = (_: unknown, moduleName: string) => ({
    type: 'sourceFile' as const,
    filePath: moduleName === 'react-native' ? `${REACT_NATIVE}/index.js` : `/project/node_modules/${moduleName}.js`,
})

jest.doMock('react-native', () => ({ Platform: 'react-native:Platform', View: 'react-native:View' }))
jest.doMock(
    'react-native/Libraries/Text/TextNativeComponent',
    () => ({ NativeText: 'react-native:NativeText', NativeVirtualText: 'react-native:NativeVirtualText' }),
    { virtual: true },
)
jest.doMock(
    'react-native/Libraries/Components/View/ViewNativeComponent',
    () => ({ __esModule: true, default: 'react-native:ViewNativeComponent', Commands: 'react-native:Commands' }),
    { virtual: true },
)

const resolveRequest = createResolveRequest({ unistylesRoot: UNISTYLES_ROOT, upstream })

const resolveWithMetro = ({ source, imported }: ImportBinding) => {
    const resolution = resolveRequest({ originModulePath: APP_ORIGIN, resolveRequest: upstream }, source, 'ios') as {
        filePath: string
    }

    return require(resolution.filePath)[imported]
}
