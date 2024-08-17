import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

const start = performance.now();
const colorScheme = UnistylesRuntime.colorScheme
const end = performance.now();

console.log(`Function took ${end - start} milliseconds.`);

export const App = () => {
    const insets = UnistylesRuntime.insets

    return (
        <View style={styles.container}>
            <TextInput placeholder="Xxx" />
            <Text style={styles.text}>
                T:{insets.top}xB:{insets.bottom}xL:{insets.left}xR:{insets.right}
            </Text>
            <Text style={styles.text}>
                colorScheme: {colorScheme}
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
