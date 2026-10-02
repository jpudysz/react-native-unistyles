import React from 'react'

export const passForwardedRef = <T>(
    ref: T,
    forwardedRef: React.ForwardedRef<T>,
    onMount?: () => void,
    onUnmount?: () => void,
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

    onMount?.()

    return () => {
        // React 19 allows a callback ref to return a cleanup function, but returning
        // any other value is still valid, so it can't be called unconditionally.
        if (typeof forwardedRefReturnFn === 'function') {
            forwardedRefReturnFn()
        }

        onUnmount?.()
    }
}
