import type { PressableProps as Props, View } from 'react-native'

import React, { forwardRef, useContext } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'

import type { UnistylesValues } from '../../types'

import { getClassName } from '../../core'
import { UnistylesShadowRegistry } from '../../specs'
import { isServer } from '../../web/utils'
import { ScopedThemeContext, getScopedThemeName } from '../ScopedThemeContext'

type Variants = Record<string, string | boolean | undefined>
type WebPressableState = {
    pressed: boolean
    hovered: boolean
    focused: boolean
}

type WebPressableStyle = ((state: WebPressableState) => UnistylesValues) | UnistylesValues

// instance type of View for both legacy and Strict TypeScript API (RN 0.87+)
type ViewRef = React.ComponentRef<typeof View>

type PressableProps = Props & {
    variants?: Variants
    style?: WebPressableStyle
}

export const Pressable: React.ForwardRefExoticComponent<PressableProps & React.RefAttributes<ViewRef>> = forwardRef<
    ViewRef,
    PressableProps
>(({ style, ...props }, forwardedRef) => {
    const scopedTheme = getScopedThemeName(useContext(ScopedThemeContext))
    let storedRef: HTMLElement | null = null
    let classNames: ReturnType<typeof getClassName> | undefined = undefined

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
