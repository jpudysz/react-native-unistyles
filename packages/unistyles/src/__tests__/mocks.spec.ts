import type { CreateUnistylesStyleSheet } from '../types'

require('../mocks')

const unistyles = require('react-native-unistyles') as { StyleSheet: { create: CreateUnistylesStyleSheet } }

describe('StyleSheet.create mock', () => {
    it('should expose addChangeListener', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const dispose = (unistyles as any).StyleSheet.addChangeListener(() => {})

        expect(typeof dispose).toBe('function')
    })

    it('should strip variants from style entries', () => {
        const styles = unistyles.StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: 'red',
                variants: {
                    size: {
                        small: { padding: 4 },
                        large: { padding: 16 },
                    },
                },
                compoundVariants: [
                    {
                        size: 'small',
                        styles: { margin: 2 },
                    },
                ],
            },
            text: {
                fontSize: 14,
            },
        })

        expect(styles.container).toEqual({ flex: 1, backgroundColor: 'red' })
        expect(styles.container).not.toHaveProperty('variants')
        expect(styles.container).not.toHaveProperty('compoundVariants')
        expect(styles.text).toEqual({ fontSize: 14 })
        expect(styles.useVariants).toBeDefined()
    })

    it('should strip variants from dynamic style entries', () => {
        const styles = unistyles.StyleSheet.create(() => ({
            container: {
                flex: 1,
                variants: {
                    color: {
                        primary: { backgroundColor: 'blue' },
                        secondary: { backgroundColor: 'gray' },
                    },
                },
            },
        }))

        expect(styles.container).toEqual({ flex: 1 })
        expect(styles.container).not.toHaveProperty('variants')
    })

    it('should strip variants from dynamic functions', () => {
        const styles = unistyles.StyleSheet.create(() => ({
            container: () => ({
                flex: 1,
                variants: {
                    color: {
                        primary: { backgroundColor: 'blue' },
                        secondary: { backgroundColor: 'gray' },
                    },
                },
                compoundVariants: [
                    {
                        size: 'small',
                        styles: { margin: 2 },
                    },
                ],
            }),
        }))

        const container = styles.container()

        expect(container).toEqual({ flex: 1 })
        expect(container).not.toHaveProperty('variants')
        expect(container).not.toHaveProperty('compoundVariants')
    })

    it('should preserve styles without variants unchanged', () => {
        const styles = unistyles.StyleSheet.create({
            container: {
                flex: 1,
                padding: 16,
            },
        })

        expect(styles.container).toEqual({ flex: 1, padding: 16 })
    })
})

describe('mock registry persistence', () => {
    const REGISTRY_KEY = '__UNISTYLES_MOCK_REGISTRY__'

    it('should keep configured themes visible to StyleSheet.create after jest.resetModules()', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalWithRegistry = globalThis as any
        const previousRegistry = globalWithRegistry[REGISTRY_KEY]

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const first = require('react-native-unistyles') as { StyleSheet: { configure: (config: any) => void } }

            first.StyleSheet.configure({
                themes: {
                    light: {
                        colors: {
                            bg: 'red',
                        },
                    },
                },
            })

            jest.resetModules()

            const second = require('react-native-unistyles') as { StyleSheet: { create: CreateUnistylesStyleSheet } }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
            const styles = second.StyleSheet.create((theme: any) => ({
                box: {
                    backgroundColor: theme.colors.bg,
                },
            }))

            expect(styles.box).toEqual({ backgroundColor: 'red' })
        } finally {
            if (previousRegistry === undefined) {
                delete globalWithRegistry[REGISTRY_KEY]
            } else {
                globalWithRegistry[REGISTRY_KEY] = previousRegistry
            }
        }
    })
})
