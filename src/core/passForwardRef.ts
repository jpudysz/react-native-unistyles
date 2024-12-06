import React from 'react'
import { UnistylesShadowRegistry } from '../specs'

export const passForwardedRef = <T>(ref: T, forwardedRef: React.ForwardedRef<T>) => {
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

    // @ts-expect-error - This is hidden from TS
    UnistylesShadowRegistry.add(ref, props.style)

    return () => {
        // @ts-expect-error - This is hidden from TS
        UnistylesShadowRegistry.remove(ref)
        forwardedRefReturnFn?.()
    }
}
