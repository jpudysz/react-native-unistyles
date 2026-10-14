import path from 'node:path'

import type { ResolutionContext } from '../src/types'

import { REACT_NATIVE_COMPONENT_NAMES } from '../../plugin/src/consts'
import { createResolveRequest, DEEP_IMPORTS } from '../src/resolver'

describe.each([
    ['posix', path.posix, '/project'],
    ['windows', path.win32, 'C:\\project'],
] as const)('createResolveRequest on %s', (_, platformPath, projectRoot) => {
    const join = (...segments: Array<string>) => platformPath.join(projectRoot, ...segments)
    const unistylesRoot = join('node_modules', 'react-native-unistyles')
    const componentsDir = platformPath.join(unistylesRoot, 'src', 'components', 'native')
    const componentsIndex = platformPath.join(componentsDir, 'index.ts')
    const deepImport = (name: string) => platformPath.join(componentsDir, 'deep', `${name}.ts`)

    // where Metro resolves each request
    const RESOLUTIONS: Record<string, string> = {
        'react-native': join('node_modules', 'react-native', 'index.js'),
        'react-native/index.js': join('node_modules', 'react-native', 'index.js'),
        'react-native/Libraries/Components/View/View': join(
            'node_modules',
            'react-native',
            'Libraries',
            'Components',
            'View',
            'View.js',
        ),
        'react-native/Libraries/Image/Image': join(
            'node_modules',
            'react-native',
            'Libraries',
            'Image',
            'Image.ios.js',
        ),
        'react-native/Libraries/Text/TextNativeComponent': join(
            'node_modules',
            'react-native',
            'Libraries',
            'Text',
            'TextNativeComponent.js',
        ),
        'react-native/Libraries/Components/View/ViewNativeComponent': join(
            'node_modules',
            'react-native',
            'Libraries',
            'Components',
            'View',
            'ViewNativeComponent.js',
        ),
        'react-native/Libraries/StyleSheet/StyleSheet': join(
            'node_modules',
            'react-native',
            'Libraries',
            'StyleSheet',
            'StyleSheet.js',
        ),
        'react-native-web': join('node_modules', 'react-native-web', 'dist', 'index.js'),
        'react-native-web/dist/exports/View': join(
            'node_modules',
            'react-native-web',
            'dist',
            'exports',
            'View',
            'index.js',
        ),
        'react-native-web/dist/exports/StyleSheet': join(
            'node_modules',
            'react-native-web',
            'dist',
            'exports',
            'StyleSheet',
            'index.js',
        ),
        'react-native-reanimated': join('node_modules', 'react-native-reanimated', 'src', 'index.ts'),
        './image.png': join('src', 'image.png'),
        // Unistyles itself, an ESM import of the app gets lib/module, a require gets lib/commonjs or src
        'react-native-unistyles': platformPath.join(unistylesRoot, 'lib', 'module', 'index.js'),
        'react-native-unistyles/reanimated': platformPath.join(
            unistylesRoot,
            'lib',
            'commonjs',
            'reanimated',
            'index.js',
        ),
        'react-native-unistyles/components/native/View': platformPath.join(
            unistylesRoot,
            'lib',
            'module',
            'components',
            'native',
            'View.native.js',
        ),
        'react-native-unistyles/diagnostics': platformPath.join(unistylesRoot, 'src', 'diagnostics', 'index.ts'),
        [platformPath.join(unistylesRoot, 'src', 'index')]: platformPath.join(unistylesRoot, 'src', 'index.ts'),
        [platformPath.join(unistylesRoot, 'src', 'reanimated', 'index')]: platformPath.join(
            unistylesRoot,
            'src',
            'reanimated',
            'index.ts',
        ),
        [platformPath.join(unistylesRoot, 'src', 'components', 'native', 'View')]: platformPath.join(
            componentsDir,
            'View.tsx',
        ),
    }

    const upstream = jest.fn((_context: ResolutionContext, moduleName: string, platform: string | null) => {
        if (moduleName === './image.png') {
            return { type: 'assetFiles' }
        }

        // on web, Expo resolves react-native to react-native-web
        const filePath =
            RESOLUTIONS[platform === 'web' && moduleName === 'react-native' ? 'react-native-web' : moduleName]

        if (!filePath) {
            throw new Error(`Unexpected request ${moduleName}`)
        }

        return { type: 'sourceFile', filePath }
    })

    const resolveRequest = createResolveRequest({ unistylesRoot, upstream, path: platformPath })

    const resolve = (origin: string, moduleName: string, platform: string | null = 'ios') =>
        resolveRequest({ originModulePath: origin, resolveRequest: upstream }, moduleName, platform)

    // origins
    const APP = join('src', 'App.tsx')
    const MONOREPO_PACKAGE = platformPath.join(projectRoot, '..', 'packages', 'ui', 'src', 'Button.tsx')
    const LIBRARY = join('node_modules', 'react-native-paper', 'lib', 'module', 'Card.js')
    const SCOPED_LIBRARY = join('node_modules', '@gorhom', 'bottom-sheet', 'src', 'BottomSheet.tsx')
    const BUN_LIBRARY = join(
        'node_modules',
        '.bun',
        'expo-router@6.0.0',
        'node_modules',
        'expo-router',
        'build',
        'Link.js',
    )
    const REANIMATED = join('node_modules', 'react-native-reanimated', 'lib', 'module', 'component', 'View.js')
    const REACT_NATIVE_INTERNAL = join('node_modules', 'react-native', 'Libraries', 'Lists', 'FlatList.js')
    const REACT_NATIVE_PACKAGE = join(
        'node_modules',
        '@react-native',
        'virtualized-lists',
        'Lists',
        'VirtualizedList.js',
    )
    const REACT_NATIVE_WEB_INTERNAL = join(
        'node_modules',
        'react-native-web',
        'dist',
        'exports',
        'ScrollView',
        'index.js',
    )
    const UNISTYLES_INTERNAL = platformPath.join(componentsDir, 'View.tsx')
    // a package whose name starts like a passthrough package
    const LOOKALIKE_LIBRARY = join('node_modules', 'react-native-webview', 'lib', 'WebView.js')

    describe('react-native', () => {
        it.each([
            ['the app', APP],
            ['a package of a monorepo', MONOREPO_PACKAGE],
            ['a library', LIBRARY],
            ['a scoped library', SCOPED_LIBRARY],
            ['a library installed by bun', BUN_LIBRARY],
            ['Reanimated', REANIMATED],
            ['a library named like react-native-web', LOOKALIKE_LIBRARY],
        ])('should resolve to Unistyles from %s', (__, origin) => {
            expect(resolve(origin, 'react-native')).toEqual({ type: 'sourceFile', filePath: componentsIndex })
        })

        it.each([
            ['React Native', REACT_NATIVE_INTERNAL],
            ['@react-native packages', REACT_NATIVE_PACKAGE],
            ['react-native-web', REACT_NATIVE_WEB_INTERNAL],
            ['Unistyles', UNISTYLES_INTERNAL],
        ])('should stay React Native in %s', (__, origin) => {
            expect(resolve(origin, 'react-native')).toEqual({
                type: 'sourceFile',
                filePath: RESOLUTIONS['react-native'],
            })
        })

        it('should resolve to Unistyles on web, where it resolves to react-native-web', () => {
            expect(resolve(APP, 'react-native', 'web')).toEqual({ type: 'sourceFile', filePath: componentsIndex })
        })

        it('should keep react-native/index.js as an escape hatch', () => {
            expect(resolve(APP, 'react-native/index.js')).toEqual({
                type: 'sourceFile',
                filePath: RESOLUTIONS['react-native/index.js'],
            })
        })
    })

    describe('deep imports', () => {
        it.each([
            ['react-native/Libraries/Components/View/View', 'View'],
            ['react-native/Libraries/Image/Image', 'Image'],
            ['react-native/Libraries/Text/TextNativeComponent', 'TextNativeComponent'],
            ['react-native/Libraries/Components/View/ViewNativeComponent', 'ViewNativeComponent'],
            ['react-native-web/dist/exports/View', 'View'],
        ])('should resolve %s to Unistyles', (moduleName, name) => {
            expect(resolve(LIBRARY, moduleName)).toEqual({ type: 'sourceFile', filePath: deepImport(name) })
        })

        it.each(['react-native/Libraries/StyleSheet/StyleSheet', 'react-native-web/dist/exports/StyleSheet'])(
            'should keep %s',
            (moduleName) => {
                expect(resolve(APP, moduleName)).toEqual({ type: 'sourceFile', filePath: RESOLUTIONS[moduleName] })
            },
        )

        it('should resolve the index of react-native-web to Unistyles', () => {
            expect(resolve(APP, 'react-native-web', 'web')).toEqual({ type: 'sourceFile', filePath: componentsIndex })
        })

        it('should keep deep imports between React Native modules', () => {
            expect(resolve(REACT_NATIVE_INTERNAL, 'react-native/Libraries/Components/View/View')).toEqual({
                type: 'sourceFile',
                filePath: RESOLUTIONS['react-native/Libraries/Components/View/View'],
            })
        })
    })

    describe('one copy of Unistyles', () => {
        it.each([
            ['an ESM import', 'react-native-unistyles', platformPath.join(unistylesRoot, 'src', 'index.ts')],
            [
                'a require',
                'react-native-unistyles/reanimated',
                platformPath.join(unistylesRoot, 'src', 'reanimated', 'index.ts'),
            ],
            [
                'a platform file',
                'react-native-unistyles/components/native/View',
                platformPath.join(componentsDir, 'View.tsx'),
            ],
        ])('should resolve the build of %s to the source, like the swapped components', (__, moduleName, filePath) => {
            expect(resolve(APP, moduleName)).toEqual({ type: 'sourceFile', filePath })
            expect(resolve(LIBRARY, moduleName, 'web')).toEqual({ type: 'sourceFile', filePath })
        })

        it('should keep the source', () => {
            expect(resolve(APP, 'react-native-unistyles/diagnostics')).toEqual({
                type: 'sourceFile',
                filePath: RESOLUTIONS['react-native-unistyles/diagnostics'],
            })
        })
    })

    it('should keep other packages and non source files', () => {
        expect(resolve(APP, 'react-native-reanimated')).toEqual({
            type: 'sourceFile',
            filePath: RESOLUTIONS['react-native-reanimated'],
        })
        expect(resolve(APP, './image.png')).toEqual({ type: 'assetFiles' })
    })

    it("should resolve with the user's resolveRequest", () => {
        const custom = jest.fn(() => ({ type: 'sourceFile', filePath: join('custom', 'react-native.js') }))
        const withCustom = createResolveRequest({ unistylesRoot, upstream: custom, path: platformPath })

        withCustom({ originModulePath: REACT_NATIVE_INTERNAL, resolveRequest: upstream }, 'react-native', 'ios')

        expect(custom).toHaveBeenCalled()
    })
})

describe('DEEP_IMPORTS', () => {
    it('should have a module for every component the Babel plugin swaps', () => {
        REACT_NATIVE_COMPONENT_NAMES.forEach((name) => {
            expect(DEEP_IMPORTS).toContain(name)
        })
    })

    it.each(DEEP_IMPORTS)('should have src/components/native/deep/%s.ts', (name) => {
        expect(() =>
            require.resolve(path.join(__dirname, '../../src/components/native/deep', `${name}.ts`)),
        ).not.toThrow()
    })
})
