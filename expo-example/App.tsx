import { Button, Text, View } from 'react-native'
import './unistyles'
import { StyleSheet } from 'react-native-unistyles'
import { useState } from 'react'

export default function App() {
    const [state, setState] = useState(0)

    return (
        <View>
            <Text style={stylesheet.text}>Static aloes</Text>
            <Text style={stylesheet.dynamicText(state)}>Dynamic barbie / oak</Text>
            <Button
                title={`Clicked ${state} times`}
                onPress={() => setState(state + 1)}
            />
        </View>
    )
}

const stylesheet = StyleSheet.create((theme) => ({
    text: {
        color: theme.colors.aloes
    },
    dynamicText: (test: number) => ({
        color: test % 2 === 0 ? theme.colors.barbie : theme.colors.oak
    })
}))
