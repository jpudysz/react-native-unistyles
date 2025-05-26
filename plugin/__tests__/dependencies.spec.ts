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
            title: 'Should detect dependencies in variants',
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
                    (theme, rt) => ({
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
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should detect dependencies in breakpoints',
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
                    (theme, rt) => ({
                        container: {
                            backgroundColor: {
                                sm: theme.colors.blue
                            },
                            padding: {
                                xs: rt.insets.top
                            },
                            uni__dependencies: [0, 9]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should detect dependencies in calculations',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        marginTop: theme.gap(2) + rt.insets.bottom,
                        marginBottom: theme.gap(2) * rt.statusBar.height,
                        paddingTop: theme.gap(2) - rt.navigationBar.height
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
                    (theme, rt) => ({
                        container: {
                            marginTop: theme.gap(2) + rt.insets.bottom,
                            marginBottom: theme.gap(2) * rt.statusBar.height,
                            paddingTop: theme.gap(2) - rt.navigationBar.height,
                            uni__dependencies: [0, 9, 12, 13]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should detect dependencies in _web',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        flex: 1,
                        display: 'flex'
                    },
                    static: {
                        backgroundColor: 'pink'
                    },
                    staticText: {
                        color: 'red'
                    },
                    theme: {
                        backgroundColor: theme.colors.backgroundColor
                    },
                    themeText: {
                        color: theme.colors.typography
                    },
                    themeButtonsContainer: {
                        marginTop: 20,
                        flexDirection: 'row',
                        gap: 10
                    },
                    dynamic: state => ({
                        backgroundColor: state % 2 === 0 ? theme.colors.fog : theme.colors.oak
                    }),
                    whiteText: {
                        color: 'white',
                        textAlign: 'center'
                    },
                    hover: {
                        backgroundColor: theme.colors.blood,
                        cursor: 'pointer',
                        _web: {
                            _hover: {
                                backgroundColor: theme.colors.sky,
                                paddingTop: rt.insets.top
                            }
                        }
                    },
                    breakpoint: {
                        backgroundColor: {
                            xs: theme.colors.blood,
                            md: theme.colors.sky,
                            xl: theme.colors.aloes
                        },
                        transform: [
                            {
                                translateX: {
                                    xs: rt.fontScale * 10,
                                    md: rt.pixelRatio * 10
                                }
                            }
                        ],
                        position: 'relative',
                        _web: {
                            _after: {
                                fontWeight: 'bold',
                                content: rt.breakpoint,
                                color: 'white',
                                position: 'absolute',
                                top: '60%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: rt.colorScheme === 'dark' ? 'black' : 'white'
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
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        container: {
                            flex: 1,
                            display: 'flex'
                        },
                        static: {
                            backgroundColor: 'pink'
                        },
                        staticText: {
                            color: 'red'
                        },
                        theme: {
                            backgroundColor: theme.colors.backgroundColor,
                            uni__dependencies: [0]
                        },
                        themeText: {
                            color: theme.colors.typography,
                            uni__dependencies: [0]
                        },
                        themeButtonsContainer: {
                            marginTop: 20,
                            flexDirection: 'row',
                            gap: 10
                        },
                        dynamic: state => ({
                            backgroundColor: state % 2 === 0 ? theme.colors.fog : theme.colors.oak,
                            uni__dependencies: [0]
                        }),
                        whiteText: {
                            color: 'white',
                            textAlign: 'center'
                        },
                        hover: {
                            backgroundColor: theme.colors.blood,
                            cursor: 'pointer',
                            _web: {
                                _hover: {
                                    backgroundColor: theme.colors.sky,
                                    paddingTop: rt.insets.top
                                }
                            },
                            uni__dependencies: [0, 9]
                        },
                        breakpoint: {
                            backgroundColor: {
                                xs: theme.colors.blood,
                                md: theme.colors.sky,
                                xl: theme.colors.aloes
                            },
                            transform: [
                                {
                                    translateX: {
                                        xs: rt.fontScale * 10,
                                        md: rt.pixelRatio * 10
                                    }
                                }
                            ],

                            position: 'relative',
                            _web: {
                                _after: {
                                    fontWeight: 'bold',
                                    content: rt.breakpoint,
                                    color: 'white',
                                    position: 'absolute',
                                    top: '60%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: rt.colorScheme === 'dark' ? 'black' : 'white'
                                }
                            },
                            uni__dependencies: [0, 11, 10, 3, 5]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should allow user to use arrow functions with body for dynamic functions',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: () => {
                        const b = 2 + 2

                        return {
                            backgroundColor: {
                                sm: theme.colors.blue
                            },
                            padding: {
                                xs: rt.insets.top + b
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
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        container: () => {
                            const b = 2 + 2

                            return {
                                backgroundColor: {
                                    sm: theme.colors.blue
                                },
                                padding: {
                                    xs: rt.insets.top + b
                                },
                                uni__dependencies: [0, 9]
                            }
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect IME insets dependency',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        backgroundColor: theme.colors.background,
                        paddingBottom: rt.insets.ime
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
                    (theme, rt) => ({
                        container: {
                            backgroundColor: theme.colors.background,
                            paddingBottom: rt.insets.ime,
                            uni__dependencies: [0, 14]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect dependency from Array accessor',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: (headerColors, colorMap) => ({
                        backgroundColor: headerColors[rt.colorScheme],
                        paddingBottom: colorMap[theme.colors.primary]
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
                    (theme, rt) => ({
                        container: (headerColors, colorMap) => ({
                            backgroundColor: headerColors[rt.colorScheme],
                            paddingBottom: colorMap[theme.colors.primary],
                            uni__dependencies: [0, 5]
                        })
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect dependency from unary operator',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        transform: [
                            {
                                translateY: -rt.insets.ime
                            }
                        ]
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
                    (theme, rt) => ({
                        container: {
                            transform: [
                                {
                                    translateY: -rt.insets.ime
                                }
                            ],
                            uni__dependencies: [14]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect dependencies from if else statements',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container(5)}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    container: someRandomInt => {
                        if (someRandomInt === 5) {
                            return {
                                backgroundColor: theme.colors.background
                            }
                        }

                        if (someRandomInt === 10) {
                            return {
                                backgroundColor: theme.colors.barbie,
                                paddingBottom: rt.insets.bottom
                            }
                        }

                        if (someRandomInt === 15) {
                            return {
                                fontSize: rt.fontScale * 10
                            }
                        } else {
                            return {
                                backgroundColor: theme.colors.blood
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
                    return (
                        <View style={styles.container(5)}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        container: someRandomInt => {
                            if (someRandomInt === 5) {
                                return {
                                    backgroundColor: theme.colors.background,
                                    uni__dependencies: [0, 9, 11]
                                }
                            }

                            if (someRandomInt === 10) {
                                return {
                                    backgroundColor: theme.colors.barbie,
                                    paddingBottom: rt.insets.bottom,
                                    uni__dependencies: [0, 9, 11]
                                }
                            }

                            if (someRandomInt === 15) {
                                return {
                                    fontSize: rt.fontScale * 10,
                                    uni__dependencies: [0, 9, 11]
                                }
                            } else {
                                return {
                                    backgroundColor: theme.colors.blood,
                                    uni__dependencies: [0, 9, 11]
                                }
                            }
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect dependency in square brackets',
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

                const styles = StyleSheet.create((theme, rt) => ({
                    container: {
                        backgroundColor: theme.palette.purple[500]
                    },
                    container2: {
                        paddingBottom: theme.spacing[rt.breakpoint]
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
                    (theme, rt) => ({
                        container: {
                            backgroundColor: theme.palette.purple[500],
                            uni__dependencies: [0]
                        },
                        container2: {
                            paddingBottom: theme.spacing[rt.breakpoint],
                            uni__dependencies: [0, 3]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect inline spread',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        ...theme.components.container
                    },
                    container2: {
                        ...theme.components.text
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
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: {
                            ...theme.components.container,
                            uni__dependencies: [0]
                        },
                        container2: {
                            ...theme.components.text,
                            uni__dependencies: [0]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect inline theme dependencies',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: theme.components.container,
                    container2: theme.components.text.nested.deep
                }))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: { ...theme.components.container, uni__dependencies: [0] },
                        container2: { ...theme.components.text.nested.deep, uni__dependencies: [0] }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect destructured dependencies',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(({ components: { test }}, { insets: { ime }, screen: { height }, statusBar  }) => ({
                    container: {
                        backgroundColor: test
                    },
                    container2: {
                        paddingBottom: ime,
                        height,
                        width: statusBar.width
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
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    ({ components: { test } }, { insets: { ime }, screen: { height }, statusBar }) => ({
                        container: {
                            backgroundColor: test,
                            uni__dependencies: [0]
                        },
                        container2: {
                            paddingBottom: ime,
                            height,
                            width: statusBar.width,
                            uni__dependencies: [14, 6, 12]
                        }
                    }),
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect dependencies in weirdest syntax',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(({ components: { test, other: { nested }} }, { insets: { ime }, screen, statusBar: { width, height }  }) => {
                    const otherVariable = 2

                    return {
                        container: () => {
                            if (otherVariable === 2) {
                                return {
                                    backgroundColor: nested
                                }
                            }

                            if (otherVariable === 3) {
                                return {
                                    marginTop: ime,
                                    height: screen.height
                                }
                            }

                            return nested
                        },
                        container2: () => ({
                            paddingBottom: ime,
                            height,
                            width
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
                            <Text style={styles.container2}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (
                        {
                            components: {
                                test,
                                other: { nested }
                            }
                        },
                        { insets: { ime }, screen, statusBar: { width, height } }
                    ) => {
                        const otherVariable = 2

                        return {
                            container: () => {
                                if (otherVariable === 2) {
                                    return {
                                        backgroundColor: nested,
                                        uni__dependencies: [0, 14, 6]
                                    }
                                }

                                if (otherVariable === 3) {
                                    return {
                                        marginTop: ime,
                                        height: screen.height,
                                        uni__dependencies: [0, 14, 6]
                                    }
                                }

                                return { ...nested, uni__dependencies: [0, 14, 6] }
                            },
                            container2: () => ({
                                paddingBottom: ime,
                                height,
                                width,
                                uni__dependencies: [14, 12]
                            })
                        }
                    },
                    664955593
                )
            `
        },
        {
            title: 'Should correctly detect ime from destructured insets',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.keyboardAvoidingView}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, { insets }) => ({
                    keyboardAvoidingView: {
                        flex: 1,
                        paddingTop: insets.top + 16,
                        paddingLeft: insets.left + 16,
                        paddingRight: insets.right + 16,
                        paddingBottom: insets.ime || insets.bottom + 50
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
                            <Text style={styles.keyboardAvoidingView}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, { insets }) => ({
                        keyboardAvoidingView: {
                            flex: 1,
                            paddingTop: insets.top + 16,
                            paddingLeft: insets.left + 16,
                            paddingRight: insets.right + 16,
                            paddingBottom: insets.ime || insets.bottom + 50,
                            uni__dependencies: [9, 14]
                        }
                    }),
                    664955593
                )
            `
        }
    ]
})
