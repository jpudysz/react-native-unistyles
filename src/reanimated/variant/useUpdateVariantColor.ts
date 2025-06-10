import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { runOnUI, useSharedValue } from 'react-native-reanimated'
import { useUnistyles } from '../../core'
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
    const { rt } = useUnistyles()
    const [dummyDiv] = useState(() => {
        const div = document.createElement('div')

        div.style.display = 'none'
        document.body.appendChild(div)

        return div
    })
    const getCurrentColor = useCallback(
        () => {
            const { parsedStyles } = services.shadowRegistry.addStyles([style])

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
        if (services.state.CSSVars) {
            return
        }

        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () => {
            runOnUI(() => {
                animateCallback?.(toValue.value, getCurrentColor())
            })()
        })

        return () => dispose()
    }, [style, colorKey])

    useLayoutEffect(() => {
        animateCallback?.(toValue.value, getCurrentColor())
    }, [style, colorKey, rt.breakpoint])

    useEffect(() => () => dummyDiv.remove(), [])

    return {
        fromValue,
        toValue
    }
}
