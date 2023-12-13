import React, { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { highContrastPlugin } from '../plugins'

export const HighContrastPluginScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    useEffect(() => {
        // plugins can be runtime enabled/disabled
        // it will cause re-render of the stylesheets
        UnistylesRuntime.addPlugin(highContrastPlugin)

        return () => {
            UnistylesRuntime.removePlugin(highContrastPlugin)
        }
    }, [])

    // check if plugin is enabled with runtime
    const isHighContrastPluginEnabled = UnistylesRuntime
        .enabledPlugins
        .includes(highContrastPlugin.name)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a enabled High Contrast plugin
                </Text>
                <Text style={styles.text}>
                    It will automatically change your theme colors to high contrast
                </Text>
                <View style={styles.circle} />
                <Pressable
                    style={styles.button}
                    onPress={() => {
                        isHighContrastPluginEnabled
                            ? UnistylesRuntime.removePlugin(highContrastPlugin)
                            : UnistylesRuntime.addPlugin(highContrastPlugin)
                    }}
                >
                    <Text style={styles.text}>
                        {isHighContrastPluginEnabled ? 'Disable high contrast' : 'Enable high contrast'}
                    </Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={() => {
                        switch (UnistylesRuntime.themeName) {
                            case 'light':
                                return UnistylesRuntime.setTheme('dark')
                            case 'dark':
                                return UnistylesRuntime.setTheme('premium')
                            case 'premium':
                            default:
                                return UnistylesRuntime.setTheme('light')
                        }
                    }}
                >
                    <Text style={styles.text}>
                        Change theme
                    </Text>
                </Pressable>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 10,
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    },
    button: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.backgroundColor
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.accent
    }
}))
