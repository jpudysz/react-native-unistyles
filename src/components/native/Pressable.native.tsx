import React, { forwardRef, useLayoutEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'
import { passForwardedRef } from '../../core'

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
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

                // @ts-expect-error web types are not compatible with RN styles
                UnistylesShadowRegistry.add(ref, unistyles)

                if (ref) {
                    storedRef.current = ref
                }

                return passForwardedRef(props, ref, forwardedRef)
            }}
            style={state => {
                const unistyles = typeof style === 'function'
                    ? style(state)
                    : style

                if (!storedRef.current) {
                    return unistyles
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(storedRef.current, unistyles)

                return unistyles
            }}
        />
    )
})
