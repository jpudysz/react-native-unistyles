import type { NodePath, PluginObj } from '@babel/core'

import { pluginTester } from 'babel-plugin-tester'

import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src',
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true,
        },
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
                        },
                        uni__dependencies: [0, 4]
                    }
                }))
            `,
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

                const s = StyleSheet.create({})
            `,
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
                        {
                            const styles = _styles.useVariants({
                                size: 'small'
                            })

                            return (
                                <View style={styles.container}>
                                    <Text>Hello world</Text>
                                    {[1, 2, 3].map((_, index) => {
                                        {
                                            const styles = _styles.useVariants({
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

                const styles = StyleSheet.create({})
            `,
        },
        {
            title: 'Should detect variants on string-literal keyed styles (#1188)',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <View style={styles['headline-large']}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    'headline-large': {
                        backgroundColor: theme.colors.background,
                        variants: {
                            size: {
                                small: {
                                    width: 100
                                },
                                large: {
                                    width: 300
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
                            <View style={styles['headline-large']}>
                                <Text>Hello world</Text>
                            </View>
                        )
                    }
                }

                const styles = StyleSheet.create((theme, rt) => ({
                    'headline-large': {
                        backgroundColor: theme.colors.background,
                        variants: {
                            size: {
                                small: {
                                    width: 100
                                },
                                large: {
                                    width: 300
                                }
                            }
                        },
                        uni__dependencies: [0, 4]
                    }
                }))
            `,
        },
        {
            title: 'Should detect variants on string-literal keyed styles in object form (#1188)',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <View style={styles['headline-large']}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    'headline-large': {
                        variants: {
                            size: {
                                small: { width: 100 },
                                large: { width: 300 }
                            }
                        }
                    }
                })
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
                            <View style={styles['headline-large']}>
                                <Text>Hello world</Text>
                            </View>
                        )
                    }
                }

                const styles = StyleSheet.create({
                    'headline-large': {
                        variants: {
                            size: {
                                small: { width: 100 },
                                large: { width: 300 }
                            }
                        },
                        uni__dependencies: [4]
                    }
                })
            `,
        },
    ],
})

// React Compiler runs in the same pass and resolves every declaration through babel's scope (#1002)
// checks on exit, so it runs after the plugin under test regardless of the plugin order
const bindingsChecker = (): PluginObj => ({
    visitor: {
        Program: {
            exit(path) {
                path.traverse({
                    VariableDeclarator(declaratorPath: NodePath) {
                        const id = declaratorPath.get('id') as NodePath

                        if (
                            id.isIdentifier() &&
                            declaratorPath.scope.getBinding(id.node.name)?.identifier !== id.node
                        ) {
                            throw new Error(`Missing binding for ${id.node.name}`)
                        }
                    },
                })
            },
        },
    },
})

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src',
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx', bindingsChecker],
    },
    tests: [
        {
            title: 'Should register bindings for scoped variants',
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ size }) => {
                    styles.useVariants({ size })

                    const label = size === 'small' ? 'S' : 'L'

                    styles.useVariants({ size: 'large' })

                    return <View style={styles.container} accessibilityLabel={label} />
                }

                const styles = StyleSheet.create({
                    container: {
                        variants: {
                            size: {
                                small: { width: 100 },
                                large: { width: 300 },
                            },
                        },
                    },
                })
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'
                import { StyleSheet } from 'react-native-unistyles'
                export const Example = ({ size }) => {
                    const _styles = styles
                    {
                        const styles = _styles.useVariants({
                            size
                        })
                        const label = size === 'small' ? 'S' : 'L'
                        {
                            const styles = _styles.useVariants({
                                size: 'large'
                            })
                            return <View style={styles.container} accessibilityLabel={label} />
                        }
                    }
                }
                const styles = StyleSheet.create({
                    container: {
                        variants: {
                            size: {
                                small: {
                                    width: 100
                                },
                                large: {
                                    width: 300
                                }
                            }
                        },
                        uni__dependencies: [4]
                    }
                })
            `,
        },
    ],
})
