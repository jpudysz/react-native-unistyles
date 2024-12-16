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
            title: 'Should wrap components in variants if present',
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

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <Variants variants={__uni__variants}>
                            <View style={[styles.container]}>
                                <Text>Hello world</Text>
                            </View>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should swap Variants with Fragments ',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <React.Fragment>
                            <Text style={styles.container}>Hello world</Text>
                        </React.Fragment>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <Variants variants={__uni__variants}>
                            <Text style={[styles.container]}>Hello world</Text>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should swap Variants with Fragments 2',
            code: `
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <>
                            <Text style={styles.container}>Hello world</Text>
                        </>
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

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <Variants variants={__uni__variants}>
                            <Text style={[styles.container]}>Hello world</Text>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should swap Variants with Fragments and keep key',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <React.Fragment key="asd">
                            <Text style={styles.container}>Hello world</Text>
                        </React.Fragment>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <Variants variants={__uni__variants} key="asd">
                            <Text style={[styles.container]}>Hello world</Text>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should swap Variants with Fragments and keep key',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return (
                        <Fragment key="asd">
                            <Text style={styles.container}>Hello world</Text>
                        </Fragment>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = () => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    return (
                        <Variants variants={__uni__variants} key="asd">
                            <Text style={[styles.container]}>Hello world</Text>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should work with conditionals',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    styles.useVariants({
                        size: 'small'
                    })

                    return condition
                        ? (
                            <>
                                <Text style={styles.container}>Hello world</Text>
                            </>
                        )
                        : (
                            <>
                                <Text style={styles.container}>Hello world</Text>
                            </>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)
                    if (condition) {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text style={[styles.container]}>Hello world</Text>
                            </Variants>
                        )
                    } else {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text style={[styles.container]}>Hello world</Text>
                            </Variants>
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
                    895830154
                )
            `
        },
        {
            title: 'Should work with ifs',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    styles.useVariants({
                        size: 'small'
                    })

                    if (condition) {
                        return (
                            <>
                                <Text style={styles.container}>Hello world</Text>
                            </>
                        )
                    }

                    return (
                        <>
                            <Text style={styles.container}>Hello world</Text>
                        </>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    if (condition) {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text style={[styles.container]}>Hello world</Text>
                            </Variants>
                        )
                    }

                    return (
                        <Variants variants={__uni__variants}>
                            <Text style={[styles.container]}>Hello world</Text>
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should ignore nested return statements',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    styles.useVariants({
                        size: 'small'
                    })

                    if (condition) {
                        return (
                            <>
                                <Text style={styles.container}>Hello world</Text>
                            </>
                        )
                    }

                    return (
                        <>
                            {Array.from({ length: 20 }).map((_, index) => {
                                return (
                                    <View key={index}>
                                        <Text style={{ ...index % 2 === 0 ? styles.text : {} }}>{index + 1}</Text>
                                    </View>
                                )
                            })}
                        </>
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
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = ({ condition }) => {
                    const __uni__variants = {
                        size: 'small'
                    }
                    styles.useVariants(__uni__variants)

                    if (condition) {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text style={[styles.container]}>Hello world</Text>
                            </Variants>
                        )
                    }

                    return (
                        <Variants variants={__uni__variants}>
                            {Array.from({ length: 20 }).map((_, index) => {
                                return (
                                    <View key={index}>
                                        <Text style={[index % 2 === 0 ? styles.text : {}]}>{index + 1}</Text>
                                    </View>
                                )
                            })}
                        </Variants>
                    )
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
                    895830154
                )
            `
        },
        {
            title: 'Should correctly handle complex conditions with variants',
            code: `
                import React from 'react'
                import { Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = ({ error, children, name }) => {
                    styles.useVariants({
                        error: !!error
                    });

                    return children ? (
                        <Text ref={ref} style={styles.label} {...props}>
                            {children}
                        </Text>
                    ) : (
                        <Text ref={ref} style={styles.label} {...props}>
                            {name}
                        </Text>
                    )
                }

                const styles = StyleSheet.create(theme => ({}))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import React from 'react'

                import { StyleSheet, Variants } from 'react-native-unistyles'

                export const Example = ({ error, children, name }) => {
                    const __uni__variants = {
                        error: !!error
                    }
                    styles.useVariants(__uni__variants)
                    if (children) {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text ref={ref} style={[styles.label]} {...props}>
                                    {children}
                                </Text>
                            </Variants>
                        )
                    } else {
                        return (
                            <Variants variants={__uni__variants}>
                                <Text ref={ref} style={[styles.label]} {...props}>
                                    {name}
                                </Text>
                            </Variants>
                        )
                    }
                }

                const styles = StyleSheet.create(theme => ({}), 895830154)
            `
        },
    ]
})
