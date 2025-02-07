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
        .find(key => key.startsWith('unistyles-'))

    if (!unistyleKey) {
        return styleProps
    }

    return {
        // styles without C++ state
        ...styleProps[unistyleKey].uni__getStyles(),
        [unistyleKey]: styleProps[unistyleKey].uni__getStyles()
    }
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, forwardedRef) => {
    const storedRef = useRef<View | null>()

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
                const unistyles = typeof style === 'function'
                    ? style({ pressed: false })
                    : style

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, unistyles)

                if (ref) {
                    storedRef.current = ref
                }

                return passForwardedRef(props, ref, forwardedRef)
            }}
            style={state => {
                const unistyles = typeof style === 'function'
                    ? style.call(style, state)
                    : getStyles(style as unknown as Record<string, any>)

                if (!storedRef.current) {
                    return unistyles
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.remove(storedRef.current)
                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(storedRef.current, unistyles)

                return unistyles
            }}
        />
    )
})
