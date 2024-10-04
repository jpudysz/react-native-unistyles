import { pluginTester } from 'babel-plugin-tester'
import plugin from '../'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true
        }
    },
    tests: [
        {
            title: 'Should detect dependencies in variants',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        variants: {
                            size: {
                                small: {
                                    backgroundColor: theme.colors.blue,
                                    paddingTop: theme.gap(10),
                                    marginBottom: rt.insets.bottom === 0
                                        ? theme.gap(20)
                                        : theme.gap(30)
                                }
                            }
                        }
                    }
                }))
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        variants: {
                            size: {
                                small: {
                                    backgroundColor: theme.colors.blue,
                                    paddingTop: theme.gap(10),
                                    marginBottom: rt.insets.bottom === 0 ? theme.gap(20) : theme.gap(30)
                                }
                            }
                        },
                        uni__dependencies: [0, 9, 4]
                    }
                }))
            `
        },
        {
            title: 'Should detect dependencies in breakpoints',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        backgroundColor: {
                            sm: theme.colors.blue
                        },
                        padding: {
                            xs: rt.insets.top
                        }
                    }
                }))
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        backgroundColor: {
                            sm: theme.colors.blue
                        },
                        padding: {
                            xs: rt.insets.top
                        },
                        uni__dependencies: [0, 9]
                    }
                }))
            `
        },
        {
            title: 'Should detect dependencies in calculations',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        marginTop: theme.gap(2) + rt.insets.bottom,
                        marginBottom: theme.gap(2) * rt.statusBar.height,
                        paddingTop: theme.gap(2) - rt.navigationBar.height
                    }
                }))
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        marginTop: theme.gap(2) + rt.insets.bottom,
                        marginBottom: theme.gap(2) * rt.statusBar.height,
                        paddingTop: theme.gap(2) - rt.navigationBar.height,
                        uni__dependencies: [0, 9, 12, 13]
                    }
                }))
            `
        },
    ]
})
