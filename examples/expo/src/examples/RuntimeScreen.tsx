import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { UnistylesRuntime, createStyleSheet, useStyles } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'
import { autoGuidelinePlugin } from '../plugins'

export const RuntimeScreen: React.FunctionComponent = () => {
    const {
        screen,
        themeName,
        breakpoint,
        orientation,
        hasAdaptiveThemes,
        colorScheme,
        enabledPlugins,
        removePlugin,
        addPlugin,
        setTheme,
        setAdaptiveThemes
    } = UnistylesRuntime
    const { styles, theme } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <ScrollView>
                    <Text style={styles.title}>
                        Runtime demo
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Screen dimensions:
                        </Text>
                        <Text style={styles.text(false)}>
                            {screen.width}x{screen.height}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Selected theme:
                        </Text>
                        <Text style={styles.text(false)}>
                            {themeName}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Current breakpoint:
                        </Text>
                        <Text style={styles.text(false)}>
                            {breakpoint}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Device orientation:
                        </Text>
                        <Text style={styles.text(false)}>
                            {orientation}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Adaptive themes:
                        </Text>
                        <Text style={styles.text(false)}>
                            {hasAdaptiveThemes ? 'Enabled' : 'Disabled'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Preferred scheme:
                        </Text>
                        <Text style={styles.text(false)}>
                            {colorScheme}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text(true)}>
                            Enabled plugins:
                        </Text>
                        <Text style={styles.text(false)}>
                            {enabledPlugins.length > 0 ? enabledPlugins.join(', ') : 'None'}
                        </Text>
                    </View>
                    <View style={styles.buttons}>
                        <View style={styles.row}>
                            <Button
                                color={theme.colors.accent}
                                title={enabledPlugins.includes(autoGuidelinePlugin.name)
                                    ? 'Remove Auto Guideline plugin'
                                    : 'Add Auto Guideline plugin'
                                }
                                onPress={() => enabledPlugins.includes(autoGuidelinePlugin.name)
                                    ? removePlugin(autoGuidelinePlugin)
                                    : addPlugin(autoGuidelinePlugin)
                                }
                            />
                        </View>
                        <View style={styles.row}>
                            <Button
                                color={theme.colors.accent}
                                title="Change theme"
                                onPress={() => {
                                    switch (themeName) {
                                        case 'light':
                                            return setTheme('dark')
                                        case 'dark':
                                            return setTheme('premium')
                                        default:
                                            return setTheme('light')
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.row}>
                            <Button
                                color={theme.colors.accent}
                                title={hasAdaptiveThemes ? 'Disable adaptive themes' : 'Enable adaptive themes'}
                                onPress={() => setAdaptiveThemes(!hasAdaptiveThemes)}
                            />
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.note}>
                                * - Toggling adaptive themes re-renders components only if the theme changes
                            </Text>
                        </View>
                    </View>
                    <View style={styles.fakeSpacer} />
                </ScrollView>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5
    },
    title: {
        fontSize: 20,
        marginBottom: 30,
        fontWeight: 'bold',
        color: theme.colors.accent
    },
    text: (bold: boolean) =>({
        fontSize: 16,
        flex: 1,
        color: theme.colors.typography,
        fontWeight: bold ? 'bold' : 'normal'
    }),
    note: {
        marginTop: 10,
        fontSize: 12,
        textAlign: 'center',
        color: theme.colors.typography
    },
    buttons: {
        marginTop: 50
    },
    button: {
        backgroundColor: theme.colors.accent,
        padding: 10,
        borderRadius: 5,
        marginTop: 20
    },
    fakeSpacer: {
        height: 100
    }
}))
