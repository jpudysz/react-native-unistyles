require('../mocks')

const unistyles = require('react-native-unistyles') as { StyleSheet: { create: (styles: any) => any } }

describe('StyleSheet.create mock', () => {
    it('should strip variants from style entries', () => {
        const styles = unistyles.StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: 'red',
                variants: {
                    size: {
                        small: { padding: 4 },
                        large: { padding: 16 }
                    }
                },
                compoundVariants: [
                    {
                        size: 'small',
                        styles: { margin: 2 }
                    }
                ]
            },
            text: {
                fontSize: 14
            }
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
                        secondary: { backgroundColor: 'gray' }
                    }
                }
            }
        }))

        expect(styles.container).toEqual({ flex: 1 })
        expect(styles.container).not.toHaveProperty('variants')
    })

    it('should preserve styles without variants unchanged', () => {
        const styles = unistyles.StyleSheet.create({
            container: {
                flex: 1,
                padding: 16
            }
        })

        expect(styles.container).toEqual({ flex: 1, padding: 16 })
    })
})
