import React from 'react'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesElement = (Component: any) => React.forwardRef((props, forwardedRef) => (
    <Component
        {...props}
        ref={(ref: unknown) => {
            passForwardedRef(props, ref, forwardedRef)
            // @ts-ignore we don't know the type of the component
            maybeWarnAboutMultipleUnistyles(props.style, Component.displayName)
        }}
    />
))
