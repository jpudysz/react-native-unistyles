import React, { useRef } from 'react'
import { UnistylesRuntime, createStyleSheet, useStyles  } from 'react-native-unistyles'
import { Animated, Button, View } from 'react-native'
import { Moon, Sun } from '../assets'

type DayNightProps = {
    onDay: VoidFunction,
    onNight: VoidFunction
}

export const DayNight: React.FunctionComponent<DayNightProps> = ({ onDay, onNight }) => {
    const { styles, theme } = useStyles(stylesheet)
    const fadeOutAnimation = useRef(new Animated.Value(1))
    const fadeInAnimation = useRef(new Animated.Value(0))
    const scaleDownAnimation = useRef(new Animated.Value(1))
    const scaleUpAnimation = useRef(new Animated.Value(0))

    const onToggle = () => {
        const willBecomeDark = UnistylesRuntime.themeName === 'light'

        const animation1 = Animated.timing(fadeOutAnimation.current, {
            toValue: willBecomeDark ? 0 : 1,
            duration: 250,
            useNativeDriver: true
        })
        const animation2 = Animated.timing(fadeInAnimation.current, {
            toValue: willBecomeDark ? 1 : 0,
            duration: 250,
            useNativeDriver: true
        })
        const animation3 = Animated.timing(scaleDownAnimation.current, {
            toValue: willBecomeDark ? 0.5 : 1,
            duration: 500,
            useNativeDriver: true
        })
        const animation4 = Animated.timing(scaleUpAnimation.current, {
            toValue: willBecomeDark ? 1 : 0,
            duration: 500,
            useNativeDriver: true
        })

        animation1.start()
        animation2.start()
        animation3.start()
        animation4.start()
        UnistylesRuntime.setTheme(willBecomeDark ? 'dark' : 'light')

        willBecomeDark ? onNight() : onDay()
    }

    return (
        <View>
            <Animated.View
                style={{
                    transform: [{ scale: scaleDownAnimation.current }],
                    opacity: fadeOutAnimation.current,
                    ...styles.sun
                }}
            >
                <Sun />
            </Animated.View>
            <Animated.View
                style={{
                    transform: [{ scale: scaleUpAnimation.current }],
                    opacity: fadeInAnimation.current,
                    ...styles.moon
                }}
            >
                <Moon />
            </Animated.View>
            <View style={styles.button}>
                <Button
                    title="Toggle"
                    onPress={onToggle}
                    color={theme.colors.typography}
                />
            </View>
        </View>
    )
}

const stylesheet = createStyleSheet({
    sun: {
        position: 'absolute',
        right: 40,
        top: 40
    },
    moon: {
        position: 'absolute',
        right: 40,
        top: 40
    },
    button: {
        maxWidth: 100,
        top: 120,
        left: 90,
        backgroundColor: `rgba(255, 255, 255, 0.1)`
    }
})
