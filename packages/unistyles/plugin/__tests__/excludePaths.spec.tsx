import { pluginTester } from 'babel-plugin-tester'

import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src',
        excludePaths: ['src/constants', 'src/tokens'],
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true,
        },
    },
    tests: [
        {
            title: 'Should leave a static StyleSheet.create completely untouched when its file matches excludePaths',
            babelOptions: {
                filename: '/project/src/constants/styles.ts',
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
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create({
                    container: {
                        flex: 1,
                        backgroundColor: '#fff'
                    }
                })
            `,
        },
        {
            title: 'Should not rewrite RN component imports when file matches excludePaths',
            babelOptions: {
                filename: '/project/src/constants/layout.tsx',
            },
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Layout = () => {
                    return (
                        <View>
                            <Text>hello</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        flex: 1
                    }
                })
            `,
            output: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Layout = () => {
                    return (
                        <View>
                            <Text>hello</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        flex: 1
                    }
                })
            `,
        },
        {
            title: 'Should not inject uni__dependencies when file matches excludePaths, even with theme usage',
            babelOptions: {
                filename: '/project/src/tokens/typography.ts',
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    text: {
                        color: theme.colors.primary,
                        fontSize: 14
                    }
                }))
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                const styles = StyleSheet.create(theme => ({
                    text: {
                        color: theme.colors.primary,
                        fontSize: 14
                    }
                }))
            `,
        },
        {
            title: 'Should still fully process files in root that do NOT match excludePaths',
            babelOptions: {
                filename: '/project/src/components/Button.tsx',
            },
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from 'react-native-unistyles'

                export const Button = () => {
                    return (
                        <View>
                            <Text>Click me</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        backgroundColor: theme.colors.primary
                    }
                }))
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from 'react-native-unistyles'

                export const Button = () => {
                    return (
                        <View>
                            <Text>Click me</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(theme => ({
                    container: {
                        backgroundColor: theme.colors.primary,
                        uni__dependencies: [0]
                    }
                }))
            `,
        },
        {
            title: 'Should match excludePaths as a substring across nested directories',
            babelOptions: {
                filename: '/project/src/constants/design-tokens/spacing.ts',
            },
            code: `
                import { StyleSheet } from 'react-native-unistyles'

                export const spacing = StyleSheet.create({
                    base: {
                        padding: 16,
                        margin: 8
                    }
                })
            `,
            output: `
                import { StyleSheet } from 'react-native-unistyles'

                export const spacing = StyleSheet.create({
                    base: {
                        padding: 16,
                        margin: 8
                    }
                })
            `,
        },
    ],
})
