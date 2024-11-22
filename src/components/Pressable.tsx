import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { getId } from '../core'

type PressableProps = Props & {
    rawStyle?: Array<any>
    variants?: Record<string, string | boolean>
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, rawStyle, ...props }, passedRef) => {
    const storedRef = useRef<View | null>()

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
                storedRef.current = ref
                const styleResult = typeof style === 'function'
                    ? style({ pressed: false })
                    : style
                const fnArgs = typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult.getBoundArgs()
                    : []

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                const returnFn = typeof passedRef === 'function'
                    ? passedRef(ref)
                    : () => {}

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, rawStyle ?? [], variants, [fnArgs])

                return () => {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.remove(ref)

                    if (typeof returnFn === 'function') {
                        returnFn()
                    }
                }
            }}
            style={state => {
                const styleResult = typeof style === 'function'
                    ? style(state)
                    : style
                const fnArgs = typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult.getBoundArgs()
                    : []
                const pressId = getId()

                if (storedRef.current) {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.remove(storedRef.current)
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.add(storedRef.current, rawStyle ?? [], variants, [fnArgs], pressId)
                }

                return typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult(pressId)
                    : styleResult
            }}
        />
    )
})
