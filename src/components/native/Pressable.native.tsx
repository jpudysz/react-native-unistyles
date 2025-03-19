import React, { forwardRef, useLayoutEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { passForwardedRef } from '../../core'
import { UnistylesShadowRegistry } from '../../specs'

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
}

const getStyles = (styleProps: Record<string, any> = {}) => {
    const unistyleKey = Object
        .keys(styleProps)
        .find(key => key.startsWith('unistyles_'))

    if (!unistyleKey) {
        return styleProps
    }

    return {
        // styles without C++ state
        ...styleProps[unistyleKey].uni__getStyles(),
        [unistyleKey]: styleProps[unistyleKey]
    }
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, forwardedRef) => {
    const storedRef = useRef<View | null>(null)
    const scopedTheme = UnistylesShadowRegistry.getScopedTheme()

    useLayoutEffect(() => {
        return () => {
            if (storedRef.current) {
                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.remove(storedRef.current)
            }
        }
    }, [])

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
                const isPropStyleAFunction = typeof style === 'function'
                const unistyles = isPropStyleAFunction
                    ? style.call(style, { pressed: false })
                    : getStyles(style as unknown as Record<string, any>)

                if (ref) {
                    storedRef.current = ref
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, unistyles)

                return passForwardedRef(props, ref, forwardedRef)
            }}
            style={state => {
                const isPropStyleAFunction = typeof style === 'function'
                const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

                UnistylesShadowRegistry.setScopedTheme(scopedTheme)

                const unistyles = isPropStyleAFunction
                    ? style.call(style, state)
                    : getStyles(style as unknown as Record<string, any>)

                if (!storedRef.current) {
                    return unistyles
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.remove(storedRef.current)

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(storedRef.current, unistyles)

                UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)

                return unistyles
            }}
        />
    )
})
