import React from 'react'
import { View, Text, StyleSheet, TextInput, Button } from 'react-native'
import { UnistylesRuntime, StatusBarStyle } from 'react-native-unistyles'

const start = performance.now();
const width = UnistylesRuntime.statusBar.width
const height = UnistylesRuntime.statusBar.height
const end = performance.now();

console.log(`Function took ${end - start} milliseconds.`);

export const App = () => {
    const {
        insets,
        colorScheme,
        fontScale,
        screen,
        contentSizeCategory,
        rtl,
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
            <Text style={styles.text}>
                status bar: {width}x{height}
            </Text>
            <View style={styles.row}>
                <Button
                    title="Hide status bar"
                    onPress={() => {
                        UnistylesRuntime.statusBar.setHidden(true)
                    }}
                />
                <Button
                    title="Show status bar"
                    onPress={() => {
                        UnistylesRuntime.statusBar.setHidden(false)
                    }}
                />
            </View>
            <View style={styles.row}>
                <Button
                    title="Set status bar light"
                    onPress={() => {
                        UnistylesRuntime.statusBar.setStyle(StatusBarStyle.Light)
                    }}
                />
                <Button
                    title="Set status bar dark"
                    onPress={() => {
                        UnistylesRuntime.statusBar.setStyle(StatusBarStyle.Dark)
                    }}
                />
            </View>
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
    },
    row: {
        flexDirection: 'row'
    }
})
