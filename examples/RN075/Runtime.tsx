import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

export const App = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {UnistylesRuntime.name}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20
    },
    text: {
        fontSize: 16,
        color: 'red'
    }
})
