import React from 'react'
import type { UnistylesValues } from '../types'
import { getClassName } from './getClassname'
import { isServer } from '../web/utils'
import { UnistylesShadowRegistry } from '../web'

type ComponentProps = {
    style?: UnistylesValues | Array<UnistylesValues>
}

export const createUnistylesElement = (Component: any) => React.forwardRef<unknown, ComponentProps>((props, forwardedRef) => {
    let storedRef: HTMLElement | null = null
    const classNames = getClassName(props.style)

    return (
        <Component
            {...props}
            style={classNames}
            ref={isServer() ? undefined : (ref: HTMLElement | null) => {
                if (!ref) {
                    // @ts-expect-error hidden from TS
                    UnistylesShadowRegistry.remove(storedRef, classNames?.hash)
                }

                storedRef = ref
                // @ts-expect-error hidden from TS
                UnistylesShadowRegistry.add(ref, classNames?.hash)

                if (typeof forwardedRef === 'function') {
                    return forwardedRef(ref)
                }

                if (forwardedRef) {
                    forwardedRef.current = ref
                }
            }}
        />
    )
})
