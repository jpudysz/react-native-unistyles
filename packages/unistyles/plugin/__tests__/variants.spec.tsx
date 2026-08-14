import type { PluginObj } from '@babel/core'

import * as t from '@babel/types'
import { pluginTester, runPluginUnderTestHere } from 'babel-plugin-tester'

import plugin from '../src/index'

// React Compiler resolves a Babel binding for every variable declaration it lowers, and
// requires that the binding it finds is the one introduced by that very declaration
// (BuildHIR::lowerAssignment -> HIRBuilder#resolveIdentifier). Declarations injected into
// the AST without being registered in Babel's scope make it bail out with
// "(BuildHIR::lowerAssignment) Could not find binding for declaration.".
// This plugin mirrors that lookup so we can guard it without depending on React Compiler.
const assertBindingsAreRegistered = (): PluginObj => ({
    name: 'assert-bindings-are-registered',
    visitor: {
        VariableDeclarator(path) {
            if (!t.isIdentifier(path.node.id)) {
                return
            }

            const binding = path.scope.getBinding(path.node.id.name)

            // Comparing identifiers matters: looking a name up alone can resolve to an outer
            // declaration that shadows the missing one and let the check pass silently.
            if (!binding || binding.identifier !== path.node.id) {
                throw new Error(`Unistyles: no scope binding registered for declaration '${path.node.id.name}'`)
            }
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
        {
            title: 'Should register scope bindings for the shadowed stylesheet',
            babelOptions: {
                plugins: [runPluginUnderTestHere, assertBindingsAreRegistered],
            },
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return <View style={styles.container} />
                }

                const styles = StyleSheet.create({
                    container: {
                        variants: {
                            size: {
                                small: { width: 100 }
                            }
                        }
                    }
                })
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    const _styles = styles
                    {
                        const styles = _styles.useVariants({
                            size: 'small'
                        })

                        return <View style={styles.container} />
                    }
                }

                const styles = StyleSheet.create({
                    container: {
                        variants: {
                            size: {
                                small: { width: 100 }
                            }
                        },
                        uni__dependencies: [4]
                    }
                })
            `,
        },
    ],
})
