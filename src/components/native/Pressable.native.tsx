import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'
import { passForwardedRef } from '../../core'

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, forwardedRef) => {
    const storedRef = useRef<View | null>()

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
                const unistyles = typeof style === 'function'
                    ? style({ pressed: false })
                    : style

                UnistylesShadowRegistry.add(ref, unistyles)
                storedRef.current = ref

                return passForwardedRef(props, ref, forwardedRef)
            }}
            style={state => {
                const unistyles = typeof style === 'function'
                    ? style(state)
                    : style
                const styles = Array.isArray(unistyles)
                    ? unistyles
                    : [unistyles]

                if (storedRef.current) {
                    UnistylesShadowRegistry.remove(storedRef.current)
                    UnistylesShadowRegistry.selectVariants(variants)
                    UnistylesShadowRegistry.add(storedRef.current, styles)
                    UnistylesShadowRegistry.selectVariants(undefined)
                }

                return unistyles
            }}
        />
    )
})
