// builds a fake React Native + Unistyles workspace with Rspack and the built plugin (repack-plugin/index.js), runs the bundle in Node
// @rspack/core is ESM only, so the build runs in a child process, see fixtures/build.mjs
import type { AppBuild } from './fixtures/run'

import { runBuild } from './fixtures/run'

describe('UnistylesPlugin bundle', () => {
    let build: AppBuild

    beforeAll(() => {
        build = runBuild('app')
    }, 60_000)

    it('should build without errors or warnings', () => {
        expect(build.app.errors).toEqual([])
        expect(build.app.warnings).toEqual([])
    })

    it('should swap the components of react-native required by the app', () => {
        const { View, Text } = build.exports.app

        expect(View).toMatchObject({ kind: 'unistyles' })
        expect(Text).toMatchObject({ kind: 'unistyles' })
        expect(View.id).not.toBe(Text.id)
    })

    it('should swap the components of react-native imported with ESM syntax', () => {
        expect(build.exports.esm.View).toEqual(build.exports.app.View)
    })

    it('should wrap the components of react-native', () => {
        const { View, Text } = build.exports.app

        expect(View.inner).toMatchObject({ kind: 'rn' })
        expect(Text.inner).toMatchObject({ kind: 'rn' })
        expect(View.inner!.id).not.toBe(Text.inner!.id)
    })

    it('should pass the other exports of react-native through', () => {
        expect(build.exports.app.Platform).toEqual({ OS: 'ios' })
        expect(build.exports.esm.Platform).toEqual({ OS: 'ios' })
    })

    it('should evaluate react-native once', () => {
        expect(build.globals.reactNativeLoads).toBe(1)
    })

    it('should swap a deep import of a component to the Unistyles component', () => {
        expect(build.exports.app.DeepView).toMatchObject({ kind: 'unistyles' })
        // the same component as the one of react-native
        expect(build.exports.app.DeepView).toEqual(build.exports.app.View)
    })

    it('should keep a deep import that is not a component', () => {
        expect(build.exports.app.PixelRatio).toEqual({ kind: 'rn-pixelratio' })
    })

    it('should swap react-native imported by a library in node_modules', () => {
        const { library, app } = build.exports

        expect(library.View).toEqual(app.View)
        expect(library.Text).toEqual(app.Text)
        expect(library.DeepView).toEqual(app.DeepView)
        expect(library.Platform).toEqual({ OS: 'ios' })
        expect(library.PixelRatio).toEqual({ kind: 'rn-pixelratio' })
    })

    it.each([
        ['react-native', 'reactNative'],
        ['@react-native/virtualized-lists', 'reactNativePackage'],
        ['@callstack/repack', 'repack'],
        ['@module-federation/runtime-tools', 'moduleFederation'],
        ['Unistyles', 'unistyles'],
    ] as const)('should give %s the real react-native', (_, exportName) => {
        const probe = build.exports[exportName]

        expect(probe.View).toMatchObject({ kind: 'rn' })
        expect(probe.Text).toMatchObject({ kind: 'rn' })
        expect(probe.DeepView).toMatchObject({ kind: 'rn' })
        // the one that Unistyles wraps
        expect(probe.View).toEqual(build.exports.app.View.inner)
        expect(probe.DeepView).toEqual(build.exports.app.View.inner)
        expect(probe.Platform).toEqual({ OS: 'ios' })
    })

    it('should bundle trackDependencies.metro.ts and not trackDependencies.ts', () => {
        const trackDependencies = build.app.modules.filter((file) => file.includes('/core/trackDependencies'))

        expect(trackDependencies).toEqual(['node_modules/react-native-unistyles/src/core/trackDependencies.metro.ts'])
    })

    it('should track the dependencies of every StyleSheet at runtime', () => {
        const { StyleSheet } = build.exports.unistylesRoot

        expect(StyleSheet.trackDependencies).toBe(true)
        // imported as ../../core/trackDependencies
        expect(StyleSheet.trackDependenciesFromSpecs).toBe(true)
    })

    it('should resolve react-native-unistyles to src although browser points to lib/module', () => {
        expect(build.exports.unistylesRoot.source).toBe('src')
        expect(build.exports.unistylesRoot.StyleSheet.source).toBe('src')
    })

    it('should resolve an explicit import of a Unistyles build to src', () => {
        expect(build.exports.unistylesModuleBuild.source).toBe('src')
        expect(build.exports.unistylesCommonjsBuild.source).toBe('src')
        expect(build.app.modules.filter((file) => file.includes('react-native-unistyles/lib/'))).toEqual([])
    })

    it('should run one Unistyles registry', () => {
        const { unistylesRoot, unistylesModuleBuild, unistylesCommonjsBuild, app } = build.exports

        expect(build.globals.registries).toHaveLength(1)
        expect(unistylesModuleBuild.id).toBe(unistylesRoot.StyleSheet.id)
        expect(unistylesCommonjsBuild.id).toBe(unistylesRoot.StyleSheet.id)
        // the components of Unistyles use the same registry as the app
        expect(app.View.registryId).toBe(unistylesRoot.StyleSheet.id)
    })

    it('should expose the Unistyles components to the app through react-native', () => {
        const { unistylesComponents, app } = build.exports

        expect(unistylesComponents.View).toEqual(app.View)
        expect(unistylesComponents.Text).toEqual(app.Text)
        expect(unistylesComponents.Platform).toEqual({ OS: 'ios' })
    })
})

describe('UnistylesPlugin bundle without the plugin', () => {
    // the specs above pass only because of the plugin
    it('should keep the components of react-native', () => {
        const build = runBuild('app', ['--without-plugin'])

        expect(build.app.errors).toEqual([])
        expect(build.exports.app.View).toMatchObject({ kind: 'rn' })
        expect(build.exports.library.View).toMatchObject({ kind: 'rn' })
        expect(build.exports.app.DeepView).toMatchObject({ kind: 'rn' })
    }, 60_000)
})
