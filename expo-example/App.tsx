import { Button, Text, View } from 'react-native'
import './unistyles'
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { useState } from 'react'

export default function App() {
    const [state, setState] = useState(0)

    return (
        <View style={styles.box}>
            <Text style={styles.text}>Static style</Text>
            <Text style={styles.dynamicText(state)}>Dynamic function style</Text>
            <Button
                title={`Clicked ${state} times`}
                onPress={() => setState(state + 1)}
            />
            <Button
                title='Set dark theme'
                onPress={() => UnistylesRuntime.setTheme('dark')}
            />
            <Button
                title='Set light theme'
                onPress={() => UnistylesRuntime.setTheme('light')}
            />
            <Button
                title='Set premium theme'
                onPress={() => UnistylesRuntime.setTheme('premium')}
            />
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    box: {
        backgroundColor: theme.colors.backgroundColor,
        _hover: {
            backgroundColor: {
                xs: 'red',
                md: 'green',
                lg: 'blue'
            },
        }
    },
    text: {
        color: theme.colors.typography
    },
    dynamicText: (test: number) => ({
        color: test % 2 === 0 ? {
            xs: 'red',
            md: 'green',
            lg: 'blue'
        } : {
            xs: 'orange',
            md: 'yellow',
            lg: 'purple'
        }
    })
}))
