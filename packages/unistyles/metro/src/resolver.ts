import fs from 'node:fs'
import nodePath from 'node:path'

import type { Resolution, ResolveRequest } from './types'

import { REACT_NATIVE_COMPONENT_NAMES } from '../../plugin/src/consts'

// modules imported directly, eg. `react-native/Libraries/Components/View/View` or `react-native-web/dist/exports/View`,
// they resolve to src/components/native/deep, the native components keep the other exports of their React Native module
export const DEEP_IMPORTS = [...REACT_NATIVE_COMPONENT_NAMES, 'ViewNativeComponent', 'TextNativeComponent']

// packages that implement the components Unistyles wraps, their imports stay untouched
const PASSTHROUGH_PACKAGES = ['react-native', '@react-native', 'react-native-web']

type ResolverConfig = {
    // real path of the react-native-unistyles package
    unistylesRoot: string
    // resolveRequest of the user's Metro config
    upstream?: ResolveRequest | null
    // replaced by path.win32 in tests
    path?: typeof nodePath.posix
    // replaced in tests
    realpath?: (filePath: string) => string
}

const getRealPath = (filePath: string) => {
    try {
        return fs.realpathSync(filePath)
    } catch {
        return filePath
    }
}

export const createResolveRequest = ({
    unistylesRoot,
    upstream,
    path = nodePath,
    realpath = getRealPath,
}: ResolverConfig): ResolveRequest => {
    const { sep } = path
    const sourceDir = path.join(unistylesRoot, 'src')
    const componentsDir = path.join(sourceDir, 'components', 'native')
    const componentsIndex = path.join(componentsDir, 'index.ts')
    // there is no Babel plugin, Unistyles records the dependencies of every StyleSheet while it runs
    const trackDependencies = path.join(sourceDir, 'core', 'trackDependencies.ts')
    const trackDependenciesWithMetro = path.join(sourceDir, 'core', 'trackDependencies.metro.ts')
    const builds = [path.join(unistylesRoot, 'lib', 'module'), path.join(unistylesRoot, 'lib', 'commonjs')]

    // Unistyles resolves to its source or to a build depending on the import (eg. `import` -> lib/module, `require` -> src),
    // a bundle has to use one copy only, so the swapped components share state with the app (eg. ScopedTheme's context)
    const getSourcePath = (filePath: string) => {
        const build = builds.find((buildDir) => filePath.startsWith(`${buildDir}${sep}`))

        if (!build) {
            return undefined
        }

        // lib/module/components/native/View.native.js -> src/components/native/View, Metro picks the platform's file
        const modulePath = filePath
            .slice(build.length + 1)
            .replace(/\.js$/, '')
            .replace(/\.(native|ios|android|web)$/, '')

        return path.join(sourceDir, modulePath)
    }

    const getPackageName = (filePath: string) => {
        const parts = filePath.split(`${sep}node_modules${sep}`)

        if (parts.length === 1) {
            return undefined
        }

        const segments = parts.at(-1)!.split(sep)

        return segments[0]?.startsWith('@') ? `${segments[0]}${sep}${segments[1]}` : segments[0]
    }

    const nestedModules = path.join(unistylesRoot, 'node_modules')

    const shouldSwapFrom = (originModulePath: string) => {
        // Unistyles renders the components it swaps, its dependencies are libraries like any other
        if (
            originModulePath.startsWith(`${unistylesRoot}${sep}`) &&
            !originModulePath.startsWith(`${nestedModules}${sep}`)
        ) {
            return false
        }

        const packageName = getPackageName(originModulePath)

        return !PASSTHROUGH_PACKAGES.some((name) => packageName === name || packageName?.startsWith(`${name}${sep}`))
    }

    const getDeepImport = (filePath: string) => {
        const segments = filePath.split(sep)

        // react-native-web/dist/exports/View/index.js
        if (segments.at(-5) === 'react-native-web' && segments.at(-4) === 'dist' && segments.at(-3) === 'exports') {
            return segments.at(-2)
        }

        // react-native/Libraries/Components/View/View.js, react-native/Libraries/Image/Image.ios.js
        if (filePath.includes(`${sep}react-native${sep}Libraries${sep}`)) {
            return segments.at(-1)?.split('.').at(0)
        }

        return undefined
    }

    const getSwapTarget = (moduleName: string, filePath: string) => {
        // babel-preset-expo imports names that react-native-web doesn't export from its index
        if (moduleName === 'react-native' || filePath.endsWith(`${sep}react-native-web${sep}dist${sep}index.js`)) {
            return componentsIndex
        }

        const deepImport = getDeepImport(filePath)

        return deepImport && DEEP_IMPORTS.includes(deepImport)
            ? path.join(componentsDir, 'deep', `${deepImport}.ts`)
            : undefined
    }

    // real path of every react-native-unistyles in node_modules that isn't unistylesRoot
    const copies = new Map<string, string>()
    const packageDir = `${sep}node_modules${sep}react-native-unistyles${sep}`

    // the same Unistyles through a symlink resolves to unistylesRoot, so its swaps apply
    // another copy (eg. nested in a library's node_modules) has its own registry and runs without tracking, so it can't update
    const toUnistylesPath = (filePath: string) => {
        if (filePath.startsWith(`${unistylesRoot}${sep}`)) {
            return filePath
        }

        const index = filePath.lastIndexOf(packageDir)

        if (index === -1) {
            return filePath
        }

        const copyRoot = filePath.slice(0, index + packageDir.length - 1)

        if (!copies.has(copyRoot)) {
            const realCopyRoot = realpath(copyRoot)

            copies.set(copyRoot, realCopyRoot)

            if (realCopyRoot !== unistylesRoot) {
                console.warn(
                    `Unistyles 🦄: Found a second copy of react-native-unistyles at ${realCopyRoot}, withUnistylesConfig handles only ${unistylesRoot}. Styles of the second copy won't update, make sure that your app installs react-native-unistyles once.`,
                )
            }
        }

        const copyPath = filePath.slice(copyRoot.length + 1)

        // a dependency installed inside the copy isn't Unistyles
        return copies.get(copyRoot) === unistylesRoot && !copyPath.startsWith(`node_modules${sep}`)
            ? path.join(unistylesRoot, copyPath)
            : filePath
    }

    const withTrackedDependencies = (resolution: Resolution): Resolution =>
        resolution.type === 'sourceFile' && 'filePath' in resolution && resolution.filePath === trackDependencies
            ? { type: 'sourceFile', filePath: trackDependenciesWithMetro }
            : resolution

    return (context, moduleName, platform) => {
        const resolve = upstream ?? context.resolveRequest
        const upstreamResolution = resolve(context, moduleName, platform)

        if (upstreamResolution.type !== 'sourceFile' || !('filePath' in upstreamResolution)) {
            return upstreamResolution
        }

        const filePath = toUnistylesPath(upstreamResolution.filePath)
        const resolution: Resolution =
            filePath === upstreamResolution.filePath ? upstreamResolution : { type: 'sourceFile', filePath }

        const sourcePath = getSourcePath(resolution.filePath)

        if (sourcePath) {
            return withTrackedDependencies(resolve(context, sourcePath, platform))
        }

        if (resolution.filePath === trackDependencies) {
            return withTrackedDependencies(resolution)
        }

        if (!shouldSwapFrom(toUnistylesPath(context.originModulePath))) {
            return resolution
        }

        const swapTarget = getSwapTarget(moduleName, resolution.filePath)

        return swapTarget ? { type: 'sourceFile', filePath: swapTarget } : resolution
    }
}
