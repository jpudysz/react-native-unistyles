import React from 'react'
import type { UnistylesValues } from '../types'
import { useClassname } from '../hooks'

type ComponentProps = {
    style?: UnistylesValues | Array<UnistylesValues>
}

export const createUnistylesElement = (Component: any) => React.forwardRef<unknown, ComponentProps>((props, forwardedRef) => {
    const classNames = useClassname(props.style)

    return (
        <Component
            {...props}
            style={classNames}
            ref={forwardedRef}
        />
    )
})
