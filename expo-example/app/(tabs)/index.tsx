import React, { useState } from 'react'
import { View, Text, Button } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import Animated, { interpolateColor, useAnimatedReaction, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated'
import { useEffect, useLayoutEffect } from 'react'
import { cancelAnimation, useSharedValue, withSpring } from 'react-native-reanimated'
import type { WithTimingConfig, WithSpringConfig } from 'react-native-reanimate'

type ColorKeys<T> = {
    [K in keyof T]: K extends string
        ? K extends `${string}color${string}` | `${string}Color${string}`
            ? K
            : never
        : never
}[keyof T]

export const useAnimatedVariants = <T extends Record<string, any>>(style: T, animationConfig?: WithTimingConfig | WithSpringConfig) => {
    const secretKey = Object.keys(style).find(key => key.startsWith('unistyles_'))
    // @ts-ignore this is hidden from TS
    const hasVariants = style[secretKey]?.__stylesheetVariants

    if (!hasVariants) {
        throw new Error('useAnimatedVariants: Style was not created by Unistyles or does not have variants')
    }

    const progress = useSharedValue(1)
    const fromValue = useSharedValue(style)
    const toValue = useSharedValue(style)

    useLayoutEffect(() => {
        cancelAnimation(progress)
        progress.value = 0

        fromValue.set(toValue.get())
        toValue.set(style)

        progress.value = 1
    }, [style])

    const animateColorProperty = (colorKey: ColorKeys<typeof fromValue.value>) => {
        'worklet'

        return interpolateColor(
            progress.value,
            [0, 1],
            [fromValue.value[colorKey], toValue.value[colorKey]]
        )
    }

    return {
        animateColorProperty
    }
}


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

    const { animateColorProperty } = useAnimatedVariants(styles.styleWithVariants)
    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(animateColorProperty('backgroundColor'), {
                duration: 3000
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

