import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useAnimatedTheme } from 'react-native-unistyles/reanimated'

export default function TabTwoScreen() {
    const theme = useAnimatedTheme()
    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: theme.value.colors.backgroundColor
    }))

    return (
        <Animated.View style={[animatedStyle, styles.container]}>
            <Text style={styles.text}>
                Explore
            </Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    }
}))
