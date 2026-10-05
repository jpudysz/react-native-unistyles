// Animations change transforms only: verify() compares the props React rendered and the animated ones differ by design
import React, { useRef, useState } from 'react'
import { Animated as RNAnimated, processColor, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { useAnimatedTheme, useAnimatedVariantColor } from 'react-native-unistyles/reanimated'
import { Button, Screen, Section } from '../components'
import { useE2EAction } from '../e2e/actions'
import { themes, type ThemeName } from '../themes'

export default function AnimationsScreen() {
    const [tone, setTone] = useState<'primary' | 'accent'>('primary')

    styles.useVariants({ tone })

    const theme = useAnimatedTheme()
    const offset = useSharedValue(0)
    const rnOffset = useRef(new RNAnimated.Value(0)).current
    const variantColor = useAnimatedVariantColor(styles.variantBox, 'backgroundColor')

    const animatedThemeStyle = useAnimatedStyle(() => ({
        backgroundColor: theme.value.colors.secondary
    }))
    const translateStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }]
    }))
    const variantStyle = useAnimatedStyle(() => ({
        backgroundColor: variantColor.value
    }))

    const move = () => {
        const target = offset.value === 0 ? 120 : 0

        offset.value = withTiming(target, { duration: 300 })
        RNAnimated.timing(rnOffset, { toValue: target, duration: 300, useNativeDriver: true }).start()
        setTone(current => current === 'primary' ? 'accent' : 'primary')
    }

    useE2EAction('animations.move', move)
    // Reanimated owns the animated color, it must follow the theme even if the theme changed while the screen was frozen
    useE2EAction('animations.variant-color', () => {
        const expected = themes[UnistylesRuntime.themeName as ThemeName].colors[tone]
        const actual = variantColor.value

        return processColor(actual) === processColor(expected)
            ? undefined
            : { styleKey: 'variantBox', prop: 'animated backgroundColor', expected, actual: String(actual) }
    })

    return (
        <Screen>
            <Section title="Reanimated" description="useAnimatedTheme, useAnimatedVariantColor and a Unistyles style next to an animated one">
                <Animated.View style={[styles.box, animatedThemeStyle]}>
                    <Text style={styles.text}>useAnimatedTheme</Text>
                </Animated.View>
                <Animated.View style={[styles.box, variantStyle]}>
                    <Text style={styles.text}>useAnimatedVariantColor</Text>
                </Animated.View>
                <Animated.View style={[styles.box, styles.moving, translateStyle]} />
            </Section>
            <Section title="React Native Animated">
                <RNAnimated.View style={[styles.box, styles.moving, { transform: [{ translateX: rnOffset }] }]} />
            </Section>
            <Button title="Move" onPress={move} />
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    box: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: theme.gap(1.5)
    },
    moving: {
        width: 48,
        backgroundColor: theme.colors.accent
    },
    text: {
        color: theme.colors.typography
    },
    variantBox: {
        variants: {
            tone: {
                primary: {
                    backgroundColor: theme.colors.primary
                },
                accent: {
                    backgroundColor: theme.colors.accent
                }
            }
        }
    }
}))
