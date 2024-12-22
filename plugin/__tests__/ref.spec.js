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
            title: 'Does nothing if there is no import from React Native',
            code: `
                import { StyleSheet, View, Text } from 'custom-lib'

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
                import { StyleSheet, View, Text } from 'custom-lib'

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
            `
        },
        {
            title: 'Adds ref if there is any import from React Native',
            code: `
                import { View, Text } from 'react-native'

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

                export const Example = () => {
                    return (
                        <View style={[styles.container]}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        backgroundColor: 'red'
                    }
                })
            `
        },
        {
            title: 'Adds ref only for React Native components',
            code: `
                import { View } from 'react-native'
                import { Text } from 'custom-lib'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text style={styles.text}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        backgroundColor: 'red'
                    },
                   text: {
                        color: 'blue'
                    }
                })
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { Text } from 'custom-lib'

                export const Example = () => {
                    return (
                        <View style={[styles.container]}>
                            <Text style={styles.text}>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        backgroundColor: 'red'
                    },
                    text: {
                        color: 'blue'
                    }
                })
            `
        },
        {
            title: 'Preserves user\'s ref',
            code: `
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let ref = React.useRef()

                    return (
                        <View
                            ref={ref}
                            style={styles.container}
                        >
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
                import React from 'react'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let ref = React.useRef()

                    return (
                        <View ref={ref} style={[styles.container]}>
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
                    92366683
                )
            `
        },
        {
            title: 'Preserves user\'s ref as function',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef.current = ref
                            }}
                            style={styles.container}
                        >
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
                import { useRef } from 'react'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef.current = ref
                            }}
                            style={[styles.container]}
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
                    92366683
                )
            `
        },
        {
            title: 'Preserves user\'s ref as function with cleanup',
            code: `
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef.current = ref

                                return () => {
                                    customCleanup()
                                }
                            }}
                            style={styles.container}
                        >
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
                import React from 'react'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef.current = ref

                                return () => {
                                    customCleanup()
                                }
                            }}
                            style={[styles.container]}
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
                    92366683
                )
            `
        },
        {
            title: 'Preserves user\'s ref as assigned arrow function',
            code: `
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    const fn = ref => {
                        doSomething(ref)
                        myRef.current = ref

                        return () => {
                            customCleanup2()
                        }
                    }

                    return (
                        <View
                            ref={fn}
                            style={styles.container}
                        >
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
                import React from 'react'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    const fn = ref => {
                        doSomething(ref)
                        myRef.current = ref

                        return () => {
                            customCleanup2()
                        }
                    }

                    return (
                        <View ref={fn} style={[styles.container]}>
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
                    92366683
                )
            `
        },
        {
            title: 'Preserves user\'s ref as assigned function function',
            code: `
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    function fn(ref) {
                        doSomething(ref)
                        myRef.current = ref

                        return () => {
                            customCleanup2()
                        }
                    }

                    return (
                        <View
                            ref={fn}
                            style={styles.container}
                        >
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
                import React from 'react'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    function fn(ref) {
                        doSomething(ref)
                        myRef.current = ref

                        return () => {
                            customCleanup2()
                        }
                    }

                    return (
                        <View ref={fn} style={[styles.container]}>
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
                    92366683
                )
            `
        },
        {
            title: 'Should keep order of spreads',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={{...styles.container, ...styles.secondProp, ...styles.thirdProp}} />
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.backgroundColor
                    },
                    secondProp: {
                        marginHorizontal: theme.gap(10),
                        backgroundColor: 'red'
                    },
                    thirdProp: {
                        backgroundColor: 'blue'
                    }
                }))
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return <View style={[styles.container, styles.secondProp, styles.thirdProp]} />
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: {
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.backgroundColor,
                            uni__dependencies: [0]
                        },
                        secondProp: {
                            marginHorizontal: theme.gap(10),
                            backgroundColor: 'red',
                            uni__dependencies: [0]
                        },
                        thirdProp: {
                            backgroundColor: 'blue'
                        }
                    }),
                    92366683
                )
            `
        },
        {
            title: 'Should support nested styles',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ styles }) => {
                    return (
                        <View style={styles.nested.prop} />
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.backgroundColor
                    }
                }))
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ styles }) => {
                    return <View style={[styles.nested.prop]} />
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: {
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.backgroundColor,
                            uni__dependencies: [0]
                        }
                    }),
                    92366683
                )
            `
        },
        {
            title: 'Should support conditional styles',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    return (
                        <View style={condition ? styles.container : {}} />
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.backgroundColor
                    }
                }))
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    return <View style={[condition ? styles.container : {}]} />
                }

                const styles = StyleSheet.create(
                    theme => ({
                        container: {
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.backgroundColor,
                            uni__dependencies: [0]
                        }
                    }),
                    92366683
                )
            `
        }
    ]
})
