import React from 'react'
import { View, Text, Button } from 'react-native'
import { UnistylesRuntime, createStyleSheet, useStyles } from 'react-native-unistyles'

export const Cxx = () => {
    const { styles, theme } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                C++ Unistyles Example 🦄
            </Text>
            <View style={styles.row}>
                <Text style={styles.title}>
                    Current breakpoint:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.currentBreakpoint}`}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.title}>
                    Theme:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.theme}`}
                </Text>
            </View>
            <Button
                color={theme.colors.accent}
                title="Change theme"
                onPress={() => {
                    const currentTheme = UnistylesRuntime.theme
                    const nextTheme = currentTheme === 'light'
                        ? 'dark'
                        : currentTheme === 'dark'
                            ? 'premium'
                            : 'light'
                    UnistylesRuntime.setTheme(nextTheme)
                }}
            />
            <View style={styles.boxes}>
                {Array.from(new Array(3)).map((_, index) => (
                    <View
                        key={index}
                        style={styles.box}
                    />
                ))}
            </View>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    title: {
        color: theme.colors.typography,
        marginBottom: 20
    },
    bold: {
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    row: {
        flexDirection: 'row'
    },
    boxes: {
        flexDirection: {
            sm: 'row',
            lg: 'column'
        },
        flexWrap: 'wrap',
        gap: 10
    },
    box: {
        width: 50,
        height: 50,
        backgroundColor: theme.colors.accent
    }
}))
