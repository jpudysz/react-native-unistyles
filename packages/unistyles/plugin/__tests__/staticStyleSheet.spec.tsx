import { pluginTester } from 'babel-plugin-tester'

import plugin from '../src/index'

// These tests verify that files inside `root` which only contain a static
// StyleSheet.create (no RN component imports, no theme/rt/variants) produce
// zero AST changes — i.e. forceProcessing no longer triggers on path-match
// alone; it only activates when a qualifying RN component import is seen.
//
// Additionally: when all StyleSheet.create calls in a file are purely static
// (no uni__dependencies injected), the import is rewritten from
// 'react-native-unistyles' to 'react-native' so the Unistyles registry is
// never involved.
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
            title: 'Should rewrite StyleSheet import to react-native for a purely static stylesheet',
            babelOptions: {
                filename: '/project/src/styles/common.ts',
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create({
                    container: {
                        flex: 1,
                        backgroundColor: '#fff'
                    }
                })
            `,
            output: `
                import { StyleSheet } from 'react-native'

                const styles = StyleSheet.create({
                    container: {
                        flex: 1,
                        backgroundColor: '#fff'
                    }
                })
            `,
        },
        {
            title: 'Should rewrite StyleSheet import to react-native for multiple static styles',
            babelOptions: {
                filename: '/project/src/styles/layout.ts',
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const layoutStyles = StyleSheet.create({
                    row: {
                        flexDirection: 'row',
                        alignItems: 'center'
                    },
                    center: {
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                    fill: {
                        flex: 1
                    }
                })
            `,
            output: `
                import { StyleSheet } from 'react-native'

                export const layoutStyles = StyleSheet.create({
                    row: {
                        flexDirection: 'row',
                        alignItems: 'center'
                    },
                    center: {
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                    fill: {
                        flex: 1
                    }
                })
            `,
        },
        {
            title: 'Should still rewrite RN component imports and keep unistyles StyleSheet when file also has RN components',
            babelOptions: {
                filename: '/project/src/components/Card.tsx',
            },
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Card = () => (
                    <View style={styles.container}>
                        <Text style={styles.title}>Hello</Text>
                    </View>
                )

                const styles = StyleSheet.create({
                    container: {
                        flex: 1,
                        padding: 16
                    },
                    title: {
                        fontSize: 18
                    }
                })
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Card = () => (
                    <View style={styles.container}>
                        <Text style={styles.title}>Hello</Text>
                    </View>
                )

                const styles = StyleSheet.create({
                    container: {
                        flex: 1,
                        padding: 16
                    },
                    title: {
                        fontSize: 18
                    }
                })
            `,
        },
        {
            title: 'Should inject uni__dependencies and keep unistyles import when theme is used',
            babelOptions: {
                filename: '/project/src/components/Header.tsx',
            },
            code: `
                import { View } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Header = () => <View style={styles.header} />

                const styles = StyleSheet.create(theme => ({
                    header: {
                        backgroundColor: theme.colors.primary,
                        height: 64
                    }
                }))
            `,
            output: `
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Header = () => <View style={styles.header} />

                const styles = StyleSheet.create(theme => ({
                    header: {
                        backgroundColor: theme.colors.primary,
                        height: 64,
                        uni__dependencies: [0]
                    }
                }))
            `,
        },
        {
            title: 'Should rewrite StyleSheet import to react-native for a static zero-arg function stylesheet',
            babelOptions: {
                filename: '/project/src/styles/tokens.ts',
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(() => ({
                    base: {
                        padding: 8,
                        borderRadius: 4
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native'

                const styles = StyleSheet.create(() => ({
                    base: {
                        padding: 8,
                        borderRadius: 4
                    }
                }))
            `,
        },
        {
            title: 'Should split import when StyleSheet is imported alongside other unistyles exports',
            babelOptions: {
                filename: '/project/src/styles/mixed.ts',
            },
            code: `
                import { StyleSheet, useStyles } from 'react-native-unistyles'

                const styles = StyleSheet.create({
                    box: {
                        width: 100,
                        height: 100
                    }
                })
            `,
            output: `
                import { useStyles } from 'react-native-unistyles'
                import { StyleSheet } from 'react-native'

                const styles = StyleSheet.create({
                    box: {
                        width: 100,
                        height: 100
                    }
                })
            `,
        },
    ],
})
