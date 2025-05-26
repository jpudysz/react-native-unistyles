import React from 'react'
import { UnistylesShadowRegistry } from '../specs'
import { copyComponentProperties } from '../utils'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesElement = (Component: any) => {
    const UnistylesComponent = React.forwardRef((props, forwardedRef) => {
        return (
            <Component
                {...props}
                ref={(ref: unknown) => {
                    // @ts-ignore we don't know the type of the component
                    maybeWarnAboutMultipleUnistyles(props.style, Component.displayName)

                    return passForwardedRef(
                        ref,
                        forwardedRef,
                        () => {
                            // @ts-ignore this is hidden from TS
                            UnistylesShadowRegistry.add(ref, props.style)
                        },
                        () => {
                            // @ts-ignore this is hidden from TS
                            UnistylesShadowRegistry.remove(ref)
                        }
                    )
                }}
            />
        )
    })

    return copyComponentProperties(Component, UnistylesComponent)
}
