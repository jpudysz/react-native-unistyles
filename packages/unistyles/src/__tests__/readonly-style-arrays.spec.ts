import type { BoxShadowValue, FilterFunction, StyleProp, ViewStyle } from 'react-native'

import type { mq as MQ } from '../mq'
import type { CreateUnistylesStyleSheet } from '../types'

require('../mocks')

const { StyleSheet, mq } = require('react-native-unistyles') as {
    StyleSheet: { create: CreateUnistylesStyleSheet }
    mq: typeof MQ
}

// the parameter types are the real assertions here, they're checked by `tsc`
const expectViewStyle = (style: StyleProp<ViewStyle>) => expect(style).toBeDefined()
const expectMutableArray = (value: Array<unknown> | undefined) => expect(Array.isArray(value)).toBe(true)

const readonlyShadows: ReadonlyArray<BoxShadowValue> = [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: 'black' }]
const mutableShadows: Array<BoxShadowValue> = [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: 'black' }]
const constShadows = [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: 'black' }] as const
const readonlyFilters: ReadonlyArray<FilterFunction> = [
    { blur: 2 },
    { dropShadow: { offsetX: 0, offsetY: 1, color: 'black' } },
]
const mutableFilters: Array<FilterFunction> = [{ blur: 2 }, { dropShadow: { offsetX: 0, offsetY: 1, color: 'black' } }]
const constFilters = [{ blur: 2 }] as const
const readonlyTransform: ReadonlyArray<{ translateX: number } | { rotate: string }> = [
    { translateX: 1 },
    { rotate: '45deg' },
]
const constTransform = [{ scale: 2 }, { translateY: { [mq.only.width(100)]: 10 } }] as const

describe('readonly style arrays', () => {
    it('should produce RN compatible styles from readonly and mutable arrays', () => {
        const styles = StyleSheet.create({
            readonlyShadows: { boxShadow: readonlyShadows },
            mutableShadows: { boxShadow: mutableShadows },
            constShadows: { boxShadow: constShadows },
            readonlyFilters: { filter: readonlyFilters },
            mutableFilters: { filter: mutableFilters },
            constFilters: { filter: constFilters },
            readonlyTransform: { transform: readonlyTransform },
            constTransform: { transform: constTransform },
            mutableTransform: {
                transform: [{ scale: 2 }, { translateX: { [mq.only.width(100)]: 10 } }],
            },
            variants: {
                boxShadow: readonlyShadows,
                variants: {
                    size: {
                        small: { filter: readonlyFilters },
                        large: { transform: readonlyTransform },
                    },
                },
            },
            dynamic: (blur: number) => ({
                boxShadow: readonlyShadows,
                filter: [{ blur }] as ReadonlyArray<FilterFunction>,
            }),
        })

        expectViewStyle(styles.readonlyShadows)
        expectViewStyle(styles.mutableShadows)
        expectViewStyle(styles.constShadows)
        expectViewStyle(styles.readonlyFilters)
        expectViewStyle(styles.mutableFilters)
        expectViewStyle(styles.constFilters)
        expectViewStyle(styles.readonlyTransform)
        expectViewStyle(styles.constTransform)
        expectViewStyle(styles.mutableTransform)
        expectViewStyle(styles.variants)
        expectViewStyle(styles.dynamic(2))
        expect(styles.readonlyShadows.boxShadow).toBe(readonlyShadows)
        expect(styles.readonlyFilters.filter).toBe(readonlyFilters)
    })

    it('should keep mutable transform arrays mutable', () => {
        const styles = StyleSheet.create({
            container: {
                transform: [{ scale: 2 }],
            },
        })

        expectMutableArray(styles.container.transform)
    })

    it('should produce RN compatible styles from a theme callback', () => {
        const styles = StyleSheet.create(() => ({
            container: {
                boxShadow: readonlyShadows,
                filter: readonlyFilters,
                transform: readonlyTransform,
            },
        }))

        expectViewStyle(styles.container)
    })
})
