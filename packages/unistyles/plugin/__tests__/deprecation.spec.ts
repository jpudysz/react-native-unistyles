// the Babel plugin is deprecated since 3.9.0, it warns once per process and names the integrations that replace it
import type { TransformOptions } from '@babel/core'

import { transformSync } from '@babel/core'

import { METRO_ENV, REPACK_LOADER_CALLER } from '../src/consts'

type Env = Record<string, string | undefined>

// like an app build: not a test, the first (or the only) Metro worker
const APP_ENV: Env = { NODE_ENV: 'development', JEST_WORKER_ID: '1', [METRO_ENV]: undefined }

const withEnv = (env: Env, run: () => void) => {
    const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
    const apply = (values: Env) =>
        Object.entries(values).forEach(([key, value]) => {
            if (value === undefined) {
                delete process.env[key]

                return
            }

            process.env[key] = value
        })

    apply(env)

    try {
        run()
    } finally {
        apply(previous)
    }
}

// a fresh module, so every test starts before the first warning
const runPlugin = ({
    env = {},
    caller,
    times = 1,
    pluginPath = '../src/index',
}: {
    env?: Env
    caller?: TransformOptions['caller']
    times?: number
    pluginPath?: string
} = {}) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    withEnv({ ...APP_ENV, ...env }, () => {
        jest.isolateModules(() => {
            const plugin = require(pluginPath)
            const pluginFn = plugin.default ?? plugin

            for (let index = 0; index < times; index++) {
                transformSync(`import { View } from 'react-native'`, {
                    filename: `/project/src/File${index}.js`,
                    root: '/project',
                    babelrc: false,
                    configFile: false,
                    caller,
                    plugins: [[pluginFn, { root: 'src' }]],
                })
            }
        })
    })

    return warn.mock.calls.map((args) => args.join(' '))
}

describe('Babel plugin deprecation warning', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should warn once per process', () => {
        const warnings = runPlugin({ times: 3 })

        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toMatch(/^Unistyles 🦄: /)
        expect(warnings[0]).toContain(
            'react-native-unistyles/plugin is deprecated and will be removed in Unistyles 4.0',
        )
    })

    it('should name the Metro integration and UnistylesPlugin', () => {
        const [warning] = runPlugin()

        expect(warning).toContain('withUnistylesConfig from react-native-unistyles/metro')
        expect(warning).toContain('https://www.unistyl.es/v3/other/metro')
        expect(warning).toContain('UnistylesPlugin from react-native-unistyles/repack-plugin')
        expect(warning).toContain('https://www.unistyl.es/v3/other/repack')
        expect(warning).toContain("Other bundlers (eg. Next.js, Vite or webpack) don't have a replacement yet")
    })

    it('should name only the Metro integration when Metro runs Babel', () => {
        const [warning] = runPlugin({ caller: { name: 'metro' } })

        expect(warning).toContain('withUnistylesConfig from react-native-unistyles/metro')
        expect(warning).toContain('https://www.unistyl.es/v3/other/metro')
        expect(warning).not.toContain('UnistylesPlugin')
    })

    it('should not warn in tests (NODE_ENV=test)', () => {
        expect(runPlugin({ env: { NODE_ENV: 'test' } })).toEqual([])
    })

    it("should not warn in Metro's other workers", () => {
        expect(runPlugin({ env: { JEST_WORKER_ID: '2' } })).toEqual([])
        expect(runPlugin({ env: { JEST_WORKER_ID: undefined } })).toHaveLength(1)
    })

    it('should not warn next to an integration, the plugin throws an error instead', () => {
        expect(() => runPlugin({ env: { [METRO_ENV]: 'metro' } })).toThrow('react-native-unistyles/metro is enabled')
        expect(console.warn).not.toHaveBeenCalled()
    })

    it('should not warn when RepackUnistylePlugin runs it, RepackUnistylePlugin warns about itself', () => {
        expect(runPlugin({ caller: { name: REPACK_LOADER_CALLER } })).toEqual([])
    })

    it('should warn from the built plugin', () => {
        const [warning] = runPlugin({ pluginPath: '../index.js' })

        expect(warning).toContain('react-native-unistyles/plugin is deprecated and will be removed in Unistyles 4.0')
    })
})
