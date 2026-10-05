import type { TouchableHighlight } from 'react-native'

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesTouchableHighlight = (Component: typeof TouchableHighlight) => {
    const UnistylesTouchableHighlight = (props: any) => {
        const relinkRef = useRef<() => void>(undefined)
        const [hiddenUnderlays, setHiddenUnderlays] = useState(0)

        useLayoutEffect(() => {
            if (hiddenUnderlays > 0) {
                relinkRef.current?.()
            }
        }, [hiddenUnderlays])

        // new props come with a parent render, re-renders for the underlay keep the ref and the scoped theme it captured
        const ref = useCallback(
            (ref: unknown) => {
                maybeWarnAboutMultipleUnistyles(props.style, 'TouchableHighlight')

                const scopedTheme = UnistylesShadowRegistry.getScopedTheme()

                relinkRef.current = () => {
                    const previousScopedTheme = UnistylesShadowRegistry.getScopedTheme()

                    UnistylesShadowRegistry.setScopedTheme(scopedTheme)
                    // @ts-ignore this is hidden from TS
                    UnistylesShadowRegistry.remove(ref)
                    // @ts-ignore this is hidden from TS
                    UnistylesShadowRegistry.add(ref, props.style)
                    UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)
                }

                return passForwardedRef(
                    ref,
                    props.ref,
                    () => {
                        // @ts-ignore this is hidden from TS
                        UnistylesShadowRegistry.add(ref, props.style)
                    },
                    () => {
                        relinkRef.current = undefined
                        // @ts-ignore this is hidden from TS
                        UnistylesShadowRegistry.remove(ref)
                    },
                )
            },
            [props],
        )

        return (
            <Component
                {...props}
                ref={ref}
                onHideUnderlay={() => {
                    setHiddenUnderlays((count) => count + 1)
                    props.onHideUnderlay?.()
                }}
            />
        )
    }

    return copyComponentProperties(Component, UnistylesTouchableHighlight)
}
