import React, { forwardRef, useRef } from 'react'
import { Pressable as PressableBase, type PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'

type PressableProps = Props & {
    variants?: Record<string, any>
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>()

    return (
        <PressableBase
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

                if (typeof passedRef === 'function') {
                    passedRef(ref)
                }

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, [styleResult], variants, [fnArgs])
            }}
            style={state => {
                const styleResult = typeof style === 'function'
                    ? style(state)
                    : style
                const fnArgs = typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult.getBoundArgs()
                    : []

                console.log(fnArgs)

                if (storedRef.current) {
                    // @ts-expect-error - this is hidden from TS
                    UnistylesShadowRegistry.add(storedRef.current, [styleResult], variants, [fnArgs])
                }

                return styleResult
            }}
        />
    )
})
