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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { Text } from 'custom-lib'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    let ref = React.useRef()

                    return (
                        <View
                            ref={_ref => {
                                ref.current = _ref
                                UnistylesShadowRegistry.add(_ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(_ref)
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
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
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => {
                                    UnistylesShadowRegistry.remove(ref)
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
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
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => {
                                    ;(() => {
                                        customCleanup()
                                    })()
                                    UnistylesShadowRegistry.remove(ref)
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    const fn = ref => {
                        doSomething(ref)
                        myRef.current = ref
                    }

                    return (
                        <View
                            ref={_ref => {
                                fn(_ref)
                                UnistylesShadowRegistry.add(_ref, [styles.container], undefined, [[]])
                                return () => {
                                    ;(() => {
                                        customCleanup2()
                                    })()
                                    UnistylesShadowRegistry.remove(_ref)
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import React from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = React.useRef()
                    function fn(ref) {
                        doSomething(ref)
                        myRef.current = ref
                    }

                    return (
                        <View
                            ref={_ref => {
                                fn(_ref)
                                UnistylesShadowRegistry.add(_ref, [styles.container], undefined, [[]])
                                return () => {
                                    ;(() => {
                                        customCleanup2()
                                    })()
                                    UnistylesShadowRegistry.remove(_ref)
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
            title: 'Should not modify ref if user is using inline styles',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(
                                    _ref,
                                    [
                                        {
                                            backgroundColor: 'red'
                                        }
                                    ],
                                    undefined,
                                    [[]]
                                )
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[{ backgroundColor: 'red' }]}
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
            title: 'Should modify ref if user is not member accessing styles',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [obj1, obj2], undefined, [[], []])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[obj1, obj2]}
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
            title: 'Should modify ref if user is not member accessing styles in array',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [obj1, obj2], undefined, [[], []])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[obj1, obj2]}
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
            title: 'Should modify ref if user is using spreads on styles',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(
                                    _ref,
                                    [
                                        styles.container,
                                        {
                                            backgroundColor: 'red'
                                        }
                                    ],
                                    undefined,
                                    [[], []]
                                )
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[styles.container, { backgroundColor: 'red' }]}
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
            title: 'Should modify ref if user is using array for styles',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(
                                    _ref,
                                    [
                                        styles.container,
                                        {
                                            backgroundColor: 'red'
                                        }
                                    ],
                                    undefined,
                                    [[], []]
                                )
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[styles.container, { backgroundColor: 'red' }]}
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
            title: 'Should modify ref if user is using single style in array',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={myRef}
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
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(_ref)
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
            title: 'Should modify ref if user is using dynamic function in array',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [styles.container], undefined, [[1, 2]])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[styles.container(1, 2)]}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: () => ({
                            backgroundColor: 'red'
                        })
                    },
                    92366683
                )
            `
        },
        {
            title: 'Should modify ref if user is using dynamic function in object',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                    container: {
                        backgroundColor: 'red'
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(
                                    _ref,
                                    [
                                        {
                                            backgroundColor: 'red'
                                        },
                                        styles.container
                                    ],
                                    undefined,
                                    [[], [1, 2]]
                                )
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[{ backgroundColor: 'red' }, styles.container(1, 2)]}
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
            title: 'It should extract variants and pass them to ShadowRegistry',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    styles.useVariants({
                        size: 'default'
                    })

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
                        backgroundColor: 'red',
                        variants: {
                            size: {
                                small: {
                                    backgroundColor: 'blue'
                                },
                                default: {
                                    backgroundColor: 'green'
                                }
                            }
                        }
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()
                    const __uni__variants = {
                        size: 'default'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [uhh.dkk], __uni__variants, [[]])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[uhh.dkk()]}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const uhh = StyleSheet.create(
                    {
                        dkk: () => ({
                            backgroundColor: 'red',
                            variants: {
                                size: {
                                    small: {
                                        backgroundColor: 'blue'
                                    },
                                    default: {
                                        backgroundColor: 'green'
                                    }
                                }
                            },
                            uni__dependencies: [4]
                        })
                    },
                    92366683
                )
            `
        },
        {
            title: 'Should modify registry names if user changes name of member expression',
            code: `
                import { useRef } from 'react'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

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
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const myRef = useRef()

                    return (
                        <View
                            ref={_ref => {
                                myRef.current = _ref
                                UnistylesShadowRegistry.add(_ref, [uhh.dkk], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[uhh.dkk()]}
                        >
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const uhh = StyleSheet.create(
                    {
                        dkk: () => ({
                            backgroundColor: 'red'
                        })
                    },
                    92366683
                )
            `
        },
        {
            title: 'Should pass ref for dynamic functions to bind it to shadow node',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <React.Fragment>
                            <View style={styles.container(1, 5)} />
                            <View style={styles.container(2, 6)} />
                            <View style={styles.container(5, 1)} />
                        </React.Fragment>
                    )
                }

                const styles = StyleSheet.create({
                    container: (flex, gap) => ({
                        flex,
                        gap
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <React.Fragment>
                            <View
                                style={[styles.container(1, 5)]}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[1, 5]])
                                    return () => UnistylesShadowRegistry.remove(ref)
                                }}
                            />
                            <View
                                style={[styles.container(2, 6)]}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[2, 6]])
                                    return () => UnistylesShadowRegistry.remove(ref)
                                }}
                            />
                            <View
                                style={[styles.container(5, 1)]}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[5, 1]])
                                    return () => UnistylesShadowRegistry.remove(ref)
                                }}
                            />
                        </React.Fragment>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: (flex, gap) => ({
                            flex,
                            gap
                        })
                    },
                    92366683
                )
            `
        },
        {
            title: 'Should pass refs for dynamic functions',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <React.Fragment>
                            <View style={[styles.container(1, 5), styles.container2(1, 6)]} />
                        </React.Fragment>
                    )
                }

                const styles = StyleSheet.create({
                    container: (flex, gap) => ({
                        flex,
                        gap
                    })
                })
            `,
            output: `
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <React.Fragment>
                            <View
                                style={[styles.container(1, 5), styles.container2(1, 6)]}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(ref, [styles.container, styles.container2], undefined, [
                                        [1, 5],
                                        [1, 6]
                                    ])
                                    return () => UnistylesShadowRegistry.remove(ref)
                                }}
                            />
                        </React.Fragment>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: (flex, gap) => ({
                            flex,
                            gap
                        })
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container, styles.secondProp, styles.thirdProp]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container, styles.secondProp, styles.thirdProp], undefined, [[], [], []])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        />
                    )
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ styles }) => {
                    return (
                        <View
                            style={[styles.nested.prop]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.nested.prop], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        />
                    )
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    return (
                        <View
                            style={[condition ? styles.container : {}]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [condition ? styles.container : {}], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        />
                    )
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
            title: 'Should support conditional styles on existing refs',
            code: `
                import { useRef } from 'react'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    const ref = useRef()
                    return (
                        <View ref={ref} style={condition ? styles.container : {}} />
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    const ref = useRef()
                    return (
                        <View
                            ref={_ref => {
                                ref.current = _ref
                                UnistylesShadowRegistry.add(_ref, [condition ? styles.container : {}], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[condition ? styles.container : {}]}
                        />
                    )
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
            title: 'Should pass identifiers to ShadowRegistry',
            code: `
                import { useRef } from 'react'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ extraStyle }) => {
                    const ref = useRef()
                    return (
                        <View ref={ref} style={[styles.container, extraStyle]} />
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { useRef } from 'react'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ extraStyle }) => {
                    const ref = useRef()
                    return (
                        <View
                            ref={_ref => {
                                ref.current = _ref
                                UnistylesShadowRegistry.add(_ref, [styles.container, extraStyle], undefined, [[], []])
                                return () => UnistylesShadowRegistry.remove(_ref)
                            }}
                            style={[styles.container, extraStyle]}
                        />
                    )
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
