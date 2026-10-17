import type { ActivityIndicator } from 'react-native'

import React, { useContext } from 'react'

import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { UnistylesShadowRegistry } from '../specs'
import { Fiber } from '../unifiber/src'
import { copyComponentProperties } from '../utils'
import { hasUnistyles } from './hasUnistyles'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const { getHostFor, getParentHost } = Fiber

const getWrapperHandle = (ref: unknown) => {
    const spinner = getHostFor(ref)

    return {
        __internalInstanceHandle: spinner && getParentHost(spinner),
    }
}

export const createUnistylesActivityIndicator = (Component: typeof ActivityIndicator) => {
    const UnistylesActivityIndicator = (props: any) => {
        const scope = useContext(ScopedThemeContext)

        if (!hasUnistyles(props.style)) {
            return <Component {...props} />
        }

        return (
            <Component
                {...props}
                ref={(ref: unknown) => {
                    maybeWarnAboutMultipleUnistyles(props.style, 'ActivityIndicator')

                    const wrapperHandle = getWrapperHandle(ref)

                    return passForwardedRef(
                        ref,
                        props.ref,
                        () => {
                            // @ts-ignore this is hidden from TS
                            UnistylesShadowRegistry.add(wrapperHandle, props.style, scope)
                        },
                        () => {
                            // @ts-ignore this is hidden from TS
                            UnistylesShadowRegistry.remove(wrapperHandle)
                        },
                    )
                }}
            />
        )
    }

    return copyComponentProperties(Component, UnistylesActivityIndicator)
}
