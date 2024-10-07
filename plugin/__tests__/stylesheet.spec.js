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
            title: 'Should not add dependencies to StyleSheet if user is not using theme or miniRuntime',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        backgroundColor: 'red'
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: {
                            backgroundColor: 'red'
                        }
                    },
                    793953373
                )
            `
        },
        {
            title: 'Should add dependencies to StyleSheet if user is using theme',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        backgroundColor: theme.colors.background
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
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: {
                            backgroundColor: theme.colors.background,
                            uni__dependencies: [0]
                        }
                    }),
                    793953373
                )
            `
        },
        {
            title: 'Should add dependencies to StyleSheet even if user did rename import',
            code: `
                import { StyleSheet as ST } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = ST.create(theme => ({
                    container: {
                        backgroundColor: theme.colors.background
                    }
                }))
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet as ST } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = ST.create(
                    theme => ({
                        container: {
                            backgroundColor: theme.colors.background,
                            uni__dependencies: [0]
                        }
                    }),
                    793953373
                )
            `
        },
        {
            title: 'Should detect variants for object StyleSheet',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        backgroundColor: 'red',
                        variants: {}
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: {
                            backgroundColor: 'red',
                            variants: {},
                            uni__dependencies: [4]
                        }
                    },
                    793953373
                )
            `
        },
        {
            title: 'Should detect variants for object StyleSheet and dynamic function',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red',
                        variants: {}
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: () => ({
                            backgroundColor: 'red',
                            variants: {},
                            uni__dependencies: [4]
                        })
                    },
                    793953373
                )
            `
        },
        {
            title: 'Should detect miniRuntime dependency',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((_, rt) => ({
                    container: () => ({
                        backgroundColor: 'red',
                        variants: {},
                        paddingTop: rt.insets.top
                    })
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
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (_, rt) => ({
                        container: () => ({
                            backgroundColor: 'red',
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [4, 9]
                        })
                    }),
                    793953373
                )
            `
        },
        {
            title: 'Should detect miniRuntime and theme dependencies even if user renamed it\'s names',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((hhsa, dee) => ({
                    container: () => ({
                        backgroundColor: hhsa.colors.background,
                        variants: {},
                        paddingTop: dee.colorScheme === 'dark' ? 0 : 10
                    })
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
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (hhsa, dee) => ({
                        container: () => ({
                            backgroundColor: hhsa.colors.background,
                            variants: {},
                            paddingTop: dee.colorScheme === 'dark' ? 0 : 10,
                            uni__dependencies: [0, 4, 5]
                        })
                    }),
                    793953373
                )
            `
        },
        {
            title: 'Should detect dependencies in function',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
                        })
                    }
                }, 793953373)
            `
        },
        {
            title: 'Should generates two different ids for 2 stylesheets in the same file',
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top
                        })
                    }
                })
                const styles2 = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={styles.container}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, styles.container, undefined)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
                        })
                    }
                }, 793953373)
                const styles2 = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
                        })
                    }
                }, 793953374)
            `
        },
    ]
})
