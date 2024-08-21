import React from 'react'
import { View, Text, TextInput, Button } from 'react-native'
import { UnistylesRuntime, StatusBarStyle, StyleSheet } from 'react-native-unistyles'

const start = performance.now();
UnistylesRuntime.breakpoint
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
        statusBar,
        pixelRatio,
        orientation,
        themeName,
        breakpoint
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
                status bar: {statusBar.width}x{statusBar.height}
            </Text>
            <Text style={styles.text}>
                pixel ratio: {pixelRatio}
            </Text>
            <Text style={styles.text}>
                orientation: {orientation}
            </Text>
            <Text style={styles.text}>
                current theme: {themeName}
            </Text>
            <Text style={styles.text}>
                current breakpoint: {breakpoint}
            </Text>
            <View style={styles.row}>
                <Button
                    title="Hide status bar"
                    onPress={() => {
                        statusBar.setHidden(true)
                    }}
                />
                <Button
                    title="Show status bar"
                    onPress={() => {
                        statusBar.setHidden(false)
                    }}
                />
            </View>
            <View style={styles.row}>
                <Button
                    title="Set status bar light"
                    onPress={() => {
                        statusBar.setStyle(StatusBarStyle.Light)
                    }}
                />
                <Button
                    title="Set status bar dark"
                    onPress={() => {
                        statusBar.setStyle(StatusBarStyle.Dark)
                    }}
                />
            </View>
            <View style={styles.row}>
                <Button
                    title="Set root view background color"
                    onPress={() => {
                        UnistylesRuntime.setRootViewBackgroundColor('#ff0000')
                    }}
                />
            </View>
            <View style={styles.row}>
                <Button
                    title="Set immersive mode"
                    onPress={() => {
                        UnistylesRuntime.setImmersiveMode(true)
                    }}
                />
            </View>
        </View>
    )
}

StyleSheet.configure({
    settings: {
        adaptiveThemes: true,
        initialTheme: 'dark'
    },
    breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        superLarge: 2000,
        tvLike: 4000
    }
})

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
