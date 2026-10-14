import nodePath from 'node:path'

import type { ResolveRequest } from './types'

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
}

export const createResolveRequest = ({ unistylesRoot, upstream, path = nodePath }: ResolverConfig): ResolveRequest => {
    const { sep } = path
    const sourceDir = path.join(unistylesRoot, 'src')
    const componentsDir = path.join(sourceDir, 'components', 'native')
    const componentsIndex = path.join(componentsDir, 'index.ts')
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

    const shouldSwapFrom = (originModulePath: string) => {
        // Unistyles renders the components it swaps
        if (originModulePath.startsWith(`${unistylesRoot}${sep}`)) {
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

    return (context, moduleName, platform) => {
        const resolve = upstream ?? context.resolveRequest
        const resolution = resolve(context, moduleName, platform)

        if (resolution.type !== 'sourceFile' || !('filePath' in resolution)) {
            return resolution
        }

        const sourcePath = getSourcePath(resolution.filePath)

        if (sourcePath) {
            return resolve(context, sourcePath, platform)
        }

        if (!shouldSwapFrom(context.originModulePath)) {
            return resolution
        }

        const swapTarget = getSwapTarget(moduleName, resolution.filePath)

        return swapTarget ? { type: 'sourceFile', filePath: swapTarget } : resolution
    }
}
