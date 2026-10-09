import type { PressableProps as Props, View } from 'react-native'

import React, { forwardRef, useContext, useLayoutEffect, useRef } from 'react'
import { Pressable as NativePressableReactNative } from 'react-native'

import type { Nullable } from '../../types'

import { passForwardedRef } from '../../core'
import { UnistylesShadowRegistry } from '../../specs'
import { ScopedThemeContext } from '../ScopedThemeContext'

// instance type of View for both legacy and Strict TypeScript API (RN 0.87+)
type ViewRef = React.ComponentRef<typeof View>

type PressableProps = Props & {
    variants?: Record<string, string | boolean>
}

const getStyles = (styleProps: Record<string, any> = {}) => {
    const unistyleKey = Object.keys(styleProps).find((key) => key.startsWith('unistyles_'))

    if (!unistyleKey) {
        return styleProps
    }

    return {
        // styles without C++ state
        ...styleProps[unistyleKey].uni__getStyles(),
        [unistyleKey]: styleProps[unistyleKey],
    }
}

export const Pressable: React.ForwardRefExoticComponent<PressableProps & React.RefAttributes<ViewRef>> = forwardRef<
    ViewRef,
    PressableProps
>(({ variants, style, ...props }, forwardedRef) => {
    const storedRef = useRef<Nullable<ViewRef>>(null)
    const scope = useContext(ScopedThemeContext)

    useLayoutEffect(() => {
        return () => {
            if (storedRef.current) {
                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.remove(storedRef.current)
            }
        }
    }, [])

    return (
        <NativePressableReactNative
            {...props}
            ref={(ref) => {
                const isPropStyleAFunction = typeof style === 'function'
                const unistyles = isPropStyleAFunction
                    ? style.call(style, { pressed: false })
                    : getStyles(style as unknown as Record<string, any>)

                if (ref) {
                    storedRef.current = ref
                }

                return passForwardedRef(
                    ref,
                    forwardedRef,
                    () => {
                        // @ts-expect-error - this is hidden from TS
                        UnistylesShadowRegistry.add(ref, unistyles, scope)
                    },
                    () => {
                        // @ts-expect-error - this is hidden from TS
                        UnistylesShadowRegistry.remove(ref)
                    },
                )
            }}
            style={(state) => {
                const isPropStyleAFunction = typeof style === 'function'
                const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

                UnistylesShadowRegistry.setScopedTheme(scope?.name)

                const unistyles = isPropStyleAFunction
                    ? style.call(style, state)
                    : getStyles(style as unknown as Record<string, any>)

                if (!storedRef.current) {
                    return unistyles
                }

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.remove(storedRef.current)

                // @ts-expect-error - this is hidden from TS
                UnistylesShadowRegistry.add(storedRef.current, unistyles)

                UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)

                return unistyles
            }}
        />
    )
})
