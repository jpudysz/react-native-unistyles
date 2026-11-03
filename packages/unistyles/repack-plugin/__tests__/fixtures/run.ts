// runs build.mjs on a fresh fixture, the specs assert on what the bundles got
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { createFixture } from './workspace'

// a component: React Native's (rn) or Unistyles' (unistyles) that wraps it, ids tell the instances apart
export type Component = {
    kind: 'rn' | 'unistyles'
    id: number
    inner?: Component
    registryId?: number
}

// what a module reports about the react-native it got
export type Probe = {
    View: Component
    Text: Component
    Platform: { OS: string }
    DeepView: Component
    PixelRatio: { kind: string }
}

export type Registry = {
    id: number
    source: string
    trackDependencies: boolean
    trackDependenciesFromSpecs: boolean
}

// an entry point of Unistyles (eg. react-native-unistyles/reanimated), ids tell the instances apart
export type EntryPoint = {
    id: number
    source: string
}

export type Bundle = {
    // files of the bundle, relative to the fixture
    modules: Array<string>
    errors: Array<string>
    warnings: Array<string>
}

export type Globals = {
    reactNativeLoads: number
    registries: Array<number>
}

export type AppBuild = {
    app: Bundle
    globals: Globals
    exports: {
        app: Probe
        esm: Pick<Probe, 'View' | 'Platform'>
        library: Probe
        reactNative: Probe
        reactNativePackage: Probe
        repack: Probe
        moduleFederation: Probe
        unistyles: Probe
        unistylesRoot: { source: string; StyleSheet: Registry }
        unistylesModuleBuild: Registry
        unistylesCommonjsBuild: Registry
        unistylesComponents: Pick<Probe, 'View' | 'Text' | 'Platform'>
    }
}

export type FederationBuild = {
    host: Bundle
    remote: Bundle
    globals: Globals
    exports: {
        host: Probe & { StyleSheet: Registry; library: Probe; reanimated: EntryPoint }
        remote: Probe & { StyleSheet: Registry; library: Probe; reanimated: EntryPoint }
    }
}

const BUILD_SCRIPT = path.join(__dirname, 'build.mjs')

export function runBuild(scenario: 'app', flags?: Array<'--without-plugin'>): AppBuild
export function runBuild(scenario: 'federation'): FederationBuild
export function runBuild(scenario: 'app' | 'federation', flags: Array<string> = []) {
    const root = createFixture()

    try {
        const output = execFileSync(process.execPath, [BUILD_SCRIPT, root, scenario, ...flags], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 60_000,
        })

        return JSON.parse(output)
    } catch (error) {
        const { stdout, stderr } = error as { stdout?: string; stderr?: string }

        throw new Error(`The ${scenario} build failed\n${stderr ?? ''}${stdout ?? ''}`, { cause: error })
    } finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
}
