import React, { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'
import { autoGuidelinePlugin } from '../plugins'

export const AutoGuidelinePluginScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    useEffect(() => () => {
        UnistylesRuntime.removePlugin(autoGuidelinePlugin)
    }, [])

    // check if plugin is enabled with runtime
    const isAutoGuidelinePluginEnabled = UnistylesRuntime
        .enabledPlugins
        .includes(autoGuidelinePlugin.name)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                                ? UnistylesRuntime.removePlugin(autoGuidelinePlugin)
                                : UnistylesRuntime.addPlugin(autoGuidelinePlugin)
                        }}
                    />
                    <View style={styles.fakeSpacer} />
                </ScrollView>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundColor
    },
    scrollContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: {
            xs: 10,
            sm: 5
        },
        marginTop: 20,
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
    },
    fakeSpacer: {
        height: 200
    }
}))
