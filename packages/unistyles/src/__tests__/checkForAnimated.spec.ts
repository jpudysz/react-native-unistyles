import { Animated } from 'react-native'

import { assignSecrets, checkForAnimated } from '../web/utils/unistyle'

describe('checkForAnimated', () => {
    const interpolated = new Animated.Value(0).interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

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

    it('returns true for Animated.Node values', () => {
        expect(checkForAnimated({ opacity: interpolated })).toBe(true)
    })

    it('returns true for Reanimated useAnimatedStyle handles', () => {
        const viewDescriptors = { shareableViewDescriptors: {}, add: jest.fn(), remove: jest.fn(), has: jest.fn() }
        const initial = { value: { opacity: 0 }, updater: jest.fn() }

        // Reanimated 3.x and 4.0
        expect(checkForAnimated({ viewDescriptors, initial })).toBe(true)
        // Reanimated 4.1+
        expect(checkForAnimated({ viewDescriptors, initial, styleUpdaterContainer: { current: jest.fn() } })).toBe(true)
    })

    it('returns false for objects with only some of the Reanimated handle keys', () => {
        expect(checkForAnimated({ viewDescriptors: {} })).toBe(false)
        expect(checkForAnimated({ initial: {} })).toBe(false)
        expect(checkForAnimated({ styleUpdaterContainer: {} })).toBe(false)
    })

    it('finds animated values in arrays and nested objects', () => {
        expect(checkForAnimated([{ opacity: interpolated }])).toBe(true)
        expect(checkForAnimated({ transform: [{ translateX: interpolated }] })).toBe(true)
    })

    it('returns true for values with empty unistyles secrets', () => {
        const value = { opacity: 1 }

        assignSecrets(value, {} as never)

        expect(checkForAnimated(value)).toBe(true)
    })
})
