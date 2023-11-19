import React from 'react'
import { UnistylesRegistry } from 'react-native-unistyles'
import type { UnistylesThemes } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DemoGroup, DemoLink } from '../components'
import { DemoNames } from '../common'
import type { NavigationProps } from '../common'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from '../styles'
import { autoGuidelinePlugin } from '../plugins'

export const HomeScreen = () => {
    const navigation = useNavigation<NavigationProps>()
    const { top } = useSafeAreaInsets()

    return (
        <View
            style={{
                ...styles.container,
                paddingTop: top
            }}
        >
            <View style={styles.titleContainer}>
                <Text style={styles.unicorn}>
                    🦄
                </Text>
                <Text style={styles.header}>
                    Welcome to Unistyles 2.0!
                </Text>
                <Text style={styles.text}>
                    / Select demo /
                </Text>
            </View>
            <ScrollView contentContainerStyle={styles.list}>
                <DemoGroup title="Themes">
                    <DemoLink
                        description="No themes"
                        onPress={() => navigation.navigate(DemoNames.NoThemes)}
                    />
                    <DemoLink
                        description="Single theme"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme
                                    // we need to cast it to UnistylesThemes as we already registered 3 themes with TypeScript under styles/index.ts,
                                    // but we want to demonstrate how to register a single theme
                                } as UnistylesThemes)

                            navigation.navigate(DemoNames.SingleTheme)
                        }}
                    />
                    <DemoLink
                        description="Two themes"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    premium: premiumTheme
                                    // we need to cast it to UnistylesThemes as we already registered 3 themes with TypeScript under styles/index.ts,
                                    // but we want to demonstrate how to register two themes
                                } as UnistylesThemes)
                                .addConfig({
                                    initialTheme: 'light'
                                })

                            navigation.navigate(DemoNames.TwoThemes)
                        }}
                    />
                    <DemoLink
                        description="Light/Dark themes"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme
                                    // we need to cast it to UnistylesThemes as we already registered 3 themes with TypeScript under styles/index.ts,
                                    // but we want to demonstrate how to register two themes
                                } as UnistylesThemes)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.LightDarkThemes)
                        }}
                    />
                    <DemoLink
                        description="Multiple themes"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })

                            navigation.navigate(DemoNames.MultipleThemes)
                        }}
                    />
                    <DemoLink
                        description="Multiple themes and adaptive modes"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.MultipleThemesAdaptive)
                        }}
                    />
                </DemoGroup>
                <DemoGroup title="Breakpoints">
                    <DemoLink
                        description="No breakpoints"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })

                            navigation.navigate(DemoNames.NoBreakpoints)
                        }}
                    />
                    <DemoLink
                        description="With breakpoints"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.WithBreakpoints)
                        }}
                    />
                    <DemoLink
                        description="With orientation breakpoints"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.OrientationBreakpoints)
                        }}
                    />
                </DemoGroup>
                <DemoGroup title="Media queries">
                    <DemoLink
                        description="Width and Height"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.MediaQueriesWidthHeight)
                        }}
                    />
                    <DemoLink
                        description="Mixed with breakpoints"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.MixedMediaQueries)
                        }}
                    />
                </DemoGroup>
                <DemoGroup title="Variants">
                    <DemoLink
                        description="With selected variant"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.Variants)
                        }}
                    />
                </DemoGroup>
                <DemoGroup title="Plugins">
                    <DemoLink
                        description="Auto guideline"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true,
                                    // plugin can be registry enabled
                                    experimentalPlugins: [autoGuidelinePlugin]
                                })

                            navigation.navigate(DemoNames.AutoGuidelinePlugin)
                        }}
                    />
                    <DemoLink
                        description="High contrast"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    adaptiveThemes: true
                                })

                            navigation.navigate(DemoNames.HighContrastPlugin)
                        }}
                    />
                </DemoGroup>
                <DemoGroup title="Runtime">
                    <DemoLink
                        description="Runtime values"
                        onPress={() => {
                            UnistylesRegistry
                                .addThemes({
                                    light: lightTheme,
                                    dark: darkTheme,
                                    premium: premiumTheme
                                })
                                .addBreakpoints(breakpoints)
                                .addConfig({
                                    initialTheme: 'light'
                                })

                            navigation.navigate(DemoNames.Runtime)
                        }}
                    />
                </DemoGroup>
            </ScrollView>
        </View>
    )
}

// oh, no! StyleSheet.create in unistyles demo!?
// yup, it's just a wrapper for all the demos, I want to demonstrate startup time
// and I don't want to use unistyles for this screen
// by the way, now you can appreciate what unistyles does for you!
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ff9ff3'
    },
    titleContainer: {
        alignItems: 'center'
    },
    unicorn: {
        fontSize: 80
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#B53471'
    },
    text: {
        color: '#2f3542',
        fontWeight: 'bold'
    },
    list: {
        marginTop: 50,
        paddingHorizontal: 20
    }
})
