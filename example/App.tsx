import React, { useRef, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import './unistyles'

export const App = () => {
    const [, setCount] = useState(0)
    const renderCount = useRef(0)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Render count: {++renderCount.current}
            </Text>
            <Button title="Re-render" onPress={() => setCount(count => count + 1)} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: 'red'
    }
})
