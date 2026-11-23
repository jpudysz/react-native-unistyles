import type { Compiler, RspackPluginInstance } from '@rspack/core'

import fs from 'node:fs'
import path from 'node:path'

import type { Resolution, ResolutionContext } from '../../metro/src/types'

import { createResolveRequest, isSourceFile } from '../../metro/src/resolver'
import { METRO_ENV, RSPACK_INTEGRATION } from '../../plugin/src/consts'

const PLUGIN_NAME = 'UnistylesPlugin'

// the swapped components are requested by these specifiers, not by their paths,
// so Module Federation shares them like the rest of Unistyles ('react-native-unistyles/' in `shared`)
const COMPONENTS_REQUEST = 'react-native-unistyles/components/native'
const DEEP_COMPONENTS_REQUEST = `${COMPONENTS_REQUEST}/deep`

// only these requests can resolve to something the resolver swaps
const SWAPPABLE_REQUEST = /^react-native(-web|-unistyles)?($|\/)/

// Re.Pack's runtime (eg. ScriptManager) and Module Federation's load the bundles, they don't render components,
// the Metro resolver keeps react-native, @react-native and react-native-web untouched
const isPassthroughPackage = (packageName: string | undefined) =>
    packageName === '@callstack/repack' || Boolean(packageName?.startsWith('@module-federation/'))

// before Rspack 1.7.5 ConsumeSharedPlugin matched the original request, so a shared react-native wasn't swapped
const MIN_RSPACK_VERSION = [1, 7, 5]

type Alias = Compiler['options']['resolve']['alias']

export const isOlderThan = (version: string, minimum: Array<number>) => {
    // 1.7.5-beta.0+build -> release 1.7.5, prerelease beta.0
    const [release = '', ...prerelease] = version.split('+')[0]!.split('-')
    const parts = release.split('.').map(Number)
    const index = minimum.findIndex((part, partIndex) => part !== (parts[partIndex] ?? 0))

    // a prerelease comes before its release, eg. 1.7.5-beta.0 is older than 1.7.5
    return index === -1 ? prerelease.length > 0 : (parts[index] ?? 0) < minimum[index]!
}

const getPackageName = (filePath: string) => {
    const segments = filePath.split(`${path.sep}node_modules${path.sep}`).at(-1)!.split(path.sep)

    return segments[0]?.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0]
}

// the entry points of Unistyles from its package.json#exports (eg. `.`, `./reanimated`, `./web`) to their source,
// the patterns (`./components/native/*`) and the platform files (eg. `Image.native.tsx`) are left to the resolver
export const getEntryPointAliases = (unistylesRoot: string) => {
    const { exports = {} } = JSON.parse(fs.readFileSync(path.join(unistylesRoot, 'package.json'), 'utf8')) as {
        exports?: Record<string, unknown>
    }

    return Object.fromEntries(
        Object.entries(exports).flatMap(([subpath, conditions]) => {
            const source =
                conditions && typeof conditions === 'object'
                    ? (conditions as Record<string, unknown>)['react-native']
                    : undefined

            if (
                typeof source !== 'string' ||
                subpath.includes('*') ||
                !/^\.\/src\/.+\.tsx?$/.test(source) ||
                /\.(native|ios|android|web)\.tsx?$/.test(source)
            ) {
                return []
            }

            return [[`react-native-unistyles${subpath.slice(1)}$`, path.join(unistylesRoot, source)]]
        }),
    )
}

// the requests a config aliases to react-native (eg. `'@ui/native': 'react-native'`) and what they become,
// Rspack tries the targets of an array in order, react-native is the first one or the alias isn't swapped
const getReactNativeAliases = (alias: Alias) =>
    Object.entries(alias || {}).flatMap(([name, targets]) => {
        const [target] = [targets].flat()

        return typeof target === 'string' && SWAPPABLE_REQUEST.test(target) && !SWAPPABLE_REQUEST.test(name)
            ? [{ exact: name.endsWith('$'), name: name.replace(/\$$/, ''), target }]
            : []
    })

