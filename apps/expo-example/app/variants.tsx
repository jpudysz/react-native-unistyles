import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'

const SIZES = ['small', 'medium', 'large'] as const
const COLORS = ['primary', 'secondary', 'accent'] as const

export default function VariantsScreen() {
    const [sizeIndex, setSizeIndex] = useState(0)
    const [colorIndex, setColorIndex] = useState(0)
    const [isOutlined, setIsOutlined] = useState(false)

    const nextSize = () => setSizeIndex(index => (index + 1) % SIZES.length)
    const nextColor = () => setColorIndex(index => (index + 1) % COLORS.length)
    const toggleOutline = () => setIsOutlined(value => !value)

    useE2EAction('variants.size', nextSize)
    useE2EAction('variants.color', nextColor)
    useE2EAction('variants.outline', toggleOutline)

    styles.useVariants({
        size: SIZES[sizeIndex],
        color: COLORS[colorIndex],
        outlined: isOutlined
    })

    return (
        <Screen>
            <Section title="Selected variants" description={`size ${SIZES[sizeIndex]}, color ${COLORS[colorIndex]}, outlined ${isOutlined}`}>
                <View style={styles.badge}>
                    <Text style={styles.label}>Badge</Text>
                </View>
                <View style={styles.defaultVariant}>
                    <Text style={styles.label}>Default variant (size only)</Text>
                </View>
            </Section>
            <Section title="Change variants">
                <Button title="Next size" onPress={nextSize} />
                <Button title="Next color" onPress={nextColor} />
                <Button title="Toggle outline (compound variant)" onPress={toggleOutline} />
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    badge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        borderWidth: 2,
        variants: {
            size: {
                small: {
                    padding: theme.gap(0.5)
                },
                medium: {
                    padding: theme.gap(1)
                },
                large: {
                    padding: theme.gap(2)
                }
            },
            color: {
                primary: {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary
                },
                secondary: {
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.secondary
                },
                accent: {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.accent
                }
            },
            outlined: {
                true: {
                    backgroundColor: theme.colors.surface
                },
                false: {}
            }
        },
        compoundVariants: [
            {
                outlined: true,
                color: 'accent',
                styles: {
                    borderColor: theme.colors.typography
                }
            },
            {
                size: 'large',
                outlined: true,
                styles: {
                    borderWidth: 4
                }
            }
        ]
    },
    defaultVariant: {
        borderRadius: 8,
        variants: {
            size: {
                small: {
                    backgroundColor: theme.colors.chip.subtle
                },
                medium: {
                    backgroundColor: theme.colors.chip.fill
                },
                default: {
                    backgroundColor: theme.colors.border
                }
            }
        }
    },
    label: {
        color: theme.colors.typography,
        variants: {
            size: {
                small: {
                    fontSize: 12
                },
                medium: {
                    fontSize: 16
                },
                large: {
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            }
        }
    }
}))
