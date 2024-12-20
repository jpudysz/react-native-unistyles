import React, { forwardRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import type { PressableProps as Props, View } from 'react-native'
import { UnistylesShadowRegistry } from '../../specs'
import type { UnistylesValues } from '../../types'
import { getClassName } from '../../core'
import { isServer } from '../../web/utils'

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

export const Pressable = forwardRef<View, PressableProps>(({ style, ...props }, forwardedRef) => {
    const scopedTheme = UnistylesShadowRegistry.getScopedTheme()
    const variants = UnistylesShadowRegistry.getVariants()
    let storedRef: HTMLElement | null = null
    let classNames: ReturnType<typeof getClassName> | undefined = undefined

    return (
        <NativePressableReactNative
            {...props}
            ref={isServer() ? undefined : ref => {
                storedRef = ref as unknown as HTMLElement
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(storedRef, classNames?.hash)

                if (typeof forwardedRef === 'function') {
                    return forwardedRef(ref)
                }

                if (forwardedRef) {
                    forwardedRef.current = ref
                }
            }}
            style={state => {
                const styleResult = typeof style === 'function'
                    ? style(state as WebPressableState)
                    : style
                const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()
                const previousVariants = UnistylesShadowRegistry.getVariants()

                UnistylesShadowRegistry.selectVariants(variants)
                UnistylesShadowRegistry.setScopedTheme(scopedTheme)

                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.remove(storedRef, classNames?.hash)
                classNames = getClassName(styleResult as UnistylesValues)
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(storedRef, classNames?.hash)

                UnistylesShadowRegistry.selectVariants(previousVariants)
                UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)

                return classNames as any
            }}
        />
    )
})
