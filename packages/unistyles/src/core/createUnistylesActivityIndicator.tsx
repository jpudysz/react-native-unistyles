import type { ActivityIndicator } from 'react-native'

import React, { useContext } from 'react'

import { isAndroid } from '../common'
import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

const getWrapperHandle = (ref: any) => {
    const spinner = ref?.__internalInstanceHandle

    return {
        __internalInstanceHandle: isAndroid ? spinner?.return?.return : spinner?.return,
    }
}

export const createUnistylesActivityIndicator = (Component: typeof ActivityIndicator) => {
    const UnistylesActivityIndicator = (props: any) => {
        const scope = useContext(ScopedThemeContext)

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
