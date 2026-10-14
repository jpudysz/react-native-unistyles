// tests the build users get, metro/index.js and metro/babel-transformer.js
import { buildSync } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

import { METRO_OPTIONS_ENV, METRO_UPSTREAM_TRANSFORMER_ENV } from '../../plugin/src/consts'

const METRO_DIR = path.join(__dirname, '..')
const BABEL_TRANSFORMER_PATH = path.join(METRO_DIR, 'babel-transformer.js')
const UPSTREAM_PATH = path.join(METRO_DIR, '__tests__', 'upstream-transformer.mock.js')

const { withUnistylesConfig } = require('../index.js')

const createConfig = () => ({
    projectRoot: '/project',
    watchFolders: ['/packages'],
    transformer: {
        babelTransformerPath: UPSTREAM_PATH,
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
        delete process.env[METRO_UPSTREAM_TRANSFORMER_ENV]
        delete process.env[METRO_OPTIONS_ENV]
    })

    it('should run its babel transformer on top of the one from the config', () => {
        const config = withUnistylesConfig(createConfig())

        expect(config.transformer.babelTransformerPath).toBe(BABEL_TRANSFORMER_PATH)
        expect(fs.existsSync(config.transformer.babelTransformerPath)).toBe(true)
        expect(process.env[METRO_UPSTREAM_TRANSFORMER_ENV]).toBe(UPSTREAM_PATH)
    })

    it('should pass the options to the workers and to the cache key', () => {
        const config = withUnistylesConfig(createConfig(), { debug: true })

        expect(JSON.parse(process.env[METRO_OPTIONS_ENV]!)).toEqual({ debug: true })
        expect(config.transformer.unistyles).toEqual({ debug: true })
        expect(withUnistylesConfig(createConfig()).transformer.unistyles).toEqual({ debug: false })
    })

    it('should keep the rest of the config', () => {
        const input = createConfig()
        const config = withUnistylesConfig(input)

        expect(config.projectRoot).toBe('/project')
        expect(config.watchFolders).toEqual(['/packages'])
        expect(config.transformer.minifierPath).toBe('metro-minify-terser')
        expect(config.resolver.sourceExts).toEqual(['ts', 'tsx', 'js'])
        // the input stays untouched
        expect(input.transformer.babelTransformerPath).toBe(UPSTREAM_PATH)
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

    it('should throw without a babel transformer to wrap', () => {
        expect(() => withUnistylesConfig({ resolver: {} })).toThrow('Metro config has no babelTransformerPath')
    })

    it('should throw when applied twice', () => {
        expect(() => withUnistylesConfig(withUnistylesConfig(createConfig()))).toThrow('applied twice')
    })
})

describe('metro/babel-transformer.js', () => {
    afterEach(() => {
        delete process.env[METRO_UPSTREAM_TRANSFORMER_ENV]
        delete process.env[METRO_OPTIONS_ENV]
    })

    const loadBabelTransformer = () => {
        let babelTransformer: any

        jest.isolateModules(() => {
            babelTransformer = require('../babel-transformer.js')
        })

        return babelTransformer
    }

    it('should wrap the transformer set by withUnistylesConfig', () => {
        withUnistylesConfig(createConfig(), { debug: true })

        const babelTransformer = loadBabelTransformer()
        const args = { filename: 'src/App.tsx', src: 'StyleSheet.create({})', options: { projectRoot: '/project' } }
        const result = babelTransformer.transform(args)

        expect(result.plugins[0][1]).toEqual({ debug: true, isMetro: true })
        expect(babelTransformer.getCacheKey()).toBe('upstream-cache-key')
    })

    it('should throw outside of withUnistylesConfig', () => {
        expect(loadBabelTransformer).toThrow('can be only set by withUnistylesConfig')
    })
})

describe('metro build', () => {
    // esbuild output is deterministic, a stale build means `bun run metro:build` wasn't run
    it.each(['index', 'babel-transformer'])('should match metro/src/%s.ts', (entry) => {
        const [output] = buildSync({
            entryPoints: [path.join(METRO_DIR, 'src', `${entry}.ts`)],
            outdir: METRO_DIR,
            bundle: true,
            packages: 'external',
            platform: 'node',
            write: false,
            logLevel: 'silent',
        }).outputFiles

        expect(output!.text).toBe(fs.readFileSync(path.join(METRO_DIR, `${entry}.js`), 'utf8'))
    })
})
