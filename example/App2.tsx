import React from "react"
import { StyleSheet, createUnistylesElement, Variants } from 'react-native-unistyles'
import { Text, View } from 'react-native'
import './unistyles'

const UniView = createUnistylesElement(View)

export const App = () => {
    styles.useVariants({
        size: 'medium'
    })

    return (
        <Variants variants={{
            size: 'medium'
        }}>
            <UniView style={styles.container}>
                <UniView style={styles.test(1)}>
                    <Text>
                        Hello world
                    </Text>
                </UniView>
                <UniView style={styles.test(2)}>
                    <Text>
                        Hello world
                    </Text>
                </UniView>
                <UniView style={styles.test(3)}>
                    <Text>
                        Hello world
                    </Text>
                </UniView>
            </UniView>
        </Variants>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor,
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
        uni__dependencies: [0, 4],
    },
    test: (num: number) => ({
        paddingHorizontal: 10 * num,
        backgroundColor: theme.colors.accent,
        uni__dependencies: [0],
    })
}), 12)
