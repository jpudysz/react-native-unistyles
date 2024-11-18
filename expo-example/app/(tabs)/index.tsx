import React from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={{ ...styles.text, ...styles.textColor }}>
                HomeScreen
            </Text>
            <Button
                title='Click me'
                onPress={() => {
                    UnistylesRuntime.setTheme(UnistylesRuntime.themeName === 'dark' ? 'light' : 'dark')
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: theme.colors.backgroundColor,
    },
    textColor: {
        color: theme.colors.typography
    }
}))
