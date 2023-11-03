import React from 'react'
import { View, Text, Button } from 'react-native'
import { UnistylesRuntime, createStyleSheet, useStyles, ScreenOrientation } from 'react-native-unistyles'

export const Cxx = () => {
    const { styles, theme } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.unicorn}>
                🦄
            </Text>
            <Text style={styles.header}>
                C++ Unistyles Example
            </Text>
            <View style={styles.row}>
                <Text style={styles.title}>
                     Breakpoint:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.breakpoint}`}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.title}>
                    Theme name:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.themeName}`}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.title}>
                    Screen size:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.screen.width}x${UnistylesRuntime.screen.height}`}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.title}>
                    Orientation:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.orientation === ScreenOrientation.Portrait
                        ? 'portrait'
                        : 'landscape'}`}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.title}>
                    System color scheme:
                </Text>
                <Text style={styles.bold}>
                    {` ${UnistylesRuntime.colorScheme}`}
                </Text>
            </View>
            <View style={styles.boxes}>
                {Array.from(new Array(3)).map((_, index) => (
                    <View
                        key={index}
                        style={styles.box}
                    />
                ))}
            </View>
            <View style={styles.actions}>
                <Button
                    color={theme.colors.accent}
                    title="Change theme"
                    onPress={() => {
                        const currentTheme = UnistylesRuntime.themeName
                        const nextTheme = currentTheme === 'light'
                            ? 'dark'
                            : currentTheme === 'dark'
                                ? 'premium'
                                : 'light'
                        UnistylesRuntime.setTheme(nextTheme)
                    }}
                />
            </View>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    unicorn: {
        fontSize: {
            sm: 100,
            lg: 50
        }
    },
    header: {
        fontSize: {
            sm: 20,
            lg: 16
        },
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.colors.typography
    },
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
        width: '60%',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    boxes: {
        flexDirection: {
            sm: 'column',
            lg: 'row'
        },
        flexWrap: 'wrap',
        gap: 10
    },
    box: {
        width: {
            sm: 50,
            lg: 40
        },
        height: {
            sm: 50,
            lg: 40
        },
        borderRadius: {
            lg: 20
        },
        backgroundColor: theme.colors.accent,
        marginVertical: 10
    },
    spacer: {
        width: '50%',
        height: 1,
        backgroundColor: theme.colors.typography
    },
    actions: {
        marginTop: 20
    }
}))
