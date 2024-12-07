import React from 'react'
import { passForwardedRef } from './passForwardRef'

// todo improve types to be more generic
export const createUnistylesElement = (Component: any) => React.forwardRef((props, forwardedRef) => (
    <Component
        {...props}
        ref={(ref: unknown) => passForwardedRef(props, ref, forwardedRef)}
    />
))
