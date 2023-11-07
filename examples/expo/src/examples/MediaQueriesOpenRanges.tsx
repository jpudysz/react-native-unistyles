import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRegistry, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { darkTheme, lightTheme, premiumTheme } from '../styles'
import { useLazyRegistryForDemo } from '../hooks'

export const MediaQueriesOpenRanges: React.FunctionComponent = () => {
    useLazyRegistryForDemo(() => {
        UnistylesRegistry
            .addThemes({
                light: lightTheme,
                dark: darkTheme,
                premium: premiumTheme
            })
            .addConfig({
                adaptiveThemes: true
            })
    })

    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has media queries for width and height with open ranges
                </Text>
                <Text style={styles.text}>
                    Open range uses `(` or `)` instead of `[` or `]`
                </Text>
                <Text style={styles.text}>
                    Your window dimensions are: {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
                </Text>
                <Text>
                    Rotate or resize the window to see the changes
                </Text>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: {
            ':w[, 430):h[, 932)': theme.colors.backgroundColor,
            ':w[430]:h[, 932]': theme.colors.aloes
        },
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    }
}))
