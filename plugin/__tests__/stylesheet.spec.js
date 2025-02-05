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
                import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                    798826616
                )
            `
        },
        {
            title: 'Should add dependencies to StyleSheet if user is using theme',
            code: `
            import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                    798826616
                )
            `
        },
        {
            title: 'Should add dependencies to StyleSheet even if user did rename import',
            code: `
                import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet as ST } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                    798826616
                )
            `
        },
        {
            title: 'Should detect variants for object StyleSheet',
            code: `
                import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                    798826616
                )
            `
        },
        {
            title: 'Should detect variants for object StyleSheet and dynamic function',
            code: `
            import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                    798826616
                )
            `
        },
        {
            title: 'Should detect miniRuntime dependency',
            code: `
            import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                            uni__dependencies: [9, 4]
                        })
                    }),
                    798826616
                )
            `
        },
        {
            title: 'Should detect miniRuntime and theme dependencies even if user renamed it\'s names',
            code: `
                import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
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
                            uni__dependencies: [0, 5, 4]
                        })
                    }),
                    798826616
                )
            `
        },
        {
            title: 'Should detect dependencies in function',
            code: `
            import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

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
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 9, 4]
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should generates two different ids for 2 stylesheets in the same file',
            code: `
                import { View, Text } from 'react-native'
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

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
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 9, 4]
                        })
                    }
                }, 798826616)
                const styles2 = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 9, 4]
                        })
                    }
                }, 798826617)
            `
        },
        {
            title: 'Should do nothing if pressable is parameterless arrow function and style is an object',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={() => styles.pressable}>
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top
                        }),
                        pressable: {
                            marginRight: arg1 + arg2
                        }
                    }
                })
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { Pressable } from 'react-native-unistyles/components/native/Pressable'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={() => styles.pressable}>
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 9, 4]
                        }),
                        pressable: {
                            marginRight: arg1 + arg2
                        }
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should handle pressable with arrow function and array of styles',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={({ pressed }) => [styles.sectionItem, styles.other(1), { height }, pressed && styles.pressed]}>
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    sectionItem: {
                        width: 100,
                        height: 100,
                        theme: theme.colors.red
                    },
                    pressed: {
                        marginBottom: rt.insets.bottom
                    }
                }))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { Pressable } from 'react-native-unistyles/components/native/Pressable'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={({ pressed }) => [styles.sectionItem, styles.other(1), { height }, pressed && styles.pressed]}>
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        sectionItem: {
                            width: 100,
                            height: 100,
                            theme: theme.colors.red,
                            uni__dependencies: [0]
                        },
                        pressed: {
                            marginBottom: rt.insets.bottom,
                            uni__dependencies: [9]
                        }
                    }),
                    798826616
                )
            `
        },
        {
            title: 'Should handle nested functions',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={({ pressed }) => [styles.sectionItem, { height }, pressed && styles.pressed(pressed), pressed ? styles.pressed : styles.notPressed]}>
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    sectionItem: {
                        width: 100,
                        height: 100,
                        theme: theme.colors.red
                    },
                    pressed: pressed => ({
                        marginBottom: rt.insets.bottom
                    })
                }))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { Pressable } from 'react-native-unistyles/components/native/Pressable'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View style={styles.container}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.sectionItem,
                                    { height },
                                    pressed && styles.pressed(pressed),
                                    pressed ? styles.pressed : styles.notPressed
                                ]}
                            >
                                <Text>Hello world</Text>
                            </Pressable>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        sectionItem: {
                            width: 100,
                            height: 100,
                            theme: theme.colors.red,
                            uni__dependencies: [0]
                        },
                        pressed: pressed => ({
                            marginBottom: rt.insets.bottom,
                            uni__dependencies: [9]
                        })
                    }),
                    798826616
                )
            `
        },
        {
            title: 'Should use same local name as user name while replacing imports',
            code: `
                import { View as RNView } from 'react-native'
                import { Pressable } from 'react-native'
                import { Text as SuperText } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const onPressInternal = () => {}
                    return (
                        <RNView>
                            <Pressable style={[styles.inputContainer]} onPress={onPressInternal} />
                            <SuperText>Hello world</SuperText>
                        </RNView>
                    )
                }

                const styles = StyleSheet.create({
                    inputContainer: {}
                })
            `,
            output: `
                import { Text as SuperText } from 'react-native-unistyles/components/native/Text'
                import { Pressable } from 'react-native-unistyles/components/native/Pressable'
                import { View as RNView } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const onPressInternal = () => {}
                    return (
                        <RNView>
                            <Pressable style={[styles.inputContainer]} onPress={onPressInternal} />
                            <SuperText>Hello world</SuperText>
                        </RNView>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        inputContainer: {}
                    },
                    798826616
                )
            `
        }
    ]
})
