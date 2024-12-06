import React from 'react'
import { ImageBackground, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    return (
        <View style={styles.container}>
            <ImageBackground
                style={styles.image}
                imageStyle={styles.other}
                src="https://cdn.pixabay.com/photo/2022/01/20/15/34/monkey-6952630_960_720.jpg"
            />
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        height: 400,
        width: '100%',
        borderWidth: 2,
        borderColor: theme.colors.accent
    },
    other: {
        flex: 1,
        resizeMode: "contain",
        borderWidth: 2,
        borderColor: theme.colors.typography
    }
}))
