// src/components/native/index.ts replaces react-native for react-native-unistyles/metro,
// src/components/native/deep replaces the modules of single components
import path from 'node:path'

import { NATIVE_COMPONENTS_PATHS, REACT_NATIVE_COMPONENT_NAMES } from '../../plugin/src/consts'

const COMPONENTS_DIR = path.join(__dirname, '../../src/components/native')
const COMPONENT_MODULES = [...REACT_NATIVE_COMPONENT_NAMES, 'NativeText', 'NativeView']

const unistylesComponent = (module: string) => `unistyles:${module}`

// react-native exports getters, it loads a component on its first read
const mockReads: Array<string> = []
const mockReactNative = (names: Array<string>) =>
    Object.defineProperties(
        {},
        Object.fromEntries(
            names.map((name) => [
                name,
                {
                    enumerable: true,
                    get: () => {
                        mockReads.push(name)

                        return `react-native:${name}`
                    },
                },
            ]),
        ),
    )

const loadExports = (reactNativeExports: Array<string>) => {
    let exports: Record<string, unknown> = {}

    jest.isolateModules(() => {
        jest.doMock('react-native', () => mockReactNative(reactNativeExports))
        COMPONENT_MODULES.forEach((module) => {
            jest.doMock(path.join(COMPONENTS_DIR, module), () => ({
                [module]: unistylesComponent(module),
                default: unistylesComponent(module),
            }))
        })

        exports = require(path.join(COMPONENTS_DIR, 'index.ts'))
    })

    return exports
}

const REACT_NATIVE_EXPORTS = [
    'Platform',
    'StyleSheet',
    'useColorScheme',
    'View',
    'Text',
    'Modal',
    'unstable_NativeView',
]

describe('react-native replacement', () => {
    beforeEach(() => {
        mockReads.length = 0
    })

    it('should expose every export of react-native', () => {
        const exports = loadExports(REACT_NATIVE_EXPORTS)

        REACT_NATIVE_EXPORTS.forEach((name) => {
            expect(Object.keys(exports)).toContain(name)
        })
    })

    it('should read react-native lazily', () => {
        const exports = loadExports(REACT_NATIVE_EXPORTS)

        expect(mockReads).toEqual([])
        expect(exports.Platform).toBe('react-native:Platform')
        expect(exports.Modal).toBe('react-native:Modal')
        expect(mockReads).toEqual(['Platform', 'Modal'])
    })

    it.each(REACT_NATIVE_COMPONENT_NAMES)('should swap %s, like the Babel plugin', (name) => {
        expect(loadExports(REACT_NATIVE_EXPORTS)[name]).toBe(unistylesComponent(name))
    })

    it.each(NATIVE_COMPONENTS_PATHS.imports.filter((rule) => rule.path === 'react-native'))(
        'should swap $name for Unistyles $mapTo, like the Babel plugin',
        ({ name, mapTo }) => {
            expect(loadExports(REACT_NATIVE_EXPORTS)[name!]).toBe(unistylesComponent(mapTo))
        },
    )

    it('should add native components that react-native-web and React Native before 0.83 lack', () => {
        const exports = loadExports(['View', 'Text'])

        expect(exports.unstable_NativeView).toBe(unistylesComponent('NativeView'))
        expect(exports.unstable_NativeText).toBe(unistylesComponent('NativeText'))
    })

    it('should be CommonJS without __esModule, like react-native', () => {
        // a default import gets the whole module
        expect(loadExports(REACT_NATIVE_EXPORTS).__esModule).toBeUndefined()
    })
})

describe('deep imports', () => {
    const loadDeepImport = (name: string) => {
        let exports: Record<string, unknown> = {}

        jest.isolateModules(() => {
            COMPONENT_MODULES.forEach((module) => {
                jest.doMock(path.join(COMPONENTS_DIR, module), () => ({
                    [module]: unistylesComponent(module),
                }))
            })
            jest.doMock(
                'react-native/Libraries/Text/TextNativeComponent',
                () => ({ NativeText: 'react-native:NativeText', NativeVirtualText: 'react-native:NativeVirtualText' }),
                { virtual: true },
            )
            jest.doMock(
                'react-native/Libraries/Components/View/ViewNativeComponent',
                () => ({
                    __esModule: true,
                    default: 'react-native:ViewNativeComponent',
                    Commands: 'react-native:Commands',
                }),
                { virtual: true },
            )

            exports = require(path.join(COMPONENTS_DIR, 'deep', `${name}.ts`))
        })

        return exports
    }

    it.each(REACT_NATIVE_COMPONENT_NAMES)('should export Unistyles %s as default and by name', (name) => {
        const exports = loadDeepImport(name)

        expect(exports.default).toBe(unistylesComponent(name))
        expect(exports[name]).toBe(unistylesComponent(name))
    })

    it('should swap NativeText and keep the rest of TextNativeComponent, like the Babel plugin', () => {
        const exports = loadDeepImport('TextNativeComponent')

        expect(exports.NativeText).toBe(unistylesComponent('NativeText'))
        expect(exports.NativeVirtualText).toBe('react-native:NativeVirtualText')
    })

    it('should swap the default export and keep the rest of ViewNativeComponent, like the Babel plugin', () => {
        const exports = loadDeepImport('ViewNativeComponent')

        expect(exports.default).toBe(unistylesComponent('NativeView'))
        expect(exports.Commands).toBe('react-native:Commands')
    })
})
