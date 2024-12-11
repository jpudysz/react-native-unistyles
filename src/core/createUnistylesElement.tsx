import React from 'react'
import type { UnistylesValues } from '../types'
import { UnistylesShadowRegistry } from '../web'
import { deepMergeObjects } from '../utils'

type ComponentProps = {
    style?: UnistylesValues | Array<UnistylesValues>
}

export const createUnistylesElement = (Component: any) => React.forwardRef<unknown, ComponentProps>((props, forwardedRef) => {
    const style = Array.isArray(props.style)
        ? deepMergeObjects(...props.style)
        : props.style
    const { hash, injectedClassName } = style
        ? UnistylesShadowRegistry.addStyles(style)
        : {}

    return (
        <Component
            {...props}
            style={hash ? { $$css: true, hash, injectedClassName } : undefined}
            ref={forwardedRef}
        />
    )
})
