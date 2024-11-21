import React from 'react'
import { PressableStateCallbackType, Text, View } from 'react-native'
import { Pressable, StyleSheet } from 'react-native-unistyles'

const getBoundArgs = (fn: Function) => {
    const boundArgs = [] as Array<any>

    fn.bind = function(thisArg, ...args) {
        boundArgs.push(...args)

        const newFn = Function.prototype.bind.apply(fn, [thisArg, ...args])

        newFn.getBoundArgs = function() {
            return boundArgs
        }

        return newFn
    }

    return fn
}

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Pressable
                // style={state => styles.pressable(state)}
                style={state => {
                    return getBoundArgs(styles.pressable).bind(undefined, state)
                }}
            >
                <Text style={styles.text}>
                    HomeScreen
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
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    pressable: (state: PressableStateCallbackType, a?: any) => ({
        backgroundColor: state.pressed ? 'red' : 'blue'
    })
}))
