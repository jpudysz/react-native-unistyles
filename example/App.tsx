import React from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'
import { Typography } from './Typography'

export const App = () => {
    return (
        <View style={styles.container}>
            <Typography isBold isPrimary size="large">
                Hello World
            </Typography>
            <Typography isBold size="small">
                Hello World 2
            </Typography>
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundColor
    }
}))
