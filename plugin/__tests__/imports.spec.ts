import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src/index'

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
            title: 'Should ignore imports from react-native like libraries',
            code: `
                import { View } from 'react-native-custom'
                import { FlatList } from 'react-native-gesture-handler'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return (
                        <View style={styles.container} />
                    )
                }

                const styles = StyleSheet.create({
                    container: {
                        flex: 1
                    }
                })
            `,
            output: `
                import { View } from 'react-native-custom'
                import { FlatList } from 'react-native-gesture-handler'
                import { StyleSheet } from 'react-native-unistyles'

                export const Example = () => {
                    return <View style={styles.container} />
                }

                const styles = StyleSheet.create(
                    {
                        container: {
                            flex: 1
                        }
                    },
                    75510274
                )
            `
        }
    ]
})
