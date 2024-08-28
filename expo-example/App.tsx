import { Button, Text, View } from 'react-native'
import './unistyles'
import { StyleSheet } from 'react-native-unistyles'
import { useState } from 'react'

export default function App() {
    const [state, setState] = useState(0)

    return (
        <View>
            <Text style={stylesheet.text}>Static red</Text>
            <Text style={stylesheet.dynamicText(state)}>Dynamic red / blue</Text>
            <Button
                title={`Clicked ${state} times`}
                onPress={() => setState(state + 1)}
            />
        </View>
    )
}

const stylesheet = StyleSheet.create({
    text: {
        color: 'red'
    },
    dynamicText: (test: number) => ({
        color: test % 2 === 0 ? 'red' : 'blue'
    })
})
