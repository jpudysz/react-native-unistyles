import React, { useState } from 'react'
import { View, Text, Button } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useAnimatedVariantColor } from 'react-native-unistyles/reanimated'

export default function HomeScreen() {
    const [variant, setVariant] = useState<'blue' | 'red'>('blue')

    styles.useVariants({
        variant
    })

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>
                Animated variants transition
            </Text>
            <Text style={styles.description}>
            This box will reuse Unistyles variants and animate them using Reanimated
            </Text>
            <ChildComponent variant={variant} />
            <Button title="Change variant" onPress={() => setVariant(variant === 'blue' ? 'red' : 'blue')} />
        </View>
    )
}

export const ChildComponent = ({ variant }: { variant: 'red' | 'blue' }) => {
    styles.useVariants({
        variant
    })

    const color = useAnimatedVariantColor(styles.styleWithVariants, 'backgroundColor')
    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(color.value, {
                duration: 500
            })
        }
    })

    return (
        <Animated.View style={[animatedStyle, styles.styleWithVariants]}>
            <Text style={styles.variantText}>
                Variant: {variant}
            </Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        paddingTop: rt.insets.top,
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    description: {
        color: theme.colors.typography,
        fontSize: 16,
        textAlign: 'center'
    },
    variantText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center'
    },
    button: {
        backgroundColor: theme.colors.aloes,
        borderRadius: 8,
        height: 50,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    styleWithVariants: {
        height: 100,
        width: 100,
        variants: {
            variant: {
                red: {
                    backgroundColor: theme.colors.red
                },
                blue: {
                    backgroundColor: theme.colors.blue
                }
            }
        }
    }
}))

