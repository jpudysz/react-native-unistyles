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
            title: 'Does nothing if there is no import from Unistyles',
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
            title: 'Adds ref if there is any import from Unistyles',
            code: `
                import 'react-native-unistyles'

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
                import 'react-native-unistyles'

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
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

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
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

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
        {
            title: 'Should not modify ref if user is using inline styles',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                backgroundColor: 'red'
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
            `,
            output: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                backgroundColor: 'red'
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
            title: 'Should not modify ref if user is not member accessing styles',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                ...obj1,
                                ...obj2
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
            `,
            output: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                ...obj1,
                                ...obj2
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
            title: 'Should not modify ref if user is not member accessing styles in array',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={[obj1, obj2]}
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
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View ref={myRef} style={[obj1, obj2]}>
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
            title: 'Should modify ref if user is using spreads on styles',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                ...styles.container,
                                ...{
                                    backgroundColor: 'red'
                                }
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
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={{
                                ...styles.container,
                                ...{
                                    backgroundColor: 'red'
                                }
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
            title: 'Should modify ref if user is using array for styles',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={[
                                styles.container,
                                {
                                    backgroundColor: 'red'
                                }
                            ]}
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
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={[
                                styles.container,
                                {
                                    backgroundColor: 'red'
                                }
                            ]}
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
            title: 'Should modify ref if user is using single style in array',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={[styles.container]}
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
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={[styles.container]}
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
            title: 'Should modify ref if user is using dynamic function in array',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={[
                                styles.container(1, 2)
                            ]}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={[styles.container(1, 2, 1)]}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `
        },
        {
            title: 'Should modify ref if user is using dynamic function in object',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={{
                                backgroundColor: 'red',
                                ...styles.container(1, 2)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={{
                                backgroundColor: 'red',
                                ...styles.container(1, 2, 1)
                            }}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `
        },
        {
            title: 'Should modify registry names if user changes name of member expression',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={uhh.dkk()}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const uhh = StyleSheet.create({
                    dkk: () => ({
                        backgroundColor: 'red'
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, uhh.dkk)
                                return () => UnistylesShadowRegistry.remove(_ref, uhh.dkk)
                            }}
                            style={uhh.dkk(1)}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const uhh = StyleSheet.create({
                    dkk: () => ({
                        backgroundColor: 'red'
                    })
                })
            `
        },
        {
            title: 'Should increment counter for web dynamic functions',
            code: `
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={myRef}
                            style={styles.container()}
                        >
                            <Text style={styles.container()}>
                                Hello world
                            </Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef = _ref
                                UnistylesShadowRegistry.add(_ref, styles.container)
                                return () => UnistylesShadowRegistry.remove(_ref, styles.container)
                            }}
                            style={styles.container(1)}
                        >
                            <Text
                                style={styles.container(2)}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(ref, styles.container)
                                    return () => UnistylesShadowRegistry.remove(ref, styles.container)
                                }}
                            >
                                Hello world
                            </Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: () => ({
                        backgroundColor: 'red'
                    })
                })
            `
        },
    ]
})
