import React from 'react'
import { View, Text } from 'react-native'
import { ScopedTheme, StyleSheet, UnistylesRuntime } from 'react-native-unistyles'

const ScopedText = ({ prefix }: { prefix: string }) => {
    const themeName = UnistylesRuntime.themeName

    return (
        <Text style={{ color: 'gray', fontSize: 20 }}>
            {prefix}: I'm {themeName}
        </Text>
    )
}

const NextComponent = () => {
    return (
        <Text style={{ color: 'gray', fontSize: 20 }}>
            NextComponent: I'm {UnistylesRuntime.themeName}
        </Text>
    )
}

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <ScopedText prefix="Root" />
            <ScopedTheme name="dark">
                <ScopedText prefix="ScopedText" />
            </ScopedTheme>
            <ScopedTheme name="light">
                <ScopedText prefix="ScopedText" />
                <ScopedTheme name="premium">
                    <ScopedText prefix="ScopedText" />
                </ScopedTheme>
            </ScopedTheme>
            <ScopedTheme invertedAdaptive>
                <ScopedText prefix="invertedAdaptive 1" />
                <ScopedTheme invertedAdaptive>
                    <ScopedText prefix="invertedAdaptive 2" />
                </ScopedTheme>
            </ScopedTheme>
            <NextComponent />
        </View>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundColor
    },
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    }
}))
