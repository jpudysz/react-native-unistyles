import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        autoProcessImports: ['@codemask/styles']
    },
    babelOptions: {
        plugins: ['@babel/plugin-syntax-jsx'],
        generatorOpts: {
            retainLines: true
        }
    },
    tests: [
        {
            title: 'Should respect user imports',
            code: `
                import { View, Text } from 'react-native'
                import { StyleSheet } from '@codemask/styles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
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
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { StyleSheet } from '@codemask/styles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = StyleSheet.create(
                    {
                        container: {
                            flex: 1
                        }
                    },
                    467105739
                )
            `
        },
        {
            title: 'Should respect user imports event if then changed the name',
            code: `
                import { View, Text } from 'react-native'
                import { s } from '@codemask/styles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = s.create({
                    container: {
                        flex: 1
                    }
                })
            `,
            output: `
                import { Text } from 'react-native-unistyles/components/native/Text'
                import { View } from 'react-native-unistyles/components/native/View'

                import { s } from '@codemask/styles'

                export const Example = () => {
                    return (
                        <View style={styles.container}>
                            <Text>Hello world</Text>
                        </View>
                    )
                }

                const styles = s.create(
                    {
                        container: {
                            flex: 1
                        }
                    },
                    467105739
                )
            `
        }
    ]
})
