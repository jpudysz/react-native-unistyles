import type { Compiler, RspackPluginInstance } from '@rspack/core'

import fs from 'node:fs'
import path from 'node:path'

import type { Resolution, ResolutionContext } from '../../metro/src/types'

import { createResolveRequest } from '../../metro/src/resolver'
import { METRO_ENV } from '../../plugin/src/consts'

const PLUGIN_NAME = 'UnistylesPlugin'

// the swapped components are requested by these specifiers, not by their paths,
// so Module Federation shares them like the rest of Unistyles ('react-native-unistyles/' in `shared`)
const COMPONENTS_REQUEST = 'react-native-unistyles/components/native'
const DEEP_COMPONENTS_REQUEST = `${COMPONENTS_REQUEST}/deep`

// Re.Pack's runtime (eg. ScriptManager) and Module Federation's load the bundles, they don't render components,
// the Metro resolver keeps react-native, @react-native and react-native-web untouched
const PASSTHROUGH_PACKAGES = ['@callstack/repack', '@module-federation']

// before Rspack 1.7.5 ConsumeSharedPlugin matched the original request, so a shared react-native wasn't swapped
const MIN_RSPACK_VERSION_WITH_FEDERATION = [1, 7, 5]

const isOlderThan = (version: string, minimum: Array<number>) => {
    const parts = version.split(/[.-]/).map(Number)
    const index = minimum.findIndex((part, partIndex) => part !== (parts[partIndex] ?? 0))

    return index !== -1 && (parts[index] ?? 0) < minimum[index]!
}

const usesModuleFederation = (compiler: Compiler) =>
    compiler.options.plugins.some((plugin) => /ModuleFederationPlugin/.test(plugin?.constructor?.name ?? ''))

const getPackageName = (filePath: string) => {
    const segments = filePath.split(`${path.sep}node_modules${path.sep}`).at(-1)!.split(path.sep)

    return segments[0]?.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0]
}

/**
 * Experimental, the Re.Pack (Rspack) counterpart of react-native-unistyles/metro, there is no Babel plugin
 * It runs the resolver of react-native-unistyles/metro: every `react-native` import (also from node_modules)
 * resolves to Unistyles components and Unistyles records the dependencies of every StyleSheet while it runs
 */
export class UnistylesPlugin implements RspackPluginInstance {
    // replaced in tests
    constructor(private readonly unistylesRoot = fs.realpathSync(path.join(__dirname, '..'))) {}

    apply(compiler: Compiler) {
        // Babel runs in the loaders' workers, they inherit the env,
        // so the Babel plugin knows that it can't be used together with this plugin
        process.env[METRO_ENV] = 'true'

        const rspackVersion = compiler.rspack?.rspackVersion

        if (
            rspackVersion &&
            usesModuleFederation(compiler) &&
            isOlderThan(rspackVersion, MIN_RSPACK_VERSION_WITH_FEDERATION)
        ) {
            throw new Error(
                `Unistyles 🦄: ${PLUGIN_NAME} with Module Federation requires @rspack/core ${MIN_RSPACK_VERSION_WITH_FEDERATION.join('.')} or newer, found ${rspackVersion}. Older versions share react-native before Unistyles can swap its components.`,
            )
        }

        const unistylesRoot = this.unistylesRoot
        const componentsIndex = path.join(unistylesRoot, 'src', 'components', 'native', 'index.ts')
        const deepComponentsDir = path.join(unistylesRoot, 'src', 'components', 'native', 'deep')

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            // without package.json#exports Re.Pack resolves Unistyles to lib/module (`browser`), the components import src
            'react-native-unistyles$': path.join(unistylesRoot, 'src', 'index.ts'),
            [`${COMPONENTS_REQUEST}$`]: componentsIndex,
            [DEEP_COMPONENTS_REQUEST]: deepComponentsDir,
        }

        // only these requests can resolve to something the resolver swaps
        const isCandidate = (request: string, issuer: string) =>
            /^react-native(-web|-unistyles)?($|\/)/.test(request) ||
            (issuer.startsWith(`${unistylesRoot}${path.sep}`) && request.endsWith('/trackDependencies'))

        const toRequest = (filePath: string) => {
            if (filePath === componentsIndex) {
                return COMPONENTS_REQUEST
            }

            return filePath.startsWith(`${deepComponentsDir}${path.sep}`)
                ? `${DEEP_COMPONENTS_REQUEST}/${path.basename(filePath, '.ts')}`
                : filePath
        }

        const resolveRequest = createResolveRequest({ unistylesRoot })
        // warned about once, every module that imports them would repeat the warning
        const unresolvedRequests = new Set<string>()

        compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory) => {
            // the resolver factory keeps the config from before apply(), without the aliases above
            const resolver = compiler.resolverFactory.get('normal', {
                dependencyType: 'esm',
                alias: compiler.options.resolve.alias,
            })

            // beforeResolve runs before Module Federation's ConsumeSharedPlugin, so a shared react-native is swapped too
            normalModuleFactory.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
                const { request } = resolveData
                const issuer = resolveData.contextInfo?.issuer ?? ''

                // no issuer: an entry or the fallback of a module shared with Module Federation (eg. react-native itself)
                if (
                    !issuer ||
                    !isCandidate(request, issuer) ||
                    PASSTHROUGH_PACKAGES.some((name) => getPackageName(issuer)?.startsWith(name))
                ) {
                    return
                }

                let resolvedPath: string | undefined

                // the Metro resolver resolves through the context, here with Rspack's resolver
                const context: ResolutionContext = {
                    originModulePath: issuer,
                    resolveRequest: (_context, moduleName): Resolution => {
                        const result = resolver.resolveSync({}, resolveData.context, moduleName)

                        if (typeof result !== 'string') {
                            return { type: 'empty' }
                        }

                        const filePath = result.split('?')[0]!

                        resolvedPath ??= filePath

                        return { type: 'sourceFile', filePath }
                    },
                }

                let resolution: Resolution

                try {
                    resolution = resolveRequest(context, request, null)
                } catch (error) {
                    // the import isn't swapped and goes on to Rspack, which reports it if it can't resolve it either
                    if (!unresolvedRequests.has(request)) {
                        unresolvedRequests.add(request)
                        console.warn(
                            `Unistyles 🦄: ${PLUGIN_NAME} couldn't resolve "${request}" imported by ${issuer}, Unistyles doesn't swap it. ${error instanceof Error ? error.message : String(error)}`,
                        )
                    }

                    return
                }

                if (
                    resolution.type === 'sourceFile' &&
                    'filePath' in resolution &&
                    resolution.filePath !== resolvedPath
                ) {
                    resolveData.request = toRequest(resolution.filePath)
                }
            })
        })
    }
}
