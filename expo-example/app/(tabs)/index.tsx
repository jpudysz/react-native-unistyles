import React from 'react'
import { View, Text, Button } from 'react-native'
import { ScopedTheme, StyleSheet, useUnistyles, withUnistyles } from 'react-native-unistyles'

const StyledText = withUnistyles(Text, (theme, rt) => ({
    children: rt.themeName
}))

const ScopedText = ({ prefix, expected }: { prefix: string; expected: string }) => {
    const { rt } = useUnistyles()

    rt.isPortrait

    return (
        <Text style={{ color: 'gray', fontSize: 20 }}>
            {prefix}: I'm {rt.themeName} ({expected})
        </Text>
    )
}

export default function HomeScreen() {
    const [count, setCount] = React.useState(0)

    return (
        <View style={styles.container}>
            <ScopedText prefix="Root" expected="adaptive" />
            <ScopedTheme name={count % 2 === 0 ? 'dark' : 'light'}>
                <ScopedText prefix="ScopedText" expected={count % 2 === 0 ? 'dark' : 'light'} />
            </ScopedTheme>
            <ScopedTheme name="light">
                <ScopedText prefix="ScopedText" expected="light" />
                <ScopedTheme name="premium">
                    <ScopedText prefix="ScopedText" expected="premium" />
                </ScopedTheme>
            </ScopedTheme>
            <ScopedTheme invertedAdaptive>
                <ScopedText prefix="invertedAdaptive 1" expected="inverted-adaptive" />
                <ScopedTheme invertedAdaptive>
                    <ScopedText prefix="invertedAdaptive 2" expected="inverted-adaptive" />
                </ScopedTheme>
            </ScopedTheme>
            <ScopedText prefix="NextComponent" expected="adaptive" />
            <ScopedTheme invertedAdaptive>
                <StyledText style={{ color: 'red' }} />
            </ScopedTheme>
            <Button title="Increment" onPress={() => setCount(count + 1)} />
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor
    },
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    }
}))
