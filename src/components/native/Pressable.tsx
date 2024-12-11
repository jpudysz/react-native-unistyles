import React, { forwardRef, useEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'
import type { UnistylesValues } from '../../types'

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
    variants?: Variants,
    state: WebPressableState
    scopedTheme?: string
}

const updateStyles = ({ ref, style, state, scopedTheme, variants }: UpdateStylesProps) => {
    const styleResult = typeof style === 'function'
        ? style(state)
        : style
    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const previousVariants = UnistylesShadowRegistry.getVariants()

    UnistylesShadowRegistry.selectVariants(variants as unknown as Variants)
    UnistylesShadowRegistry.setScopedTheme(scopedTheme as any)

    const { hash, injectedClassName } = UnistylesShadowRegistry.addStyles(styleResult)

    const pressableRef = (ref as HTMLDivElement | null)

    pressableRef?.classList.remove(...Array.from(pressableRef.classList))
    pressableRef?.classList.add(hash)
    pressableRef?.classList.add(injectedClassName)

    UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)
    UnistylesShadowRegistry.selectVariants(previousVariants as unknown as Variants)
}

export const Pressable = forwardRef<View, PressableProps>(({ style, ...props }, passedRef) => {
    const storedRef = useRef<View | null>(null)
    const state = useRef<WebPressableState>(initialState)
    const styleRef = useRef(style)
    const scopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const variants = UnistylesShadowRegistry.getVariants()

    useEffect(() => {
        styleRef.current = style
    }, [style])

    useEffect(() => {
        const handler = (newState: Partial<WebPressableState>) => () => {
            state.current = { ...state.current, ...newState }

            updateStyles({
                ref: storedRef.current,
                style: styleRef.current as WebPressableStyle,
                variants: variants as unknown as Variants,
                scopedTheme,
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
                    variants: variants as unknown as Variants,
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
