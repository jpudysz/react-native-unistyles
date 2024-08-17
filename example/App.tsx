import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

const start = performance.now();
const rtl = UnistylesRuntime.rtl
const end = performance.now();

console.log(`Function took ${end - start} milliseconds.`);

export const App = () => {
    const {
        insets,
        colorScheme,
        fontScale,
        screen,
        contentSizeCategory
    } = UnistylesRuntime

    return (
        <View style={styles.container}>
            <TextInput placeholder="Xxx" />
            <Text style={styles.text}>
                T:{insets.top}xB:{insets.bottom}xL:{insets.left}xR:{insets.right}
            </Text>
            <Text style={styles.text}>
                colorScheme: {colorScheme}
            </Text>
            <Text style={styles.text}>
                fontScale: {fontScale}
            </Text>
            <Text style={styles.text}>
                screen: {screen.width}x{screen.height}
            </Text>
            <Text style={styles.text}>
                contentSizeCategory: {contentSizeCategory}
            </Text>
            <Text style={styles.text}>
                rtl: {rtl ? 'true' : 'false'}
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
