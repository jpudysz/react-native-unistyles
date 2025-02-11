import { useEffect, useReducer, useRef, useState } from 'react'
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
} satisfies Partial<Record<keyof UnistylesMiniRuntime, UnistyleDependency>>

export const useProxifiedUnistyles = (forcedTheme?: UnistylesTheme) => {
    const scopedTheme = forcedTheme ?? UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme
    const [dependencies] = useState(() => new Set<number>())
    const [theme, setTheme] = useState(UnistylesRuntime.getTheme(scopedTheme))
    const [_, runtimeChanged] = useReducer(() => ({}), {})
    const disposeRef = useRef<VoidFunction>()

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
            updateRuntime: () => runtimeChanged()
        })
    }

    useEffect(() => {
        reinitListener()

        return () => disposeRef.current?.()
    }, [dependencies.size])

    const proxifiedTheme = new Proxy(theme, {
        get: (target, prop) => {
            dependencies.add(UnistyleDependency.Theme)

            return target[prop]
        }
    })
    const proxifiedRuntime = new Proxy(getMiniRuntime(), {
        get: (target, prop) => {
            if (prop in RTDependencyMap) {
                dependencies.add(RTDependencyMap[prop as keyof typeof RTDependencyMap])
            }

            return target[prop as keyof typeof target]
        }
    })

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

            reinitListener()
        }
    }
}
