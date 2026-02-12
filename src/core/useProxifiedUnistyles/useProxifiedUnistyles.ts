import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { type UnistylesMiniRuntime, UnistylesRuntime, UnistylesShadowRegistry } from '../../specs'
// It's imported that way because of circular dependency
import { UnistyleDependency } from '../../specs/NativePlatform'
import type { UnistylesTheme } from '../../types'
import { listener } from './listener'

const getMiniRuntime = (): UnistylesMiniRuntime => {
    // @ts-expect-error This is hidden from TS
    return UnistylesRuntime.miniRuntime
}

const RTDependencyMap = {
    breakpoint: UnistyleDependency.Breakpoints,
    colorScheme: UnistyleDependency.ColorScheme,
    contentSizeCategory: UnistyleDependency.ContentSizeCategory,
    hasAdaptiveThemes: UnistyleDependency.AdaptiveThemes,
    insets: UnistyleDependency.Insets,
    fontScale: UnistyleDependency.FontScale,
    isLandscape: UnistyleDependency.Orientation,
    isPortrait: UnistyleDependency.Orientation,
    navigationBar: UnistyleDependency.NavigationBar,
    screen: UnistyleDependency.Dimensions,
    statusBar: UnistyleDependency.StatusBar,
    pixelRatio: UnistyleDependency.PixelRatio,
    themeName: UnistyleDependency.ThemeName,
    rtl: UnistyleDependency.Rtl
} satisfies Partial<Record<keyof UnistylesMiniRuntime, UnistyleDependency>>

export const useProxifiedUnistyles = (forcedTheme?: UnistylesTheme) => {
    const [scopedTheme, setScopedTheme] = useState(forcedTheme ?? UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme)
    const [dependencies] = useState(() => new Set<number>())
    const [theme, setTheme] = useState(UnistylesRuntime.getTheme(scopedTheme))
    const [_, runtimeChanged] = useReducer(() => ({}), {})
    const disposeRef = useRef<VoidFunction>(undefined)
    const syncedDependenciesSizeRef = useRef(-1)
    const syncedScopedThemeRef = useRef<UnistylesTheme | undefined>(undefined)

    const reinitListener = () => {
        disposeRef.current?.()
        disposeRef.current = listener({
            dependencies: Array.from(dependencies),
            updateTheme: () => {
                if (scopedTheme) {
                    return
                }

                setTheme(UnistylesRuntime.getTheme(scopedTheme))
            },
            updateRuntime: (hasThemeNameChange: boolean) => {
                if (hasThemeNameChange && scopedTheme) {
                    return
                }

                runtimeChanged()
            }
        })
    }

    useEffect(() => {
        return () => disposeRef.current?.()
    }, [disposeRef])

    const maybeNewScopedTheme = UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme

    if (scopedTheme && maybeNewScopedTheme && scopedTheme !== maybeNewScopedTheme) {
        setScopedTheme(maybeNewScopedTheme)
    }

    const proxifiedTheme = new Proxy(theme, {
        get: (target, prop) => {
            dependencies.add(UnistyleDependency.Theme)

            return target[prop]
        }
    })
    const proxifiedRuntime = new Proxy(getMiniRuntime(), {
        get: (target, prop) => {
            if (prop === 'insets') {
                return new Proxy(target.insets, {
                    get: (target, prop) => {
                        if (prop === 'ime') {
                            dependencies.add(UnistyleDependency.Ime)

                            return target[prop as keyof typeof target]
                        }

                        dependencies.add(UnistyleDependency.Insets)

                        return target[prop as keyof typeof target]
                    }
                })
            }

            if (prop in RTDependencyMap) {
                dependencies.add(RTDependencyMap[prop as keyof typeof RTDependencyMap])
            }

            if (prop === 'themeName' && scopedTheme) {
                return scopedTheme
            }

            return target[prop as keyof typeof target]
        }
    })

    useLayoutEffect(() => {
        const sameDeps = syncedDependenciesSizeRef.current === dependencies.size
        const sameScopedTheme = syncedScopedThemeRef.current === scopedTheme

        if (sameDeps && sameScopedTheme) {
            return
        }

        syncedDependenciesSizeRef.current = dependencies.size
        syncedScopedThemeRef.current = scopedTheme

        reinitListener()
    }, [proxifiedTheme, proxifiedRuntime, scopedTheme])

    return {
        proxifiedTheme,
        proxifiedRuntime,
        addDependencies: (newDependencies: Array<UnistyleDependency>) => {
            const dependenciesSize = dependencies.size

            newDependencies.forEach(dependency => {
                dependencies.add(dependency)
            })

            if (dependenciesSize === dependencies.size) {
                return
            }

            syncedDependenciesSizeRef.current = dependencies.size
            syncedScopedThemeRef.current = scopedTheme
            reinitListener()
        }
    }
}
