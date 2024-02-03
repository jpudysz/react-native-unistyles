import React from 'react'
import { createStyleSheet, useStyles, UnistylesRuntime, mq } from 'react-native-unistyles'
import { ScrollView, View, Text, Image, Pressable } from 'react-native'
import { highContrastPlugin } from './highContrastPlugin'
import './styles'

const Logo = require('./logo.png')

export const App: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)
    const {
        screen,
        breakpoint,
        colorScheme,
        contentSizeCategory,
        themeName,
        orientation,
        setAdaptiveThemes,
        hasAdaptiveThemes,
        setTheme,
        enabledPlugins,
        addPlugin,
        removePlugin,
        updateTheme
    } = UnistylesRuntime

    return (
        <View style={styles.container}>
            <ScrollView contentInsetAdjustmentBehavior="automatic" >
                <Image
                    source={Logo}
                    style={styles.logo}
                />
                <Text style={styles.heading}>
                    Welcome to Unistyles!
                </Text>
                <View style={styles.row}>
                    <View style={styles.runtime}>
                        <Text style={styles.title}>
                            Runtime values:
                        </Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Screen dimensions:
                            </Text>
                            <Text style={styles.value}>
                                {screen.width}x{screen.height}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Current breakpoint:
                            </Text>
                            <Text style={styles.value}>
                                {breakpoint}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Color scheme:
                            </Text>
                            <Text style={styles.value}>
                                {colorScheme}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Content size category:
                            </Text>
                            <Text style={styles.value}>
                                {contentSizeCategory}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Selected theme:
                            </Text>
                            <Text style={styles.value}>
                                {themeName}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Orientation:
                            </Text>
                            <Text style={styles.value}>
                                {orientation}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Has adaptive themes:
                            </Text>
                            <Text style={styles.value}>
                                {hasAdaptiveThemes ? 'Yes' : 'No'}
                            </Text>
                        </View>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueName}>
                                Enabled plugins:
                            </Text>
                            <Text style={styles.value}>
                                {enabledPlugins.length > 0 ? enabledPlugins.join(', ') : '-'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <Text style={styles.title}>
                            Actions:
                        </Text>
                        <Pressable
                            style={event => styles.button(event.pressed)}
                            onPress={() => {
                                switch (themeName) {
                                    case 'light':
                                        return setTheme('dark')
                                    case 'dark':
                                        return setTheme('premium')
                                    case 'premium':
                                    default:
                                        return setTheme('light')
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>
                                Change theme
                            </Text>
                        </Pressable>
                        <Pressable
                            style={event => styles.button(event.pressed)}
                            onPress={() => setAdaptiveThemes(!hasAdaptiveThemes)}
                        >
                            <Text style={styles.buttonText}>
                                Toggle adaptive themes
                            </Text>
                        </Pressable>
                        <Pressable
                            style={event => styles.button(event.pressed)}
                            onPress={() => {
                                enabledPlugins.includes(highContrastPlugin.name)
                                    ? removePlugin(highContrastPlugin)
                                    : addPlugin(highContrastPlugin)
                            }}
                        >
                            <Text style={styles.buttonText}>
                                Toggle plugin
                            </Text>
                        </Pressable>
                        <Pressable
                            style={event => styles.button(event.pressed)}
                            onPress={() => {
                                switch (themeName) {
                                    case 'light':
                                        return updateTheme('light', theme => ({
                                            ...theme,
                                            colors: {
                                                ...theme.colors,
                                                typography: theme.colors.typography === '#000000'
                                                    ? '#00d2d3'
                                                    : '#000000'
                                            }
                                        }))
                                    case 'dark':
                                        return updateTheme('dark', theme => ({
                                            ...theme,
                                            colors: {
                                                ...theme.colors,
                                                typography: theme.colors.typography === '#ffffff'
                                                    ? '#00d2d3'
                                                    : '#ffffff'
                                            }
                                        }))
                                    case 'premium':
                                    default:
                                        return updateTheme('premium', theme => ({
                                            ...theme,
                                            colors: {
                                                ...theme.colors,
                                                typography: theme.colors.typography === '#76278f'
                                                    ? '#000000'
                                                    : '#76278f'
                                            }
                                        }))
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>
                                Update theme
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.backgroundColor
    },
    logo: {
        height: 200,
        width: 200,
        alignSelf: 'center',
        resizeMode: 'cover',
        marginBottom: 16
    },
    heading: {
        fontSize: 34,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 16,
        color: theme.colors.typography
    },
    row: {
        borderTopWidth: 2,
        borderTopColor: theme.colors.accent,
        flexDirection: {
            [mq.only.width(null, 630)]: 'column',
            [mq.only.width(630)]: 'row'
        },
        alignItems: {
            [mq.only.width(null, 630)]: 'center',
            [mq.only.width(630)]: undefined
        },
        paddingTop: 16
    },
    runtime: {
        flex: 1
    },
    actions: {
        flex: 1,
        marginTop: {
            [mq.only.width(null, 630)]: 40,
            [mq.only.width(630)]: undefined
        }
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.colors.typography
    },
    valueContainer: {
        flexDirection: 'row'
    },
    valueName: {
        marginRight: 8,
        color: theme.colors.accent
    },
    value: {
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    button: (pressed: boolean) => ({
        width: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.accent,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        opacity: pressed ? 0.5 : 1
    }),
    buttonText: {
        color: theme.colors.backgroundColor,
        fontWeight: 'bold'
    }
}))
