import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                HomeScreen
            </Text>
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
    }
}))