// `react-native/Libraries/Components/View/View?profile` -> the request and `?profile`, the query goes back on the rewritten request
const splitQuery = (request: string): [request: string, query: string] => {
    const index = request.search(/[?#]/)

    return index === -1 ? [request, ''] : [request.slice(0, index), request.slice(index)]
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
        const rspackVersion = compiler.rspack?.rspackVersion

        if (rspackVersion && isOlderThan(rspackVersion, MIN_RSPACK_VERSION)) {
            throw new Error(
                `Unistyles 🦄: ${PLUGIN_NAME} requires @rspack/core ${MIN_RSPACK_VERSION.join('.')} or newer, found ${rspackVersion}. Older versions share react-native before Unistyles can swap its components.`,
            )
        }

        const unistylesRoot = this.unistylesRoot
        const sourceDir = path.join(unistylesRoot, 'src')
        const componentsIndex = path.join(sourceDir, 'components', 'native', 'index.ts')
        const deepComponentsDir = path.join(sourceDir, 'components', 'native', 'deep')

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            // the `browser` field and export condition lead to lib/module, the components import src,
            // aliases keep these requests as they are, so Module Federation shares them
            ...getEntryPointAliases(unistylesRoot),
            [`${COMPONENTS_REQUEST}$`]: componentsIndex,
            [DEEP_COMPONENTS_REQUEST]: deepComponentsDir,
        }

        const toRequest = (filePath: string) => {
            if (filePath === componentsIndex) {
                return COMPONENTS_REQUEST
            }

            return filePath.startsWith(`${deepComponentsDir}${path.sep}`)
                ? `${DEEP_COMPONENTS_REQUEST}/${path.basename(filePath, '.ts')}`
                : filePath
        }

        // set once the setup above went through, Babel runs in Rspack's process or in the loaders' workers,
        // they inherit the env, so the Babel plugin knows that it can't be used together with this plugin
        process.env[METRO_ENV] = RSPACK_INTEGRATION

        const resolveRequest = createResolveRequest({ unistylesRoot, integration: PLUGIN_NAME })
        // warned about once, every module that imports them would repeat the warning
        const unresolvedRequests = new Set<string>()

        compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory) => {
            const { alias } = compiler.options.resolve
            // the resolver factory keeps the config from before apply(), without the aliases above.
            // beforeResolve doesn't tell the type of the dependency, so `import` and `require` resolve alike here:
            // the result only picks what the request becomes, Rspack then resolves it for its dependency type
            const resolver = compiler.resolverFactory.get('normal', { dependencyType: 'esm', alias })
            const reactNativeAliases = getReactNativeAliases(alias)

            // the request as the Metro resolver gets it: an alias of react-native becomes the request it stands for,
            // Metro gets it that way from babel-plugin-module-resolver
            const getModuleName = (request: string, issuer: string) => {
                if (SWAPPABLE_REQUEST.test(request)) {
                    return request
                }

                if (issuer.startsWith(`${unistylesRoot}${path.sep}`) && request.endsWith('/trackDependencies')) {
                    return request
                }

                for (const { exact, name, target } of reactNativeAliases) {
                    if (request === name) {
                        return target
                    }

                    if (!exact && request.startsWith(`${name}/`)) {
                        return `${target}${request.slice(name.length)}`
                    }
                }

                return undefined
            }

            // beforeResolve runs before Module Federation's ConsumeSharedPlugin, so a shared react-native is swapped too
            normalModuleFactory.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
                const [request, query] = splitQuery(resolveData.request)
                const issuer = resolveData.contextInfo?.issuer ?? ''

                // no issuer: an entry or the fallback of a module shared with Module Federation (eg. react-native itself)
                if (!issuer) {
                    return
                }

                const moduleName = getModuleName(request, issuer)

                if (!moduleName || isPassthroughPackage(getPackageName(issuer))) {
                    return
                }

                let resolvedPath: string | undefined

                // the Metro resolver resolves through the context, here with Rspack's resolver
                const context: ResolutionContext = {
                    originModulePath: issuer,
                    resolveRequest: (_context, name): Resolution => {
                        const result = resolver.resolveSync({}, resolveData.context, name)

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
                    resolution = resolveRequest(context, moduleName, null)
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

                if (isSourceFile(resolution) && resolution.filePath !== resolvedPath) {
                    resolveData.request = `${toRequest(resolution.filePath)}${query}`
                }
            })
        })
    }
}
