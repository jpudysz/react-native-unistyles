import type { PressableProps as Props, View } from 'react-native'

import React, { forwardRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'
import {
    getServerUnistylesStyle,
    isReactServerComponentRender,
} from 'react-native-unistyles/internal/server-unistyles-style'

import type { UnistylesValues } from '../../types'

import { getClassName } from '../../core/getClassname'
import { UnistylesShadowRegistry } from '../../specs'
import { isServer } from '../../web/utils'

type Variants = Record<string, string | boolean | undefined>
type WebPressableState = {
    pressed: boolean
    hovered: boolean
    focused: boolean
}

type WebPressableStyle = ((state: WebPressableState) => UnistylesValues) | UnistylesValues

type PressableProps = Props & {
    variants?: Variants
    style?: WebPressableStyle
}

export const Pressable = forwardRef<View, PressableProps>(({ style, ...props }, forwardedRef) => {
    const scopedTheme = UnistylesShadowRegistry.getScopedTheme()
    let storedRef: HTMLElement | null = null
    let classNames: ReturnType<typeof getClassName> | undefined = undefined

    if (isReactServerComponentRender()) {
        const styleResult =
            typeof style === 'function'
                ? style({
                      focused: false,
                      hovered: false,
                      pressed: false,
                  })
                : style
        const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

        UnistylesShadowRegistry.setScopedTheme(scopedTheme)
        classNames = getClassName(styleResult as UnistylesValues)
        UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)

        return (
            <>
                {getServerUnistylesStyle([classNames])}
                <NativePressableReactNative {...props} style={classNames as any} />
            </>
        )
    }

    return (
        <NativePressableReactNative
            {...props}
            ref={
                isServer()
                    ? undefined
                    : (ref) => {
                          storedRef = ref as unknown as HTMLElement
                          // @ts-expect-error hidden from TS
                          UnistylesShadowRegistry.add(storedRef, classNames?.hash)

                          if (typeof forwardedRef === 'function') {
                              return forwardedRef(ref)
                          }

                          if (forwardedRef) {
                              forwardedRef.current = ref
                          }
                      }
            }
            style={(state) => {
                const styleResult = typeof style === 'function' ? style(state as WebPressableState) : style
                const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

                UnistylesShadowRegistry.setScopedTheme(scopedTheme)

                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.remove(storedRef, classNames?.hash)
                classNames = getClassName(styleResult as UnistylesValues)
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(storedRef, classNames?.hash)

                UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)

                return classNames as any
            }}
        />
    )
})
