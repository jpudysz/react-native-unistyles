import React from 'react'
import { PlatformColor, Text, View } from 'react-native'
import { StyleSheet, UnistylesRuntime, mq } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    console.log(JSON.stringify(styles))

    return (
        <View style={styles.container}>
            <Text>
                Current breakpoint: {UnistylesRuntime.breakpoint}
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
    nestedProps: {
        backgroundColor: {
            [mq.only.width('sm', 200)]: theme.colors.accent,
            sm: PlatformColor('label')
        }
    },
}))
