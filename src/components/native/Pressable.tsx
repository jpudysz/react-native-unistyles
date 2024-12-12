import React, { forwardRef, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'
import type { UnistylesTheme, UnistylesValues } from '../../types'

type Variants = Record<string, string | boolean | undefined>
type WebPressableState = {
    pressed: boolean,
    hovered: boolean,
    focused: boolean
}

type WebPressableStyle = ((state: WebPressableState) => UnistylesValues) | UnistylesValues

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
    scopedTheme?: UnistylesTheme
}

const updateStyles = ({ ref, style, state, scopedTheme, variants }: UpdateStylesProps) => {
    const styleResult = typeof style === 'function'
        ? style(state)
        : style
    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const previousVariants = UnistylesShadowRegistry.getVariants()

    UnistylesShadowRegistry.selectVariants(variants)
    UnistylesShadowRegistry.setScopedTheme(scopedTheme)

    const { hash, injectedClassName } = UnistylesShadowRegistry.addStyles(styleResult)
    const pressableRef = (ref as HTMLDivElement | null)

    pressableRef?.classList.remove(...Array.from(pressableRef.classList))
    pressableRef?.classList.add(hash)

    if (injectedClassName) {
        pressableRef?.classList.add(injectedClassName)
    }

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
