import React from 'react'
import { StyleSheet } from 'react-native-unistyles'
import { PressableStateCallbackType, Text, View, Pressable } from 'react-native'

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Pressable style={styles.pressable}>
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
    pressable: (state: PressableStateCallbackType) => ({
        backgroundColor: state.pressed ? 'red' : 'blue'
    })
}))
