import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'

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
                    // @ts-expect-error - this is hidden from TS
                    ? style({ pressed: false })()
                    : style

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, [unistyles])

                return () => {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.remove(ref)

                    if (typeof returnFn === 'function') {
                        returnFn()
                    }
                }
            }}
            style={state => {
                const unistyles = typeof style === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? style(state)()
                    : style

                if (storedRef.current) {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.remove(storedRef.current)
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.add(storedRef.current, [unistyles])
                }

                return Array.isArray(unistyles)
                    ? unistyles.map(style => typeof style === 'function' ? style() : style)
                    : unistyles
            }}
        />
    )
})
