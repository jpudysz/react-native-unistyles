// the deprecated RepackUnistylePlugin keeps working until Unistyles 4.0
import type { Compiler } from '@rspack/core'

import { BASE_REPACK_EXCLUDE_PATHS, RepackUnistylePlugin } from '../src/repackUnistylePlugin'

const createCompiler = () => ({ options: { module: { rules: [] as Array<any> } } }) as unknown as Compiler

describe('RepackUnistylePlugin', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should add the rules of the loader with the options of the Babel plugin', () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        const compiler = createCompiler()

        new RepackUnistylePlugin({ unistylesPluginOptions: { root: 'src' } }).apply(compiler)

        const [rule] = compiler.options.module.rules as Array<any>

        expect(rule.exclude).toBe(BASE_REPACK_EXCLUDE_PATHS)
        expect(rule.oneOf).toHaveLength(3)
        expect(rule.oneOf[0].use).toEqual({
            loader: 'react-native-unistyles/repack-plugin',
            options: {
                babelPlugins: [['@babel/plugin-syntax-typescript', { isTSX: false, allowNamespaces: true }]],
                unistylesPluginOptions: { root: 'src' },
            },
        })
    })

    it('should warn once that it is deprecated', () => {
        jest.isolateModules(() => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            const { RepackUnistylePlugin: Plugin } = require('../src/repackUnistylePlugin')

            new Plugin().apply(createCompiler())
            new Plugin().apply(createCompiler())

            expect(warn).toHaveBeenCalledTimes(1)
            expect(warn.mock.calls[0]![0]).toContain(
                'RepackUnistylePlugin is deprecated and will be removed in Unistyles 4.0',
            )
        })
    })

    it.each([
        ['react-native', '/app/node_modules/react-native/index.js'],
        ['@callstack/repack', '/app/node_modules/@callstack/repack/dist/index.js'],
        ['pnpm', '/app/node_modules/.pnpm/@callstack+repack@5.4.2/node_modules/@callstack/repack/dist/index.js'],
        ['Windows', 'C:\\app\\node_modules\\react-native-unistyles\\src\\index.ts'],
    ])('should exclude core packages (%s)', (_, filePath) => {
        expect(BASE_REPACK_EXCLUDE_PATHS.some((regex) => regex.test(filePath))).toBe(true)
    })

    it('should not exclude the app or other libraries', () => {
        for (const filePath of ['/app/src/App.tsx', '/app/node_modules/some-library/index.js']) {
            expect(BASE_REPACK_EXCLUDE_PATHS.some((regex) => regex.test(filePath))).toBe(false)
        }
    })
})

describe('react-native-unistyles/repack-plugin', () => {
    it('should export UnistylesPlugin, the deprecated RepackUnistylePlugin and its loader', () => {
        const repackPlugin = require('../index.js')

        expect(repackPlugin.UnistylesPlugin).toEqual(expect.any(Function))
        expect(repackPlugin.RepackUnistylePlugin).toEqual(expect.any(Function))
        expect(repackPlugin.BASE_REPACK_EXCLUDE_PATHS).toEqual(expect.any(Array))
        expect(repackPlugin.default).toEqual(expect.any(Function))
    })

    it("should load without Re.Pack or Babel, Rspack and Rsbuild apps don't need them", () => {
        jest.isolateModules(() => {
            const missing = (name: string) => () => {
                throw new Error(`Cannot find module '${name}'`)
            }

            jest.doMock('@babel/core', missing('@babel/core'))
            jest.doMock('@callstack/repack', missing('@callstack/repack'), { virtual: true })

            // the loader of RepackUnistylePlugin requires Babel when it runs, not when the module loads
            expect(require('../index.js').UnistylesPlugin).toEqual(expect.any(Function))
        })
    })
})
