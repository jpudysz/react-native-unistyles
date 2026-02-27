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
        forwardedRefReturnFn?.()
        onUnmount?.()
    }
}
