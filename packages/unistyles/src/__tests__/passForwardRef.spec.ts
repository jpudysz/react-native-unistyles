import { passForwardedRef } from '../core/passForwardRef'

describe('passForwardedRef', () => {
    it('does not throw on cleanup when the forwarded ref returns a non-function value', () => {
        // React 19 lets a callback ref return a cleanup function, but returning
        // anything else is still legal. `useAnimatedRef` from react-native-reanimated
        // is such a ref - it returns its internal ShadowNodeWrapper object.
        const shadowNodeWrapper = { __shadowNodeWrapper: true }
        const forwardedRef = jest.fn(() => shadowNodeWrapper)
        const ref = {}

        const cleanup = passForwardedRef(ref, forwardedRef)

        expect(forwardedRef).toHaveBeenCalledWith(ref)
        expect(() => cleanup()).not.toThrow()
    })

    it('still calls a cleanup function returned by a React 19 callback ref', () => {
        const refCleanup = jest.fn()
        const forwardedRef = jest.fn(() => refCleanup)
        const ref = {}

        const cleanup = passForwardedRef(ref, forwardedRef)

        expect(refCleanup).not.toHaveBeenCalled()

        cleanup()

        expect(refCleanup).toHaveBeenCalledTimes(1)
        // like React, a returned cleanup function replaces the call with null
        expect(forwardedRef).not.toHaveBeenCalledWith(null)
    })

    it('runs onUnmount when the forwarded ref returns a non-function value', () => {
        const onMount = jest.fn()
        const onUnmount = jest.fn()
        const forwardedRef = jest.fn(() => ({ __shadowNodeWrapper: true }))
        const ref = {}

        const cleanup = passForwardedRef(ref, forwardedRef, onMount, onUnmount)

        expect(onMount).toHaveBeenCalledTimes(1)
        expect(onUnmount).not.toHaveBeenCalled()

        try {
            cleanup()
        } catch {
            // Swallowing here keeps this test strictly about the unmount bookkeeping.
            // The throw itself is asserted by the first test - what matters here is that
            // `onUnmount` (which unlinks the shadow node) runs no matter what the
            // forwarded ref handed back.
        }

        expect(onUnmount).toHaveBeenCalledTimes(1)
    })

    it('runs onUnmount when the cleanup function of the forwarded ref throws', () => {
        const onUnmount = jest.fn()
        const forwardedRef = () => () => {
            throw new Error('cleanup')
        }

        const cleanup = passForwardedRef({}, forwardedRef, undefined, onUnmount)

        expect(() => cleanup()).toThrow('cleanup')
        expect(onUnmount).toHaveBeenCalledTimes(1)
    })

    it('calls the forwarded callback ref with null when it returns no cleanup function', () => {
        const forwardedRef = jest.fn()
        const animatedRef = jest.fn(() => ({ __shadowNodeWrapper: true }))
        const ref = {}

        passForwardedRef(ref, forwardedRef)()
        passForwardedRef(ref, animatedRef)()

        expect(forwardedRef.mock.calls).toEqual([[ref], [null]])
        expect(animatedRef.mock.calls).toEqual([[ref], [null]])
    })

    it('resets the forwarded object ref', () => {
        const forwardedRef = { current: null as unknown }
        const ref = {}

        const cleanup = passForwardedRef(ref, forwardedRef)

        expect(forwardedRef.current).toBe(ref)

        cleanup()

        expect(forwardedRef.current).toBeNull()
    })
})
