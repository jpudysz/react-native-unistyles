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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet as ST } from 'react-native-unistyles'

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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

                const styles = StyleSheet.create(
                    (_, rt) => ({
                        container: () => ({
                            backgroundColor: 'red',
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [4, 9]
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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

                const styles = StyleSheet.create(
                    (hhsa, dee) => ({
                        container: () => ({
                            backgroundColor: hhsa.colors.background,
                            variants: {},
                            paddingTop: dee.colorScheme === 'dark' ? 0 : 10,
                            uni__dependencies: [0, 4, 5]
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

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

                const styles = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
                        })
                    }
                }, 798826616)
                const styles2 = StyleSheet.create((theme, rt) => {
                    return {
                        container: () => ({
                            backgroundColor: theme.colors.background,
                            variants: {},
                            paddingTop: rt.insets.top,
                            uni__dependencies: [0, 4, 9]
                        })
                    }
                }, 798826617)
            `
        },
        {
            title: 'Should wrap pressable with getBoundArgs if dynamic function is already called',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={styles.pressable(1, 2)}>
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
                        pressable: (arg1, arg2) => ({
                            marginRight: arg1 + arg2
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={() => getBoundArgs(styles.pressable).bind(undefined, 1, 2)} rawStyle={[styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (arg1, arg2) => ({
                            marginRight: arg1 + arg2
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should wrap pressable with getBoundArgs if style is dynamic function wrapper in arrow function',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={() => styles.pressable(1, 2)}>
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
                        pressable: (arg1, arg2) => ({
                            marginRight: arg1 + arg2
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={() => getBoundArgs(styles.pressable).bind(undefined, 1, 2)} rawStyle={[styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (arg1, arg2) => ({
                            marginRight: arg1 + arg2
                        })
                    }
                }, 798826616)
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
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={() => styles.pressable} rawStyle={[styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: {
                            marginRight: arg1 + arg2
                        }
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should pass pressable state to dynamic function and be wrapper in getBoundArgs',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={state => styles.pressable(state)}>
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
                        pressable: state => ({
                            marginRight: state.pressed ? 10 : 20
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={state => getBoundArgs(styles.pressable).bind(undefined, state)} rawStyle={state => [styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: state => ({
                            marginRight: state.pressed ? 10 : 20
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should pass all arguments to dynamic function and be wrapper in getBoundArgs',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={state => styles.pressable(state, 1)}>
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
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={state => getBoundArgs(styles.pressable).bind(undefined, state, 1)} rawStyle={state => [styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should check if pressable takes dynamic function and do nothing if its object',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={styles.pressable}>
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
                            marginRight: 20
                        }
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable
                                style={state => (typeof styles.pressable === 'function' ? getBoundArgs(styles.pressable).bind(undefined, state) : styles.pressable)}
                                rawStyle={[styles.pressable]}
                            >
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: {
                            marginRight: 20
                        }
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should pass pressable with dependencies',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={state => styles.pressable(state.pressed, 1)}>
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
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={state => getBoundArgs(styles.pressable).bind(undefined, state.pressed, 1)} rawStyle={state => [styles.pressable]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background,
                            uni__dependencies: [0]
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should pass variants to pressable',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({})

                    return (
                        <View style={styles.container}>
                            <Pressable style={state => styles.pressable(state.pressed, 1)}>
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
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {}
                    styles.useVariants(__uni__variants)

                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], __uni__variants, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable
                                style={state => getBoundArgs(styles.pressable).bind(undefined, state.pressed, 1)}
                                variants={__uni__variants}
                                rawStyle={state => [styles.pressable]}
                            >
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background,
                            uni__dependencies: [0]
                        })
                    }
                }, 798826616)
            `
        },
        {
            title: 'Should pass more raw styles to pressable',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Pressable style={[styles.pressable, styles.container]}>
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
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background
                        })
                    }
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable style={[styles.pressable, styles.container]} rawStyle={[styles.pressable, styles.container]}>
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
                            uni__dependencies: [0, 4, 9]
                        }),
                        pressable: (state, times) => ({
                            marginRight: state.pressed ? 10 : 20 * times,
                            backgroundColor: state.pressed ? theme.colors.barbie : theme.colors.background,
                            uni__dependencies: [0]
                        })
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
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    typeof styles.sectionItem === 'function' ? getBoundArgs(styles.sectionItem).bind(undefined) : styles.sectionItem,
                                    getBoundArgs(styles.other).bind(undefined, 1),
                                    { height },
                                    pressed && (typeof styles.pressed === 'function' ? getBoundArgs(styles.pressed).bind(undefined) : styles.pressed)
                                ]}
                                rawStyle={({ pressed }) => [styles.sectionItem, styles.other, { height }, pressed && styles.pressed]}
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
            title: 'Should handle nested function with getBoundArgs',
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
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    typeof styles.sectionItem === 'function' ? getBoundArgs(styles.sectionItem).bind(undefined) : styles.sectionItem,
                                    { height },
                                    pressed && styles.pressed(pressed),
                                    pressed
                                        ? typeof styles.pressed === 'function'
                                            ? getBoundArgs(styles.pressed).bind(undefined)
                                            : styles.pressed
                                        : typeof styles.notPressed === 'function'
                                        ? getBoundArgs(styles.notPressed).bind(undefined)
                                        : styles.notPressed
                                ]}
                                rawStyle={({ pressed }) => [styles.sectionItem, { height }, pressed && styles.pressed, pressed ? styles.pressed : styles.notPressed]}
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
            title: 'Should handle nested function with getBoundArgs with no arg',
            code: `
                import { View, Pressable, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    const pressed = true

                    return (
                        <View style={styles.container}>
                            <Pressable style={() => [styles.sectionItem, { height }, pressed && styles.pressed(pressed), pressed ? styles.pressed : styles.notPressed]}>
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
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    const pressed = true

                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <Pressable
                                style={() => [
                                    typeof styles.sectionItem === 'function' ? getBoundArgs(styles.sectionItem).bind(undefined) : styles.sectionItem,
                                    { height },
                                    pressed && styles.pressed(pressed),
                                    pressed
                                        ? typeof styles.pressed === 'function'
                                            ? getBoundArgs(styles.pressed).bind(undefined)
                                            : styles.pressed
                                        : typeof styles.notPressed === 'function'
                                        ? getBoundArgs(styles.notPressed).bind(undefined)
                                        : styles.notPressed
                                ]}
                                rawStyle={[styles.sectionItem, { height }, pressed && styles.pressed, pressed ? styles.pressed : styles.notPressed]}
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
            title: 'Should handle all the weird syntaxes',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View style={styles.container}>
                            <View style={[styles.sectionItem, { height }, pressed && styles.pressed, pressed ? styles.pressed : styles.notPressed]}>
                                <Text>Hello world</Text>
                            </View>
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
                import { UnistylesShadowRegistry } from 'react-native-unistyles'
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ height }) => {
                    return (
                        <View
                            style={[styles.container]}
                            ref={ref => {
                                UnistylesShadowRegistry.add(ref, [styles.container], undefined, [[]])
                                return () => UnistylesShadowRegistry.remove(ref)
                            }}
                        >
                            <View
                                style={[styles.sectionItem, { height }, pressed && styles.pressed, pressed ? styles.pressed : styles.notPressed]}
                                ref={ref => {
                                    UnistylesShadowRegistry.add(
                                        ref,
                                        [styles.sectionItem, { height }, pressed && styles.pressed, pressed ? styles.pressed : styles.notPressed],
                                        undefined,
                                        [[], [], [], []]
                                    )
                                    return () => UnistylesShadowRegistry.remove(ref)
                                }}
                            >
                                <Text>Hello world</Text>
                            </View>
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
            title: 'Should handle other pressable cases',
            code: `
                import { View, Pressable } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View>
                            <Pressable style={state => state.pressed ? styles.pressed : { height: 20 }} />
                            <Pressable style={() => {
                                return style.pressed
                            }} />
                            <Pressable style={state => {
                                return style.pressed
                            }} />
                            <Pressable style={state => state.pressed ? { height: 20 }: styles.pressedFn(1, 2)} />
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    pressed: {
                        width: 100,
                        height: 100
                    },
                    pressedFn: (a, b) => ({
                        marginBottom: a + b
                    })
                }))
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View>
                            <Pressable
                                style={state =>
                                    state.pressed
                                        ? typeof styles.pressed === 'function'
                                            ? getBoundArgs(styles.pressed).bind(undefined)
                                            : styles.pressed
                                        : { height: 20 }
                                }
                                rawStyle={state => [state.pressed ? styles.pressed : { height: 20 }]}
                            />
                            <Pressable
                                style={() => {
                                    return style.pressed
                                }}
                                rawStyle={[style.pressed]}
                            />
                            <Pressable
                                style={state => {
                                    return style.pressed
                                }}
                                rawStyle={state => [style.pressed]}
                            />
                            <Pressable
                                style={state => (state.pressed ? { height: 20 } : getBoundArgs(styles.pressedFn).bind(undefined, 1, 2))}
                                rawStyle={state => [state.pressed ? { height: 20 } : styles.pressedFn]}
                            />
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    (theme, rt) => ({
                        pressed: {
                            width: 100,
                            height: 100
                        },
                        pressedFn: (a, b) => ({
                            marginBottom: a + b
                        })
                    }),
                    798826616
                )
            `
        },
        {
            title: 'Should handle pressable with identifiers',
            code: `
                import { View, Pressable } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ containerStyles }) => {
                    const onPressInternal = () => {}
                    return (
                        <View>
                            <Pressable style={[styles.inputContainer, containerStyles]} onPress={onPressInternal} />
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    inputContainer: {}
                })
            `,
            output: `
                import { UnistylesShadowRegistry, Pressable, getBoundArgs } from 'react-native-unistyles'
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ containerStyles }) => {
                    const onPressInternal = () => {}
                    return (
                        <View>
                            <Pressable
                                style={[styles.inputContainer, containerStyles]}
                                onPress={onPressInternal}
                                rawStyle={[styles.inputContainer, containerStyles]}
                            />
                        </View>
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
