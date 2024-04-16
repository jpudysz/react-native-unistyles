import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useStyles, createStyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { Bird, Star } from '../assets'

export const BirdsAndStars: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)
    const fadeOutAnimation = useRef(new Animated.Value(1))
    const fadeInAnimation = useRef(new Animated.Value(0))

    useEffect(() => {
        const isDay = UnistylesRuntime.themeName === 'light'

        const animation1 = Animated.timing(fadeOutAnimation.current, {
            toValue: isDay ? 0 : 1,
            duration: 250,
            useNativeDriver: true
        })
        const animation2 = Animated.timing(fadeInAnimation.current, {
            toValue: isDay ? 1 : 0,
            duration: 250,
            useNativeDriver: true
        })

        animation1.start()
        animation2.start()
    }, [UnistylesRuntime.themeName])

    return (
        <View style={styles.container}>
            <Animated.View
                style={{
                    ...styles.container,
                    opacity: fadeOutAnimation.current
                }}
                pointerEvents="none"
            >
                <View style={styles.pos(300, 200, 1)}>
                    <Star/>
                </View>
                <View style={styles.pos(220, 300, 0.5)}>
                    <Star/>
                </View>
                <View style={styles.pos(400, 400, 0.4)}>
                    <Star/>
                </View>
            </Animated.View>
            <Animated.View
                style={{
                    ...styles.container,
                    opacity: fadeInAnimation.current
                }}
                pointerEvents="none"
            >
                <View style={styles.pos(400, 400, 2)}>
                    <Bird/>
                </View>
                <View style={styles.pos(220, 300, 1)}>
                    <Bird/>
                </View>
                <View style={styles.pos(600, 300, 1.5)}>
                    <Bird/>
                </View>
            </Animated.View>
        </View>
    )
}

const stylesheet = createStyleSheet(() => ({
    pos: (left: number, top: number, scale) => ({
        position: 'absolute',
        left,
        top,
        transform: [{ scale }]
    }),
    container: {
        position: 'absolute'
    }
}))
