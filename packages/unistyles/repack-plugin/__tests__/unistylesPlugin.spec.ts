// the plugin applied to a fake compiler, the builds with Rspack are in bundle.spec.ts and federation.spec.ts
import type { Compiler } from '@rspack/core'

import fs from 'node:fs'
import path from 'node:path'

import { METRO_ENV } from '../../plugin/src/consts'
import { isOlderThan, UnistylesPlugin } from '../src/unistylesPlugin'

// the real package, the aliases come from its package.json and point to its src
const UNISTYLES_ROOT = fs.realpathSync(path.join(__dirname, '..', '..'))

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

            // the value names the integration in the error of the Babel plugin
            expect(process.env[METRO_ENV]).toBe('rspack')
        })

        it('should alias Unistyles to its source', () => {
            const compiler = createCompiler()

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            expect(compiler.options.resolve.alias).toEqual({
                'react-native-unistyles$': path.join(UNISTYLES_ROOT, 'src', 'index.ts'),
                'react-native-unistyles/mocks$': path.join(UNISTYLES_ROOT, 'src', 'mocks.ts'),
                'react-native-unistyles/reanimated$': path.join(UNISTYLES_ROOT, 'src', 'reanimated', 'index.ts'),
                'react-native-unistyles/server$': path.join(UNISTYLES_ROOT, 'src', 'server', 'index.ts'),
                'react-native-unistyles/web$': path.join(UNISTYLES_ROOT, 'src', 'web-only', 'index.ts'),
                'react-native-unistyles/diagnostics$': path.join(UNISTYLES_ROOT, 'src', 'diagnostics', 'index.ts'),
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

        it('should alias Unistyles to files that exist', () => {
            const compiler = createCompiler()

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            for (const target of Object.values(compiler.options.resolve.alias || {})) {
                expect(fs.existsSync(target as string)).toBe(true)
            }
        })

        it('should alias every entry point of package.json#exports that has a source', () => {
            const { exports } = JSON.parse(fs.readFileSync(path.join(UNISTYLES_ROOT, 'package.json'), 'utf8'))
            const compiler = createCompiler()

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            const entryPoints = Object.keys(exports).filter(
                (subpath) =>
                    !subpath.includes('*') &&
                    typeof exports[subpath]['react-native'] === 'string' &&
                    !/\.native\.tsx?$/.test(exports[subpath]['react-native']),
            )

            expect(entryPoints.length).toBeGreaterThan(0)
            expect(Object.keys(compiler.options.resolve.alias || {})).toEqual(
                expect.arrayContaining(entryPoints.map((subpath) => `react-native-unistyles${subpath.slice(1)}$`)),
            )
        })

        it('should keep the aliases of the config', () => {
            const compiler = createCompiler({ alias: { '@app': '/project/src' } })

            new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)

            expect(compiler.options.resolve.alias).toMatchObject({ '@app': '/project/src' })
        })

        it('should name UnistylesPlugin in the warnings of the Metro resolver', () => {
            const resolver = require('../../metro/src/resolver')
            const createResolveRequest = jest.spyOn(resolver, 'createResolveRequest')

            new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler())

            expect(createResolveRequest).toHaveBeenCalledWith(
                expect.objectContaining({ unistylesRoot: UNISTYLES_ROOT, integration: 'UnistylesPlugin' }),
            )
            createResolveRequest.mockRestore()
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
        it.each(['1.7.4', '1.6.0', '1.0.0', '0.7.5', '1.7.5-beta.0', '1.7.5-canary-abc123'])(
            'should throw for @rspack/core %s',
            (rspackVersion) => {
                expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler({ rspackVersion }))).toThrow(
                    new RegExp(`@rspack/core 1\\.7\\.5 or newer, found ${rspackVersion.replace(/\./g, '\\.')}`),
                )
            },
        )

        it.each(['1.7.5', '1.7.6', '1.8.0', '1.10.0', '2.0.0', '2.2.9', '1.7.6-beta.0', '2.0.0-rc.1', '1.7.5+build'])(
            'should not throw for @rspack/core %s',
            (rspackVersion) => {
                expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(createCompiler({ rspackVersion }))).not.toThrow()
            },
        )

        it('should not change the config before it throws', () => {
            const compiler = createCompiler({ rspackVersion: '1.7.4' })

            expect(() => new UnistylesPlugin(UNISTYLES_ROOT).apply(compiler)).toThrow()
            expect(compiler.options.resolve.alias).toBeUndefined()
            expect(process.env[METRO_ENV]).toBeUndefined()
        })

        it('should not mark the process when the setup fails', () => {
            const plugin = new UnistylesPlugin(path.join(UNISTYLES_ROOT, 'missing'))

            expect(() => plugin.apply(createCompiler())).toThrow()
            expect(process.env[METRO_ENV]).toBeUndefined()
        })

        it('should treat a prerelease as older than its release', () => {
            expect(isOlderThan('1.7.5-beta.0', [1, 7, 5])).toBe(true)
            expect(isOlderThan('1.7.5', [1, 7, 5])).toBe(false)
            expect(isOlderThan('1.7.6-beta.0', [1, 7, 5])).toBe(false)
        })
    })
})
