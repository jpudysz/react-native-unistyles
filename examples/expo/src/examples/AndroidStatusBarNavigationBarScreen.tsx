import React, { useEffect } from 'react'
import { Platform, Text, View } from 'react-native'
import { UnistylesRuntime, createStyleSheet, useStyles } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

export const AndroidStatusBarNavigationBarScreen: React.FunctionComponent = () => {
    const { styles, theme } = useStyles(stylesheet)

    useEffect(() => {
        UnistylesRuntime.statusBar.setColor(theme.colors.aloes)
        UnistylesRuntime.navigationBar.setColor(theme.colors.aloes)

        return () => {
            UnistylesRuntime.statusBar.setColor()
            UnistylesRuntime.navigationBar.setColor()
        }
    }, [])

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen presents how to change status bar / navigation bar colors with UnistylesRuntime
                </Text>
                {Platform.OS !== 'android' && (
                    <Text style={styles.bold}>
                        Please open Android emulator to see the effect
                    </Text>
                )}
                <Button
                    color={theme.colors.accent}
                    title="Set status bar color"
                    onPress={() => UnistylesRuntime.statusBar.setColor(theme.colors.fog)}
                />
                <Button
                    color={theme.colors.accent}
                    title="Set navigation bar color"
                    onPress={() => UnistylesRuntime.navigationBar.setColor(theme.colors.blood)}
                />
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
        backgroundColor: theme.colors.backgroundColor,
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography,
        fontSize: 14
    },
    bold: {
        fontWeight: 'bold'
    }
}))
