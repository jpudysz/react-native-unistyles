import { pluginTester } from 'babel-plugin-tester'
import plugin from '../'

pluginTester({
    plugin,
    pluginOptions: {
        debug: true
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true
        }
    },
    tests: [
        {
            title: 'Does nothing if there is no StyleSheet.create from Unistyles',
            code: `
                import { StyleSheet } from 'react-native'

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
                import { StyleSheet } from 'react-native'

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
            title: 'Adds ref if there is StyleSheet.create from Unistyles',
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
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(ref, styles.container)
                            }}
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
            `
        },
        {
            title: 'Adds ref if there is StyleSheet.create from Unistyles under different name',
            code: `
                import { StyleSheet as ST } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = ST.create({
                    container: {
                        backgroundColor: 'red'
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { StyleSheet as ST } from 'react-native-unistyles'

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

                const styles = ST.create({
                    container: {
                        backgroundColor: 'red'
                    }
                })
            `
        },
        {
            title: 'Preserves user\'s ref',
            code: `
                import React from 'react'
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let ref = React.useRef()

                    return (
                        <View
                            ref={_ref => {
                                ref = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
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
            `
        },
        {
            title: 'Preserves user\'s ref as function',
            code: `
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef = ref
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef = ref
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => {
                                    UnistylesShadowRegistry.remove(ref, styles.container)
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
            `
        },
        {
            title: 'Preserves user\'s ref as function with cleanup',
            code: `
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef = ref

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()

                    return (
                        <View
                            ref={ref => {
                                doSomething(ref)
                                myRef = ref
                                UnistylesShadowRegistry.add(ref, styles.container)
                                return () => {
                                    ;(() => {
                                        customCleanup()
                                    })()
                                    UnistylesShadowRegistry.remove(ref, styles.container)
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
            `
        },
        {
            title: 'Preserves user\'s ref as assigned arrow function',
            code: `
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()
                    const fn = ref => {
                        doSomething(ref)
                        myRef = ref

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()
                    const fn = ref => {
                        doSomething(ref)
                        myRef = ref
                    }

                    return (
                        <View
                            ref={_ref => {
                                fn(_ref)
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => {
                                    ;(() => {
                                        customCleanup2()
                                    })()
                                    UnistylesShadowRegistry.remove(_ref, styles.container)
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
            `
        },
        {
            title: 'Preserves user\'s ref as assigned function function',
            code: `
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()
                    function fn(ref) {
                        doSomething(ref)
                        myRef = ref

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = React.useRef()
                    function fn(ref) {
                        doSomething(ref)
                        myRef = ref
                    }

                    return (
                        <View
                            ref={_ref => {
                                fn(_ref)
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => {
                                    ;(() => {
                                        customCleanup2()
                                    })()
                                    UnistylesShadowRegistry.remove(_ref, styles.container)
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
            `
        },
    ]
})
