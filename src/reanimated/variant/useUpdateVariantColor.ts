import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { runOnUI, useSharedValue } from 'react-native-reanimated'
import { UnistyleDependency } from '../../specs'
import type { UnistylesValues } from '../../types'
import { services } from '../../web/services'
import { getClosestBreakpointValue } from '../../web/utils'
import type { UseUpdateVariantColorConfig } from './types'

export const useUpdateVariantColor = <T extends Record<string, any>>({
    animateCallback,
    colorKey,
    style
}: UseUpdateVariantColorConfig<T>) => {
    const [dummyDiv] = useState(() => {
        const div = document.createElement('div')

        div.style.display = 'none'
        document.body.appendChild(div)

        return div
    })
    const parsedStyles = useMemo(() => {
        return services.shadowRegistry.addStyles([style]).parsedStyles
    }, [style])
    const getCurrentColor = useCallback(
        () => {
            if (!parsedStyles) {
                return 'rgb(0, 0, 0)'
            }

            const currentColor = parsedStyles[colorKey as keyof UnistylesValues] as string | Record<string, string>
            const currentColorVar = typeof currentColor === 'string'
                ? currentColor
                : getClosestBreakpointValue<string>(services.runtime, currentColor) ?? 'rgb(0, 0, 0)'

            if (currentColorVar.startsWith('var(--')) {
                dummyDiv.style.color = currentColorVar

                return getComputedStyle(dummyDiv).color
            }

            return currentColorVar
        },
        [style, colorKey]
    )
    const fromValue = useSharedValue<string>(getCurrentColor())
    const toValue = useSharedValue<string>(getCurrentColor())

    useEffect(() => {
        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () => {
            runOnUI(() => {
                animateCallback?.(toValue.get(), getCurrentColor())
            })()
        })

        return () => dispose()
    }, [style, colorKey])

    useLayoutEffect(() => {
        animateCallback?.(toValue.get(), getCurrentColor())

        const colorStyle = parsedStyles?.[colorKey as keyof UnistylesValues]

        if (typeof colorStyle !== 'object' || colorStyle === null) {
            return
        }

        const dispose = services.listener.addListeners([UnistyleDependency.Breakpoints], () => {
            animateCallback?.(toValue.get(), getCurrentColor())
        })

        return () => dispose()
    }, [style, colorKey])

    console.log('render')

    useEffect(() => () => dummyDiv.remove(), [])

    return {
        fromValue,
        toValue
    }
}
