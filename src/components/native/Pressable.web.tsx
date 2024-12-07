import React, { forwardRef, useEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View, ViewStyle } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'

type WebPressableState = {
    pressed: boolean,
    hovered: boolean,
    focused: boolean
}

type WebPressableStyle = ((state: WebPressableState) => ViewStyle) | ViewStyle

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
    style?: WebPressableStyle,
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

type UpdateStylesProps = {
    ref: View | null,
    style: WebPressableStyle,
    variants?: Record<string, string | boolean>,
    state: WebPressableState
}

const extractFunctionArgs = () => {
    // todo refactor me, getBoundArgs is not available anymore
    // return isFunctionWithBoundArgs(styleResult)
    //     ? [styleResult.getBoundArgs()]
    //     : Array.isArray(styleResult)
    //         ? styleResult.map(style => isFunctionWithBoundArgs(style) ? style.getBoundArgs() : [])
    //         : []

    return []
}

const extractStyleResult = (style: any) => {
    return typeof style === 'function'
        ? [style()]
        : Array.isArray(style)
            ? style.map(style => typeof style === 'function' ? style() : style)
            : [style]
}

const updateStyles = ({ ref, style, variants, state }: UpdateStylesProps) => {
    const styleResult = typeof style === 'function'
        ? style(state)
        : style
    const fnArgs = extractFunctionArgs()
    const extractedResult = extractStyleResult(styleResult)

    // @ts-expect-error - this is hidden from TS
    UnistylesShadowRegistry.add(ref, extractedResult, variants, fnArgs)
}

export const Pressable = forwardRef<View, PressableProps>(({ variants, style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>(null)
    const state = useRef<WebPressableState>(initialState)
    const styleRef = useRef(style)

    useEffect(() => {
        styleRef.current = style
    }, [style])

    useEffect(() => {
        const handler = (newState: Partial<WebPressableState>) => () => {
            state.current = { ...state.current, ...newState }

            updateStyles({
                ref: storedRef.current,
                style: styleRef.current as WebPressableStyle,
                variants,
                state: state.current
            })
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
                updateStyles({
                    ref,
                    style: style as WebPressableStyle,
                    variants,
                    state: initialState
                })

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }
            }}
        />
    )
})
