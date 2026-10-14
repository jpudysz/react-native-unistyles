import { transformFromAstSync, transformSync } from '@babel/core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { BabelTransformer, BabelTransformerArgs } from '../src/types'

import { METRO_UPSTREAM_TRANSFORMER_ENV } from '../../plugin/src/consts'
import plugin from '../../plugin/src/index'
import { createBabelTransformer } from '../src/transformer'

const STYLESHEET = `
    import { View } from 'react-native'
    import { StyleSheet } from 'react-native-unistyles'

    export const App = () => {
        styles.useVariants({ size: 'small' })

        return <View style={styles.container} />
    }

    const styles = StyleSheet.create((theme, rt) => ({
        container: {
            backgroundColor: theme.colors.background,
            paddingTop: rt.insets.top,
            variants: {
                size: {
                    small: { width: 10 }
                }
            }
        },
        static: {
            width: 20
        }
    }))
`

describe.each([
    ['posix', path.posix, '/project'],
    ['windows', path.win32, 'C:\\project'],
] as const)('createBabelTransformer on %s', (_, platformPath, projectRoot) => {
    const unistylesRoot = platformPath.join(projectRoot, 'node_modules', 'react-native-unistyles')
    const upstream = {
        transform: jest.fn((args: BabelTransformerArgs) => args),
        getCacheKey: jest.fn(() => 'upstream'),
    }
    const transformer = createBabelTransformer({
        upstream,
        options: { debug: true },
        unistylesRoot,
        path: platformPath,
    })

    // Metro passes paths relative to the project root
    const args = (filename: string, src = STYLESHEET) => ({
        filename: platformPath.join(...filename.split('/')),
        src,
        options: { projectRoot },
        plugins: ['metro-plugin'],
    })

    it.each([
        ['an app file', 'src/App.tsx'],
        ['a file of a monorepo package', '../packages/ui/src/Button.tsx'],
    ])('should process %s', (__, filename) => {
        expect(transformer.shouldProcess(args(filename))).toBe(true)
    })

    it('should process a file with a re-exported StyleSheet, without configuring it', () => {
        const src = `import { StyleSheet } from '@my-org/styles'\nconst styles = StyleSheet.create(theme => ({ a: { color: theme.color } }))`

        expect(transformer.shouldProcess(args('src/App.tsx', src))).toBe(true)
    })

    it('should process a file with variants only', () => {
        expect(transformer.shouldProcess(args('src/App.tsx', 'styles.useVariants({ size })'))).toBe(true)
    })

    it('should skip a file without StyleSheets and variants', () => {
        expect(transformer.shouldProcess(args('src/App.tsx', "import { View } from 'react-native'"))).toBe(false)
    })

    it('should process a library built with Unistyles', () => {
        expect(transformer.shouldProcess(args('node_modules/ui-kit/lib/Button.js'))).toBe(true)
    })

    it('should skip a library without Unistyles', () => {
        const src = 'const store = Store.create(set => ({ count: { value: 0 } }))'

        expect(transformer.shouldProcess(args('node_modules/state/lib/index.js', src))).toBe(false)
    })

    it('should skip Unistyles', () => {
        expect(transformer.shouldProcess(args('node_modules/react-native-unistyles/src/core/useUnistyles.ts'))).toBe(
            false,
        )
    })

    it("should append the plugin to Metro's plugins", () => {
        const result = transformer.transform(args('src/App.tsx')) as BabelTransformerArgs

        expect(result.plugins).toEqual([
            'metro-plugin',
            [plugin, { debug: true, isMetro: true }, 'react-native-unistyles'],
        ])
        // one item, so Babel reuses the plugin instance
        expect((transformer.transform(args('src/App.tsx')) as BabelTransformerArgs).plugins![1]).toBe(
            result.plugins![1],
        )
    })

    it('should pass other files untouched', () => {
        const fileArgs = args('src/App.tsx', 'export const a = 1')

        expect(transformer.transform(fileArgs)).toBe(fileArgs)
    })

    it("should use the upstream's cache key", () => {
        expect(transformer.getCacheKey('options')).toBe('upstream')
        expect(upstream.getCacheKey).toHaveBeenCalledWith('options')
    })
})

