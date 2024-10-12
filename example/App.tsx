import React from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'
import { Typography } from './Typography'

export const App = () => {
    return (
        <View style={{...styles.container, ...styles.secondProp, ...styles.thirdProp}}>
            <Typography isBold isPrimary size="large" value={3}>
                Hello World
            </Typography>
            <Typography isBold size="small" value={2}>
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
    },
    secondProp: {
        marginHorizontal: theme.gap(10),
        backgroundColor: 'red'
    },
    thirdProp: {
        backgroundColor: 'blue'
    }
}))
