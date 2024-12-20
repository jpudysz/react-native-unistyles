import React from 'react'
import { passForwardedRef } from './passForwardRef'

export const createUnistylesElement = (Component: any) => React.forwardRef((props, forwardedRef) => (
    <Component
        {...props}
        ref={(ref: unknown) => passForwardedRef(props, ref, forwardedRef)}
    />
))