describe('with the Metro babel transformer of React Native', () => {
    const OPTIONS = {
        dev: true,
        hot: false,
        platform: 'ios',
        enableBabelRCLookup: false,
        enableBabelRuntime: false,
        experimentalImportSupport: false,
        globalPrefix: '',
        inlineRequires: false,
        minify: false,
        publicPath: '/assets',
        unstable_transformProfile: 'default',
        customTransformOptions: {},
    }

    const createProject = (babelConfig?: string) => {
        const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'unistyles-metro-'))

        if (babelConfig) {
            fs.writeFileSync(path.join(projectRoot, 'babel.config.js'), babelConfig)
        }

        return projectRoot
    }

    // the transformer memoizes the config of its first project, so every project gets its own instance
    const loadReactNativeTransformer = () => {
        let transformer: BabelTransformer | undefined

        jest.isolateModules(() => {
            transformer = require('@react-native/metro-babel-transformer')
        })

        return transformer!
    }

    const toCode = (result: unknown, src: string) =>
        transformFromAstSync((result as { ast: any }).ast, src, { babelrc: false, configFile: false, code: true })!
            .code!

    const getDependencies = (code: string) =>
        code.match(/uni__dependencies:\s*\[[\d,\s]*\]/g)?.map((match) => match.replace(/\s/g, ''))

    const transformWithReactNative = (transformer: BabelTransformer, projectRoot: string) =>
        toCode(
            transformer.transform({
                filename: path.join('src', 'App.tsx'),
                src: STYLESHEET,
                options: { ...OPTIONS, projectRoot },
                plugins: [],
            }),
            STYLESHEET,
        )

    it('should add the same dependencies and variants as the Babel plugin in babel.config.js', () => {
        // a project set up for the Babel plugin, with its build
        const babelProject = createProject(`
            module.exports = {
                presets: [${JSON.stringify(require.resolve('@react-native/babel-preset'))}],
                plugins: [[${JSON.stringify(path.join(__dirname, '../../plugin/index.js'))}, { root: 'src' }]]
            }
        `)
        const babelCode = transformWithReactNative(loadReactNativeTransformer(), babelProject)

        // a project without Babel config, set up by react-native-unistyles/metro
        const metroTransformer = createBabelTransformer({
            upstream: loadReactNativeTransformer(),
            options: {},
            unistylesRoot: path.join(__dirname, '../..'),
        })
        const metroCode = transformWithReactNative(metroTransformer, createProject())

        expect(getDependencies(babelCode)).toEqual(['uni__dependencies:[0,9,4]'])
        expect(getDependencies(metroCode)).toEqual(getDependencies(babelCode))
        expect(babelCode).toContain('_styles.useVariants')
        expect(metroCode).toContain('_styles.useVariants')
        // the Babel plugin swaps the import, Metro leaves it to its resolver
        expect(babelCode).toContain('react-native-unistyles/components/native/View')
        expect(metroCode).toContain('require("react-native")')
        expect(metroCode).not.toContain('react-native-unistyles/components/native')
    })
})

describe('Babel plugin next to react-native-unistyles/metro', () => {
    afterEach(() => {
        delete process.env[METRO_UPSTREAM_TRANSFORMER_ENV]
    })

    const run = (options: object) =>
        transformSync(STYLESHEET, {
            babelrc: false,
            configFile: false,
            filename: path.join(__dirname, 'src', 'App.tsx'),
            plugins: ['@babel/plugin-syntax-jsx', [plugin, options]],
        })

    it('should ask to remove the Babel plugin when Metro runs it', () => {
        process.env[METRO_UPSTREAM_TRANSFORMER_ENV] = '/project/transformer.js'

        expect(() => run({ root: 'src' })).toThrow('remove react-native-unistyles/plugin from babel.config.js')
        expect(() => run({ isMetro: true })).not.toThrow()
    })

    it('should run the Babel plugin without the Metro integration', () => {
        expect(() => run({ root: 'src' })).not.toThrow()
    })
})
