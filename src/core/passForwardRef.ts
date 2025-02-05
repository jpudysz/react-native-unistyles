import React from 'react'
import { UnistylesShadowRegistry } from '../specs'

export const passForwardedRef = <T>(props: any, ref: T, forwardedRef: React.ForwardedRef<T>) => {
    const passForwardedRef = () => {
        if (typeof forwardedRef === 'function') {
            return forwardedRef(ref)
        }

        if (forwardedRef) {
            forwardedRef.current = ref
        }

        return () => {}
    }
    const forwardedRefReturnFn = passForwardedRef()

    // @ts-expect-error hidden from TS
    UnistylesShadowRegistry.add(ref, props.style)

    return () => {
        forwardedRefReturnFn?.()
    }
}
