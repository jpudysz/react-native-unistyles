import React from 'react'
import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    console.log(styles)

    return (
        <View style={styles.container}>
            <Text style={styles.text(2)}>
                Hello from Unistyles 3.0!
            </Text>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: (a: number) => ({
        color: theme.colors.typography,
        marginTop: theme.gap(1) * a
    })
}))
