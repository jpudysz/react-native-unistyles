import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>()

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
                storedRef.current = ref

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                const returnFn = typeof passedRef === 'function'
                    ? passedRef(ref)
                    : () => {}

                const unistyles = typeof style === 'function'
                    ? style({ pressed: false })
                    : style

                UnistylesShadowRegistry.add(ref, [unistyles])

                return () => {
                    UnistylesShadowRegistry.remove(ref)

                    if (typeof returnFn === 'function') {
                        returnFn()
                    }
                }
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
