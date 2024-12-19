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
                const styles = Array.isArray(unistyles)
                    ? unistyles
                    : [unistyles]

                // @ts-expect-error web types are not compatible with RN styles
                UnistylesShadowRegistry.add(ref, styles)
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

                if (!storedRef.current) {
                    return unistyles
                }

                if (state.pressed) {
                    UnistylesShadowRegistry.selectVariants(variants)
                }

                UnistylesShadowRegistry.remove(storedRef.current)
                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(storedRef.current, styles)

                return unistyles
            }}
        />
    )
})
