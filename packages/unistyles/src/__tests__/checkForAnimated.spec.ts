import { Animated } from 'react-native'

import { assignSecrets, checkForAnimated } from '../web/utils/unistyle'

describe('checkForAnimated', () => {
    it('returns false for primitives', () => {
        expect(checkForAnimated(undefined)).toBe(false)
        expect(checkForAnimated(null)).toBe(false)
        expect(checkForAnimated(0)).toBe(false)
        expect(checkForAnimated('flex')).toBe(false)
        expect(checkForAnimated(true)).toBe(false)
    })

    it('returns false for plain styles', () => {
        expect(checkForAnimated({ flex: 1, backgroundColor: 'red' })).toBe(false)
    })

    it('returns true for legacy `Animated.Node` instances (Animated API)', () => {
        const animatedValue = new Animated.Value(0)

        // The interpolation produces an `AnimatedInterpolation` (a subclass of
        // `Animated.Node`), which is the historical signal `checkForAnimated`
        // was originally written to detect.
        const interpolated = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        })

        expect(checkForAnimated({ opacity: interpolated })).toBe(true)
    })

    it('returns true for Reanimated 3 `useAnimatedStyle` return values', () => {
        // `useAnimatedStyle()` returns a plain object of this shape on web. It
        // is NOT an instance of `Animated.Node`, and none of its nested values
        // are either, so the legacy `instanceof` and recursive checks both miss
        // it. Detect the shape directly.
        const reanimatedHandle = {
            viewDescriptors: { shareableViewDescriptors: {}, add: jest.fn(), remove: jest.fn(), has: jest.fn() },
            initial: { value: { opacity: 0 }, updater: jest.fn() },
            styleUpdaterContainer: { current: jest.fn() },
        }

        expect(checkForAnimated(reanimatedHandle)).toBe(true)
    })

    it('does not falsely flag plain objects that share one of the Reanimated keys', () => {
        // A regular style object that happens to contain a `viewDescriptors`
        // key alone (or just one of the three) is not a Reanimated handle.
        // Require all three before treating the value as animated.
        expect(checkForAnimated({ viewDescriptors: {} })).toBe(false)
        expect(checkForAnimated({ initial: {} })).toBe(false)
        expect(checkForAnimated({ styleUpdaterContainer: {} })).toBe(false)
        expect(checkForAnimated({ viewDescriptors: {}, initial: {} })).toBe(false)
    })

    it('recurses into arrays and nested objects to find an animated descriptor', () => {
        const animatedValue = new Animated.Value(0)
        const interpolated = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

        expect(checkForAnimated([{ opacity: interpolated }])).toBe(true)
        expect(checkForAnimated({ transform: [{ translateX: interpolated }] })).toBe(true)
    })

    it('treats values with empty unistyles secrets as animated (existing behavior)', () => {
        // `assignSecrets` adds a non-enumerable `unistyles_*` bag. When the bag
        // exists but is empty, that's the marker for an already-resolved
        // animated style; `getClassName` relies on this to short-circuit.
        const value: Record<string, unknown> = { opacity: 1 }
        assignSecrets(value, {} as never)

        expect(checkForAnimated(value)).toBe(true)
    })
})
