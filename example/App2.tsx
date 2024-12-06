import React from "react"
import { StyleSheet } from 'react-native-unistyles'
import { Text, View, Pressable } from 'react-native'
import './unistyles'

export const App = () => {
    styles.useVariants({
        size: 'medium'
    })

    return (
        <View style={styles.container}>
            <View style={styles.test(1)}>
                <Text>
                    Hello world 1
                </Text>
            </View>
            <View style={styles.test(2)}>
                <Text>
                    Hello world 2
                </Text>
            </View>
            <View style={styles.test(3)}>
                <Text>
                    Hello world 3
                </Text>
            </View>
            <Pressable
                onPress={() => {}}
                style={state => [styles.pressable(state.pressed)]}
            >
                <Text>
                    Pressable 1
                </Text>
            </Pressable>
            <Pressable
                onPress={() => {}}
                style={state => styles.pressable(state.pressed)}
            >
                <Text>
                    Pressable 2
                </Text>
            </Pressable>
            <Pressable
                onPress={() => {}}
                style={state => styles.pressable(state.pressed)}
            >
                <Text>
                    Pressable 3
                </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor,
    },
    test: (num: number) => ({
        paddingHorizontal: 10 * num,
        backgroundColor: theme.colors.accent
    }),
    pressable: (pressed: boolean) => ({
        backgroundColor: pressed ? 'red' : 'blue',
        borderWidth: 3,
        borderColor: theme.colors.accent,
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
    })
}))
