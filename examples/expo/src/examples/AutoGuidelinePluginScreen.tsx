import React, { useEffect } from 'react'
import { Button, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRegistry, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { autoGuidelinePlugin } from '../plugins'

export const AutoGuidelinePluginScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    useEffect(() => {
        // plugins can be runtime enabled/disabled
        // it will cause re-render of the stylesheets
        UnistylesRegistry.addExperimentalPlugin(autoGuidelinePlugin)

        return () => {
            UnistylesRegistry.removeExperimentalPlugin(autoGuidelinePlugin)
        }
    }, [])

    // check if plugin is enabled with runtime
    const isAutoGuidelinePluginEnabled = UnistylesRuntime
        .enabledPlugins
        .includes(autoGuidelinePlugin.name)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a enabled Auto Guideline plugin
                </Text>
                <Text style={styles.text}>
                    It will scale your text and sizes based on the screen size
                </Text>
                <Text style={styles.text}>
                    Box won't scale because plugin skips styles with `unscaled` prefix
                </Text>
                <View style={styles.unscaledBox} />
                <Button
                    title={isAutoGuidelinePluginEnabled ? 'Disable plugin' : 'Enable plugin'}
                    onPress={() => {
                        isAutoGuidelinePluginEnabled
                            ? UnistylesRegistry.removeExperimentalPlugin(autoGuidelinePlugin)
                            : UnistylesRegistry.addExperimentalPlugin(autoGuidelinePlugin)
                    }}
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
        rowGap: 10,
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 12,
        textAlign: 'center',
        color: theme.colors.typography
    },
    unscaledBox: {
        width: 100,
        height: 100,
        backgroundColor: theme.colors.blood
    }
}))
