import React from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {UnistylesRuntime.hasAdaptiveThemes ? 'true' : 'false'}
            </Text>
            <Button
                title="Change theme"
                onPress={() => {
                    // setCounter(prevState => prevState + 1)

                    UnistylesRuntime.setTheme('dark')
                }}
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
