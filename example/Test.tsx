import React, { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const [, setCounter] = useState(0)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Selected theme: {UnistylesRuntime.themeName ?? '-'}
            </Text>
            <Text style={styles.text}>
                Has adaptive themes: {UnistylesRuntime.hasAdaptiveThemes ? 'true' : 'false'}
            </Text>
            <Text style={styles.text}>
                Current breakpoint: {UnistylesRuntime.breakpoint ?? '-'}
            </Text>
            <Button
                title="Re-render"
                onPress={() => setCounter(prevState => prevState + 1)}
            />
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: theme.colors.typography,
        marginTop: theme.gap(1)
    }
}))
