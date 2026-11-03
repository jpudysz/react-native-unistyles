// the plugin applied to a fake compiler, the builds with Rspack are in bundle.spec.ts and federation.spec.ts
import type { Compiler } from '@rspack/core'

import path from 'node:path'

import { METRO_ENV } from '../../plugin/src/consts'
import { UnistylesPlugin } from '../src/unistylesPlugin'

const UNISTYLES_ROOT = path.join('/project', 'node_modules', 'react-native-unistyles')

const createCompiler = ({
    rspackVersion = '2.2.9',
    alias,
}: {
    rspackVersion?: string
    alias?: Record<string, string>
} = {}) =>
    ({
        options: { resolve: alias ? { alias } : {} },
        rspack: { rspackVersion },
        hooks: { normalModuleFactory: { tap() {} } },
    }) as unknown as Compiler

describe('UnistylesPlugin', () => {
    beforeEach(() => {
        delete process.env[METRO_ENV]
    })

    afterEach(() => {
        delete process.env[METRO_ENV]
    })

    describe('apply', () => {
        it('should let the Babel plugin know it runs next to the Re.Pack integration', () => {
            expect(process.env[METRO_ENV]).toBeUndefined()

            new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler())

            expect(process.env[METRO_ENV]).toBe('true')
        })

        it('should alias Unistyles to its source', () => {
            const compiler = createCompiler()

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            expect(compiler.options.resolve.alias).toEqual({
                'react-native-unistyles$': path.join(UNISTYLES_ROOT, 'src', 'index.ts'),
                'react-native-unistyles/reanimated$': path.join(UNISTYLES_ROOT, 'src', 'reanimated', 'index.ts'),
                'react-native-unistyles/server$': path.join(UNISTYLES_ROOT, 'src', 'server', 'index.ts'),
                'react-native-unistyles/web$': path.join(UNISTYLES_ROOT, 'src', 'web-only', 'index.ts'),
                'react-native-unistyles/components/native$': path.join(
                    UNISTYLES_ROOT,
                    'src',
                    'components',
                    'native',
                    'index.ts',
                ),
                'react-native-unistyles/components/native/deep': path.join(
                    UNISTYLES_ROOT,
                    'src',
                    'components',
                    'native',
                    'deep',
                ),
            })
        })

        it('should keep the aliases of the config', () => {
            const compiler = createCompiler({ alias: { '@app': '/project/src' } })

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            expect(compiler.options.resolve.alias).toMatchObject({ '@app': '/project/src' })
        })

        it('should tap the module factory', () => {
            const tap = jest.fn()
            const compiler = createCompiler()

            compiler.hooks.normalModuleFactory.tap = tap
            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            expect(tap).toHaveBeenCalledWith('UnistylesPlugin', expect.any(Function))
        })
    })

    describe('@rspack/core version', () => {
        it.each(['1.7.4', '1.6.0', '1.0.0', '0.7.5'])('should throw for @rspack/core %s', (rspackVersion) => {
            expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler({ rspackVersion }))).toThrow(
                new RegExp(`@rspack/core 1\\.7\\.5 or newer, found ${rspackVersion.replace(/\./g, '\\.')}`),
            )
        })

        it.each(['1.7.5', '1.7.6', '1.8.0', '1.10.0', '2.0.0', '2.2.9'])(
            'should not throw for @rspack/core %s',
            (rspackVersion) => {
                expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler({ rspackVersion }))).not.toThrow()
            },
        )

        it('should not change the config before it throws', () => {
            const compiler = createCompiler({ rspackVersion: '1.7.4' })

            expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)).toThrow()
            expect(compiler.options.resolve.alias).toBeUndefined()
        })
    })
})
