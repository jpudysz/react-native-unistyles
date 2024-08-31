import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    return (
        <View style={styles.container}>
            <Text>
                Current breakpoint: {UnistylesRuntime.breakpoint}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor,
    }
}))
