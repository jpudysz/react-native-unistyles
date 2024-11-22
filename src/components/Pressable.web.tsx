import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative, type PressableProps as Props, type View, type ViewStyle } from 'react-native'
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
    const pressableState = useRef<WebPressableState>(initialState)

    const styleEvents = (ref: HTMLDivElement | null) => {
        if (!ref) {
            return
        }

        const handler = (newState: Partial<WebPressableState>) => async () => {
            pressableState.current = { ...pressableState.current, ...newState }

            const styleResult = typeof style === 'function'
                ? style(pressableState.current)
                : style
            const fnArgs = typeof styleResult === 'function'
                // @ts-expect-error - this is hidden from TS
                ? styleResult.getBoundArgs()
                : []
            const extractedResult = typeof styleResult === 'function'
                ? (styleResult as Function)()
                : styleResult

            // @ts-expect-error - this is hidden from TS
            UnistylesShadowRegistry.add(ref, [extractedResult], variants, [fnArgs])
        }

        Object.entries(events).forEach(([event, state]) => {
            ref.addEventListener(event, handler(state))
        })

        return () => {
            Object.entries(events).forEach(([event, state]) => {
                ref.removeEventListener(event, handler(state))
            })
        }
    }

    return (
        <NativePressableReactNative
            {...props}
            ref={ref => {
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

                const returnFn = typeof passedRef === 'function'
                    ? passedRef(ref)
                    : () => {}

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(ref, [extractedResult], variants, [fnArgs])
                const dispose = styleEvents(ref as unknown as HTMLDivElement)

                return () => {
                    dispose?.()

                    if (typeof returnFn === 'function') {
                        returnFn()
                    }
                }
            }}
        />
    )
})
