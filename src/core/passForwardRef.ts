import React from 'react'
import { UnistylesShadowRegistry } from '../specs'

export const passForwardedRef = <T>(
    props: any,
    ref: T,
    forwardedRef: React.ForwardedRef<T>
) => {
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

    UnistylesShadowRegistry.add(ref, props.style)

    return () => {
        // @ts-expect-error - This is hidden from TS
        UnistylesShadowRegistry.remove(ref)
        forwardedRefReturnFn?.()
    }
}
