import React from 'react'
import { passForwardedRef } from './passForwardRef'
import { maybeWarnAboutMultipleUnistyles } from './warn'

export const createUnistylesElement = (Component: any) => React.forwardRef((props, forwardedRef) => (
    <Component
        {...props}
        ref={(ref: unknown) => {
            passForwardedRef(props, ref, forwardedRef)
            maybeWarnAboutMultipleUnistyles(props, Component.displayName)
        }}
    />
))
