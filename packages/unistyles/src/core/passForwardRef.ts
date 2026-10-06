import React from 'react'

export const passForwardedRef = <T>(
    ref: T,
    forwardedRef: React.ForwardedRef<T>,
    onMount?: () => void,
    onUnmount?: () => void,
) => {
    const passForwardedRef = (): unknown => {
        if (typeof forwardedRef === 'function') {
            return forwardedRef(ref)
        }

        if (forwardedRef) {
            forwardedRef.current = ref
        }

        return undefined
    }
    const forwardedRefReturnFn = passForwardedRef()

    onMount?.()

    return () => {
        try {
            // React 19 allows a callback ref to return a cleanup function, but returning
            // any other value is still valid, so it can't be called unconditionally.
            // Without a cleanup function React detaches the ref with null, so do we.
            if (typeof forwardedRefReturnFn === 'function') {
                forwardedRefReturnFn()
            } else if (typeof forwardedRef === 'function') {
                forwardedRef(null)
            } else if (forwardedRef) {
                forwardedRef.current = null
            }
        } finally {
            onUnmount?.()
        }
    }
}
