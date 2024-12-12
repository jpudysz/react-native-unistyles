import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View, ViewStyle } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'

type Variants = Record<string, string | boolean | undefined>
type WebPressableState = {
    pressed: boolean,
    hovered: boolean,
    focused: boolean
}

type WebPressableStyle = ((state: WebPressableState) => ViewStyle) | ViewStyle

type PressableProps = Props & {
    variants?: Variants
    style?: WebPressableStyle,
}

const initialState: WebPressableState = {
    pressed: false,
    hovered: false,
    focused: false
}

type UpdateStylesProps = {
    ref: View | null,
    style: WebPressableStyle,
    variants?: Variants,
    state: WebPressableState
    scopedTheme?: string
}

const extractStyleResult = (style: any) => {
    return typeof style === 'function'
        ? [style()]
        : Array.isArray(style)
            ? style.map(style => typeof style === 'function' ? style() : style)
            : [style]
}

const updateStyles = ({ ref, style, state, scopedTheme, variants }: UpdateStylesProps) => {
    const styleResult = typeof style === 'function'
        ? style(state)
        : style
    const extractedResult = extractStyleResult(styleResult)
    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const previousVariants = UnistylesShadowRegistry.getVariants()

    UnistylesShadowRegistry.selectVariants(variants as unknown as Variants)
    UnistylesShadowRegistry.setScopedTheme(scopedTheme as any)

    UnistylesShadowRegistry.add(ref, extractedResult)

    UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)
    UnistylesShadowRegistry.selectVariants(previousVariants as unknown as Variants)
}

export const Pressable = forwardRef<View, PressableProps>(({ style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>(null)
    const scopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const variants = UnistylesShadowRegistry.getVariants()

    return (
        <NativePressableReactNative
            {...props}
            style={state => {
                if (!storedRef.current) {
                    return {}
                }

                updateStyles({
                    ref: storedRef.current,
                    style: style as WebPressableStyle,
                    variants,
                    scopedTheme,
                    state: state as WebPressableState
                })

                return {}
            }}
            ref={ref => {
                storedRef.current = ref
                updateStyles({
                    ref,
                    style: style as WebPressableStyle,
                    variants,
                    scopedTheme,
                    state: initialState
                })

                if (typeof passedRef === 'object' && passedRef !== null) {
                    passedRef.current = ref
                }
            }}
        />
    )
})
