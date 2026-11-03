// a host and a remote built with Module Federation, sharing react, react-native and Unistyles like Re.Pack's ModuleFederationPluginV2 does
// the host loads the remote at runtime, so the specs check what both of them got
import type { FederationBuild } from './fixtures/run'

import { runBuild } from './fixtures/run'

describe('UnistylesPlugin with Module Federation', () => {
    let build: FederationBuild

    beforeAll(() => {
        build = runBuild('federation')
    }, 60_000)

    it('should build the host and the remote without errors or warnings', () => {
        expect(build.host.errors).toEqual([])
        expect(build.host.warnings).toEqual([])
        expect(build.remote.errors).toEqual([])
        expect(build.remote.warnings).toEqual([])
    })

    it('should swap react-native in the host and in the remote', () => {
        const { host, remote } = build.exports

        expect(host.View).toMatchObject({ kind: 'unistyles' })
        expect(host.Text).toMatchObject({ kind: 'unistyles' })
        expect(remote.View).toMatchObject({ kind: 'unistyles' })
        expect(remote.Text).toMatchObject({ kind: 'unistyles' })
    })

    it('should give the host and the remote the same View', () => {
        const { host, remote } = build.exports

        // one instance: the ids are given when a component is created
        expect(remote.View).toEqual(host.View)
        expect(remote.Text).toEqual(host.Text)
    })

    it('should give the libraries of the host and of the remote the same View', () => {
        const { host, remote } = build.exports

        expect(host.library.View).toEqual(host.View)
        expect(remote.library.View).toEqual(host.View)
        expect(remote.library.Text).toEqual(host.Text)
    })

    it('should swap a deep import of a component to the shared View', () => {
        const { host, remote } = build.exports

        expect(host.DeepView).toEqual(host.View)
        expect(remote.DeepView).toEqual(host.View)
        expect(host.library.DeepView).toEqual(host.View)
        expect(remote.library.DeepView).toEqual(host.View)
    })

    it('should wrap the real View of react-native', () => {
        const { host, remote } = build.exports

        expect(host.View.inner).toMatchObject({ kind: 'rn' })
        expect(remote.View.inner).toEqual(host.View.inner)
    })

    it('should evaluate react-native once', () => {
        expect(build.globals.reactNativeLoads).toBe(1)
    })

    it('should pass the other exports of react-native through', () => {
        const { host, remote } = build.exports

        expect(host.Platform).toEqual({ OS: 'ios' })
        expect(remote.Platform).toEqual({ OS: 'ios' })
        expect(host.PixelRatio).toEqual({ kind: 'rn-pixelratio' })
        expect(remote.PixelRatio).toEqual({ kind: 'rn-pixelratio' })
    })

    it('should track the dependencies of every StyleSheet at runtime', () => {
        const { host, remote } = build.exports

        expect(host.StyleSheet.trackDependencies).toBe(true)
        expect(remote.StyleSheet.trackDependencies).toBe(true)
    })

    it('should bundle trackDependencies.metro.ts and not trackDependencies.ts', () => {
        for (const bundle of [build.host, build.remote]) {
            expect(bundle.modules.filter((file) => file.includes('/core/trackDependencies'))).toEqual([
                'node_modules/react-native-unistyles/src/core/trackDependencies.metro.ts',
            ])
        }
    })

    it('should use the registry of the host in the shared components', () => {
        const { host, remote } = build.exports

        expect(host.View.registryId).toBe(host.StyleSheet.id)
        expect(remote.View.registryId).toBe(host.StyleSheet.id)
    })

    it('should share the entry points of Unistyles from src', () => {
        const { host, remote } = build.exports

        expect(host.reanimated.source).toBe('src')
        expect(remote.reanimated).toEqual(host.reanimated)
    })

    it('should share one Unistyles registry between the host and the remote', () => {
        expect(build.globals.registries).toHaveLength(1)
        expect(build.exports.remote.StyleSheet.id).toBe(build.exports.host.StyleSheet.id)
    })
})
