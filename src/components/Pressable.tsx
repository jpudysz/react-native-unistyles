import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative, type PressableStateCallbackType } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'
import { getId } from '../core'

type PressableProps = Props & {
    rawStyle?: Array<any> | ((event: PressableStateCallbackType) => Array<any>)
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
                    : Array.isArray(styleResult)
                        ? styleResult
                            // @ts-expect-error - this is hidden from TS
                            .map(style => typeof style === 'function' ? style.getBoundArgs() : [])
                        : []

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                const returnFn = typeof passedRef === 'function'
                    ? passedRef(ref)
                    : () => {}
                const unistyles = typeof rawStyle === 'function'
                    ? rawStyle({ pressed: false })
                    : (rawStyle ?? [])

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, unistyles, variants, Array.isArray(styleResult) ? fnArgs : [fnArgs])

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
                    : Array.isArray(styleResult)
                        ? styleResult
                            // @ts-expect-error - this is hidden from TS
                            .map(style => typeof style === 'function' ? style.getBoundArgs() : [])
                        : []
                const pressId = getId()
                const unistyles = typeof rawStyle === 'function'
                    ? rawStyle(state)
                    : (rawStyle ?? [])

                if (storedRef.current) {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.remove(storedRef.current)
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.add(storedRef.current, unistyles, variants, Array.isArray(styleResult) ? fnArgs : [fnArgs], pressId)
                }

                return typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult(pressId)
                    : Array.isArray(styleResult)
                        // @ts-expect-error - this is hidden from TS
                        ? styleResult.map(style => typeof style === 'function' ? style(pressId) : style)
                        : styleResult
            }}
        />
    )
})
