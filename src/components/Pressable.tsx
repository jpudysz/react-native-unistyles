import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative, type PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'

type PressableProps = Props & {
    variants?: Record<string, any>
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, passedRef) => {
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
                const extractedStyleResult = typeof styleResult === 'function'
                    ? (styleResult as Function)()
                    : styleResult

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                const returnFn = typeof passedRef === 'function'
                    ? passedRef(ref)
                    : () => {}

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, [extractedStyleResult], variants, [fnArgs])

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
                const extractedStyleResult = typeof styleResult === 'function'
                    ? (styleResult as Function)()
                    : styleResult

                if (storedRef.current) {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.add(storedRef.current, [extractedStyleResult], variants, [fnArgs])
                }

                return extractedStyleResult
            }}
        />
    )
})
