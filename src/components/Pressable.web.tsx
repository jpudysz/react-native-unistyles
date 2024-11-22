import React, { forwardRef, useEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View, ViewStyle } from 'react-native'
import { UnistylesShadowRegistry } from '../specs'

type WebPressableState = {
    pressed: boolean,
    hovered: boolean,
    focused: boolean
}

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
    style?: ((state: WebPressableState) => ViewStyle) | ViewStyle,
}

const initialState: WebPressableState = {
    pressed: false,
    hovered: false,
    focused: false
}

const events = {
    'pointerdown': { pressed: true },
    'pointerup': { pressed: false },
    'pointerenter': { hovered: true },
    'pointerleave': { hovered: false },
    'focus': { focused: true },
    'blur': { focused: false }
} satisfies Partial<Record<keyof HTMLElementEventMap, Partial<WebPressableState>>>

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>()
    const state = useRef<WebPressableState>(initialState)
    const styleRef = useRef(style)

    useEffect(() => {
        styleRef.current = style
    }, [style])

    useEffect(() => {
        const handler = (newState: Partial<WebPressableState>) => () => {
            state.current = { ...state.current, ...newState }

            const styleResult = typeof styleRef.current === 'function'
                ? styleRef.current(state.current)
                : styleRef.current
            const fnArgs = typeof styleResult === 'function'
                // @ts-expect-error - this is hidden from TS
                ? styleResult.getBoundArgs()
                : []
            const extractedResult = typeof styleResult === 'function'
                ? (styleResult as Function)()
                : styleResult

            // @ts-expect-error - this is hidden from TS
            UnistylesShadowRegistry.add(storedRef.current, [extractedResult], variants, [fnArgs])
        }

        if (!storedRef.current) {
            return
        }

        // ref on the web is dom element
        const ref = storedRef.current as unknown as HTMLDivElement

        Object.entries(events).forEach(([event, state]) => {
            ref.addEventListener(event, handler(state))
        })

        return () => {
            Object.entries(events).forEach(([event, state]) => {
                ref.removeEventListener(event, handler(state))
            })
        }
    }, [])

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
                storedRef.current = ref
                const styleResult = typeof style === 'function'
                    ? style(initialState)
                    : style
                const fnArgs = typeof styleResult === 'function'
                    // @ts-expect-error - this is hidden from TS
                    ? styleResult.getBoundArgs()
                    : []
                const extractedResult = typeof styleResult === 'function'
                    ? (styleResult as Function)()
                    : styleResult

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, [extractedResult], variants, [fnArgs])
            }}
        />
    )
})
