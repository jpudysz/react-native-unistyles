import React from 'react'
import { StyleSheet } from 'react-native-unistyles'
import { PressableStateCallbackType, Text, View, Pressable } from 'react-native'

export default function HomeScreen() {
    const height = 75
    return (
        <View style={styles.container}>
            <Pressable style={({ pressed }) => [styles.other, { height }, pressed && styles.pressable(pressed)]}>
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
    other: {
        height: 100,
        width: 100,
        backgroundColor: theme.colors.aloes
    },
    pressable: (pressed: boolean) => ({
        backgroundColor: pressed ? 'red' : 'blue'
    })
}))
