import React from 'react'
import { PressableStateCallbackType, Text, View } from 'react-native'
import { Pressable, StyleSheet } from 'react-native-unistyles'

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
    pressable: (state: PressableStateCallbackType, a?: any) => ({
        backgroundColor: state.pressed ? 'red' : 'blue'
    })
}))
