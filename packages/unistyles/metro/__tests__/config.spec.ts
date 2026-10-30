// tests the build users get, metro/index.js
import { buildSync } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

import { METRO_ENV } from '../../plugin/src/consts'

const METRO_DIR = path.join(__dirname, '..')
const BABEL_TRANSFORMER_PATH = '/project/node_modules/@react-native/metro-babel-transformer/src/index.js'

const { withUnistylesConfig } = require('../index.js')

const createConfig = () => ({
    projectRoot: '/project',
    watchFolders: ['/packages'],
    transformer: {
        babelTransformerPath: BABEL_TRANSFORMER_PATH,
        minifierPath: 'metro-minify-terser',
    },
    resolver: {
        sourceExts: ['ts', 'tsx', 'js'],
        resolveRequest: jest.fn(() => ({
            type: 'sourceFile',
            filePath: '/project/node_modules/react-native/index.js',
        })),
    },
})

describe('withUnistylesConfig', () => {
    afterEach(() => {
        delete process.env[METRO_ENV]
    })

    it("should keep the config's transformer, there is no Babel transform", () => {
        const config = withUnistylesConfig(createConfig())

        expect(config.transformer).toEqual(createConfig().transformer)
    })

    it('should let the Babel plugin know it runs next to the Metro integration', () => {
        withUnistylesConfig(createConfig())

        expect(process.env[METRO_ENV]).toBe('true')
    })

    it('should keep the rest of the config', () => {
        const input = createConfig()
        const config = withUnistylesConfig(input)

        expect(config.projectRoot).toBe('/project')
        expect(config.watchFolders).toEqual(['/packages'])
        expect(config.resolver.sourceExts).toEqual(['ts', 'tsx', 'js'])
        // the input stays untouched
        expect(input.resolver.resolveRequest).not.toBe(config.resolver.resolveRequest)
    })

    it("should resolve with the config's resolveRequest", () => {
        const input = createConfig()
        const config = withUnistylesConfig(input)
        const resolution = config.resolver.resolveRequest(
            { originModulePath: '/project/src/App.tsx', resolveRequest: jest.fn() },
            'react-native',
            'ios',
        )

        expect(input.resolver.resolveRequest).toHaveBeenCalled()
        expect(resolution).toEqual({
            type: 'sourceFile',
            filePath: path.join(fs.realpathSync(path.join(METRO_DIR, '..')), 'src', 'components', 'native', 'index.ts'),
        })
    })

    it("should resolve with Metro's resolveRequest when the config has none", () => {
        const resolveRequest = jest.fn(() => ({ type: 'assetFiles' }))
        const config = withUnistylesConfig({ resolver: {} })

        expect(
            config.resolver.resolveRequest(
                { originModulePath: '/project/src/App.tsx', resolveRequest },
                './a.png',
                'ios',
            ),
        ).toEqual({ type: 'assetFiles' })
        expect(resolveRequest).toHaveBeenCalled()
    })
})

describe('metro build', () => {
    // esbuild output is deterministic, a stale build means `bun run metro:build` wasn't run
    it('should match metro/src/index.ts', () => {
        const [output] = buildSync({
            entryPoints: [path.join(METRO_DIR, 'src', 'index.ts')],
            outdir: METRO_DIR,
            bundle: true,
            packages: 'external',
            platform: 'node',
            write: false,
            logLevel: 'silent',
        }).outputFiles

        expect(output!.text).toBe(fs.readFileSync(path.join(METRO_DIR, 'index.js'), 'utf8'))
    })
})
