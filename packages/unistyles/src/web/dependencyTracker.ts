import type { UnistylesMiniRuntime } from '../specs'

import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'

// Without the Babel plugin (react-native-unistyles/metro) StyleSheets don't carry `uni__dependencies`.
// Instead, the mini runtime records what a StyleSheet or a dynamic function reads while it runs.
const scopes: Array<Set<UnistyleDependency>> = []

// the same table as TrackedMiniRuntime in cxx/core/DependencyTracker.h
export const MINI_RUNTIME_DEPENDENCIES: Partial<Record<string, UnistyleDependency>> = {
    themeName: UnistyleDependency.ThemeName,
    breakpoint: UnistyleDependency.Breakpoints,
    hasAdaptiveThemes: UnistyleDependency.AdaptiveThemes,
    colorScheme: UnistyleDependency.ColorScheme,
    screen: UnistyleDependency.Dimensions,
    contentSizeCategory: UnistyleDependency.ContentSizeCategory,
    pixelRatio: UnistyleDependency.PixelRatio,
    fontScale: UnistyleDependency.FontScale,
    rtl: UnistyleDependency.Rtl,
    statusBar: UnistyleDependency.StatusBar,
    navigationBar: UnistyleDependency.NavigationBar,
    isPortrait: UnistyleDependency.Orientation,
    isLandscape: UnistyleDependency.Orientation,
    // insets are tracked by their own object, ime is a separate dependency
}

const recordDependency = (dependency: UnistyleDependency) => {
    scopes.at(-1)?.add(dependency)
}

// runs the function and returns every dependency it read, reads outside of any scope are ignored
export const trackDependencies = <T>(fn: () => T) => {
    const dependencies = new Set<UnistyleDependency>()

    scopes.push(dependencies)

    try {
        return { result: fn(), dependencies: Array.from(dependencies) }
    } finally {
        scopes.pop()
    }
}

// eg. rt.screen.width -> Dimensions, rt.insets.top -> Insets, rt.insets.ime -> Ime
export const createTrackedMiniRuntime = (miniRuntime: UnistylesMiniRuntime): UnistylesMiniRuntime => {
    const insets = new Proxy(miniRuntime.insets, {
        get: (target, property, receiver) => {
            if (typeof property === 'string' && property in target) {
                recordDependency(property === 'ime' ? UnistyleDependency.Ime : UnistyleDependency.Insets)
            }

            return Reflect.get(target, property, receiver)
        },
    })

    return new Proxy(miniRuntime, {
        get: (target, property, receiver) => {
            const dependency = typeof property === 'string' ? MINI_RUNTIME_DEPENDENCIES[property] : undefined

            if (dependency !== undefined) {
                recordDependency(dependency)
            }

            if (property === 'insets') {
                return insets
            }

            return Reflect.get(target, property, receiver)
        },
    })
}
