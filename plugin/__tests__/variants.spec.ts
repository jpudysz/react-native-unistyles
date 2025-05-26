import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src'
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true
        }
    },
    tests: [
        {
            title: 'Should clone stylesheet while using variants',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        backgroundColor: theme.colors.background,
                        variants: {
                            size: {
                                small: {
                                    width: 100,
                                    height: 100
                                },
                                medium: {
                                    width: 200,
                                    height: 200
                                },
                                large: {
                                    width: 300,
                                    height: 300
                                }
                            }
                        }
                    }
                }))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const _styles = styles
                    {
                        const styles = _styles.useVariants({
                            size: 'small'
                        })

                        return (
                            <View style={styles.container}>
                                <Text>Hello world</Text>
                            </View>
                        )
                    }
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        container: {
                            backgroundColor: theme.colors.background,
                            variants: {
                                size: {
                                    small: {
                                        width: 100,
                                        height: 100
                                    },
                                    medium: {
                                        width: 200,
                                        height: 200
                                    },
                                    large: {
                                        width: 300,
                                        height: 300
                                    }
                                }
                            },
                            uni__dependencies: [0, 4]
                        }
                    }),
                    895829844
                )
            `
        },
        {
            title: 'Should respect user names',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    s.useVariants({
                        size: 'small'
                    })

                    return (
                        <View style={s.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const s = StyleSheet.create({})
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const _s = s
                    {
                        const s = _s.useVariants({
                            size: 'small'
                        })

                        return (
                            <View style={s.container}>
                                <Text>Hello world</Text>
                            </View>
                        )
                    }
                }

                const s = StyleSheet.create({}, 895829844)
            `
        },
        {
            title: 'Should create multiple nested scoped',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                            {[1, 2, 3].map((_, index) => {
                                styles.useVariants({
                                    size: 'large'
                                })

                                return (
                                    <View style={styles.p} key={index} />
                                )
                            })}
                        </View>
                    )
                }

                const styles = StyleSheet.create({})
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const _styles = styles
                    {
                        const styles = _styles.useVariants({
                            size: 'small'
                        })
                        const _styles2 = styles
                        {
                            const styles = _styles2.useVariants({
                                size: 'small'
                            })

                            return (
                                <View style={styles.container}>
                                    <Text>Hello world</Text>
                                    {[1, 2, 3].map((_, index) => {
                                        const _styles3 = styles
                                        {
                                            const styles = _styles3.useVariants({
                                                size: 'large'
                                            })

                                            return <View style={styles.p} key={index} />
                                        }
                                    })}
                                </View>
                            )
                        }
                    }
                }

                const styles = StyleSheet.create({}, 895829844)
            `
        }
    ]
})
